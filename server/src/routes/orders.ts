import { Router } from 'express';
import { db } from '../db/index.js';
import { orders, orderItems, productVariants, users } from '../db/schema.js';
import { eq, and, like, or, sql, gte, lte } from 'drizzle-orm';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';
import { sendOrderConfirmationEmail } from '../lib/mailer.js';
import crypto from 'crypto';

const router = Router();

// ---- Razorpay Setup ----
const isProd = process.env.NODE_ENV === 'production';
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || (isProd ? process.env.RAZORPAY_KEY_ID_PROD : process.env.RAZORPAY_KEY_ID_DEV);
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || (isProd ? process.env.RAZORPAY_KEY_SECRET_PROD : process.env.RAZORPAY_KEY_SECRET_DEV);

// Razorpay uses Basic Auth for API calls
const razorpayAuth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ABP-${ts}-${rand}`;
}

// =============================================
// PUBLIC: Storefront Checkout
// =============================================

// POST /checkout — Create order from storefront cart
router.post('/checkout', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      guestName, guestEmail, guestPhone,
      shippingName, shippingPhone, shippingLine1, shippingLine2,
      shippingCity, shippingState, shippingPinCode,
      paymentMethod, customerNotes, items,
    } = req.body;

    // Validation
    if (!shippingName || !shippingPhone || !shippingLine1 || !shippingCity || !shippingState || !shippingPinCode) {
      res.status(400).json({ message: 'Complete shipping address is required' });
      return;
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Order must contain at least one item' });
      return;
    }
    if (!paymentMethod || !['RAZORPAY', 'COD'].includes(paymentMethod)) {
      res.status(400).json({ message: 'Payment method must be RAZORPAY or COD' });
      return;
    }

    // Calculate totals server-side for integrity
    let subtotal = 0;
    const orderItemValues: any[] = [];

    for (const item of items) {
      const lineTotal = parseFloat(item.unitPrice) * item.quantity;
      const gstRate = parseFloat(item.gstRate || '18');
      subtotal += lineTotal;

      orderItemValues.push({
        productId: item.productId,
        variantId: item.variantId || null,
        productName: item.productName,
        variantLabel: item.variantLabel || null,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        gstRate: gstRate.toString(),
        totalPrice: lineTotal.toString(),
        imageUrl: item.imageUrl || null,
      });
    }

    // Extract GST from inclusive prices
    // Average GST rate across all items (simplified)
    const avgGstRate = items.reduce((sum: number, i: any) => sum + parseFloat(i.gstRate || '18'), 0) / items.length;
    const gstAmount = subtotal - subtotal / (1 + avgGstRate / 100);

    // Shipping: free above ₹5000
    const shippingCharge = subtotal >= 5000 ? 0 : 150;
    const totalAmount = subtotal + shippingCharge;

    const orderNumber = generateOrderNumber();

    // Create order with items inside transaction
    const newOrder = await db.transaction(async (tx) => {
      const [createdOrder] = await tx.insert(orders).values({
        orderNumber,
        userId: req.user?.userId || null,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
        guestName: guestName || null,
        status: paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING',
        shippingName,
        shippingPhone,
        shippingLine1,
        shippingLine2: shippingLine2 || null,
        shippingCity,
        shippingState,
        shippingPinCode,
        subtotal: subtotal.toString(),
        gstAmount: gstAmount.toFixed(2),
        shippingCharge: shippingCharge.toString(),
        totalAmount: totalAmount.toString(),
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
        customerNotes: customerNotes || null,
      }).returning();

      // Insert order items
      for (const item of orderItemValues) {
        await tx.insert(orderItems).values({
          orderId: createdOrder.id,
          ...item,
        });
      }

      // Decrease stock for each variant
      for (const item of items) {
        if (item.variantId) {
          await tx.execute(
            sql`UPDATE product_variants SET stock_quantity = stock_quantity - ${item.quantity} WHERE id = ${item.variantId} AND stock_quantity >= ${item.quantity}`
          );
        }
      }

      return createdOrder;
    });

    logger.info('Orders', `Checkout order created: ${orderNumber}`, { method: paymentMethod, total: totalAmount });

    // Fire-and-forget: send order confirmation email for COD orders
    if (paymentMethod === 'COD' && guestEmail) {
      sendOrderConfirmationEmail({
        orderNumber,
        customerName: guestName || shippingName,
        customerEmail: guestEmail,
        items: orderItemValues.map((item: { productName: string; variantLabel: string | null; quantity: number; unitPrice: string; totalPrice: string; imageUrl: string | null }) => ({
          productName: item.productName,
          variantLabel: item.variantLabel,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          imageUrl: item.imageUrl,
        })),
        subtotal: subtotal.toString(),
        gstAmount: gstAmount.toFixed(2),
        shippingCharge: shippingCharge.toString(),
        totalAmount: totalAmount.toString(),
        paymentMethod: 'COD',
        shippingAddress: { name: shippingName, phone: shippingPhone, line1: shippingLine1, line2: shippingLine2 || null, city: shippingCity, state: shippingState, pinCode: shippingPinCode },
      });
    }

    res.status(201).json(newOrder);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Orders', 'Error creating checkout order', { error: err.message });
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// POST /create-razorpay-order — Create Razorpay payment order
router.post('/create-razorpay-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ message: 'orderId is required' });
      return;
    }

    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Amount in paise (smallest currency unit)
    const amountInPaise = Math.round(parseFloat(order.totalAmount) * 100);

    // Call Razorpay Orders API
    const rpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${razorpayAuth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: { orderId: order.id },
      }),
    });

    if (!rpResponse.ok) {
      const errBody = await rpResponse.json();
      logger.error('Razorpay', 'Failed to create order', { error: errBody });
      res.status(502).json({ message: 'Failed to initiate payment with Razorpay' });
      return;
    }

    const rpOrder = await rpResponse.json();

    // Save Razorpay order ID to our order
    await db.update(orders)
      .set({ razorpayOrderId: rpOrder.id, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    logger.info('Razorpay', `Order created: ${rpOrder.id}`, { amount: amountInPaise });

    res.json({
      razorpayOrderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
    });
  } catch (error: any) {
    logger.error('Razorpay', 'Error creating Razorpay order', { error: error.message });
    res.status(500).json({ message: 'Payment initiation failed' });
  }
});

// POST /verify-payment — Verify Razorpay payment signature
router.post('/verify-payment', async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ message: 'Missing payment verification data' });
      return;
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret as string)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      logger.warn('Razorpay', 'Signature mismatch — possible tampering', { orderId });
      res.status(400).json({ message: 'Payment verification failed — signature mismatch' });
      return;
    }

    // Update order
    await db.update(orders)
      .set({
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        razorpayPaymentId: razorpay_payment_id,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Fire-and-forget: send confirmation email for Razorpay orders
    try {
      const fullOrder = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: { items: true },
      });
      if (fullOrder && (fullOrder.guestEmail)) {
        sendOrderConfirmationEmail({
          orderNumber: fullOrder.orderNumber,
          customerName: fullOrder.guestName || fullOrder.shippingName,
          customerEmail: fullOrder.guestEmail,
          items: fullOrder.items.map(item => ({
            productName: item.productName,
            variantLabel: item.variantLabel,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            imageUrl: item.imageUrl,
          })),
          subtotal: fullOrder.subtotal,
          gstAmount: fullOrder.gstAmount,
          shippingCharge: fullOrder.shippingCharge,
          totalAmount: fullOrder.totalAmount,
          paymentMethod: 'RAZORPAY',
          shippingAddress: {
            name: fullOrder.shippingName,
            phone: fullOrder.shippingPhone,
            line1: fullOrder.shippingLine1,
            line2: fullOrder.shippingLine2,
            city: fullOrder.shippingCity,
            state: fullOrder.shippingState,
            pinCode: fullOrder.shippingPinCode,
          },
        });
      }
    } catch (emailErr) {
      // Email lookup failure should not break the payment verification response
      logger.warn('Mailer', 'Failed to send email after Razorpay verification', { orderId });
    }

    logger.info('Razorpay', `Payment verified for order ${orderId}`, { paymentId: razorpay_payment_id });
    res.json({ message: 'Payment verified successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Razorpay', 'Error verifying payment', { error: err.message });
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

// =============================================
// PUBLIC: Invoice PDF Download
// =============================================

// GET /:id/invoice — Download invoice PDF (public, secured by order ID knowledge)
router.get('/:id/invoice', async (req, res) => {
  try {
    const id = req.params.id as string;
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const { generateInvoicePDF } = await import('../lib/invoice.js');

    generateInvoicePDF({
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      customerName: order.guestName || order.shippingName,
      customerEmail: order.guestEmail,
      customerPhone: order.guestPhone || order.shippingPhone,
      paymentMethod: order.paymentMethod as 'RAZORPAY' | 'COD',
      paymentStatus: order.paymentStatus,
      shippingAddress: {
        name: order.shippingName,
        phone: order.shippingPhone,
        line1: order.shippingLine1,
        line2: order.shippingLine2,
        city: order.shippingCity,
        state: order.shippingState,
        pinCode: order.shippingPinCode,
      },
      items: order.items.map(item => ({
        productName: item.productName,
        variantLabel: item.variantLabel,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        gstRate: item.gstRate,
        totalPrice: item.totalPrice,
      })),
      subtotal: order.subtotal,
      gstAmount: order.gstAmount,
      shippingCharge: order.shippingCharge,
      totalAmount: order.totalAmount,
    }, res);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Invoice', 'Error generating invoice PDF', { error: err.message });
    res.status(500).json({ message: 'Failed to generate invoice' });
  }
});

// =============================================
// ADMIN: Order Management
// =============================================

// GET all orders (Admin only) — with filters & pagination
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = '1', limit = '20', search, status, dateFrom, dateTo } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(orders.guestEmail, `%${search}%`),
          like(orders.shippingName, `%${search}%`)
        )
      );
    }
    if (status) conditions.push(eq(orders.status, status as any));
    if (dateFrom) conditions.push(gte(orders.createdAt, new Date(dateFrom as string)));
    if (dateTo) conditions.push(lte(orders.createdAt, new Date(dateTo as string)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.orders.findMany({
      where: whereClause,
      limit: limitNum,
      offset,
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      with: {
        user: { columns: { id: true, name: true, email: true } },
        items: true,
      },
    });

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(orders).where(whereClause);
    const total = countResult[0].count;

    res.json({
      data,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    logger.error('Orders', 'Error fetching orders', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET single order by ID (Admin only)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        user: { columns: { id: true, name: true, email: true, phone: true } },
        items: {
          with: { product: { columns: { id: true, slug: true } } },
        },
      },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (error: any) {
    logger.error('Orders', 'Error fetching order', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update order status (Admin only)
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const updated = await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.json(updated[0]);
  } catch (error: any) {
    logger.error('Orders', 'Error updating order status', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update order admin notes (Admin only)
router.put('/:id/notes', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { adminNotes } = req.body;

    const updated = await db.update(orders)
      .set({ adminNotes, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.json(updated[0]);
  } catch (error: any) {
    logger.error('Orders', 'Error updating order notes', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT cancel order (Admin only)
router.put('/:id/cancel', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;

    const order = await db.query.orders.findFirst({ where: eq(orders.id, id) });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status)) {
      res.status(400).json({ message: `Cannot cancel order with status: ${order.status}` });
      return;
    }

    const updated = await db.update(orders)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    res.json(updated[0]);
  } catch (error: any) {
    logger.error('Orders', 'Error cancelling order', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
