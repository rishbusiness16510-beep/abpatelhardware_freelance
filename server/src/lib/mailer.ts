import nodemailer from 'nodemailer';
import { logger } from './logger.js';

// Create reusable transporter using SMTP credentials from .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: {
    productName: string;
    variantLabel: string | null;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    imageUrl: string | null;
  }[];
  subtotal: string;
  gstAmount: string;
  shippingCharge: string;
  totalAmount: string;
  paymentMethod: 'RAZORPAY' | 'COD';
  shippingAddress: {
    name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pinCode: string;
  };
}

function buildOrderConfirmationHTML(data: OrderEmailData): string {
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; color: #333;">
        ${item.productName}${item.variantLabel ? ` — ${item.variantLabel}` : ''}
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; color: #555; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; color: #333; text-align: right;">
        ₹${parseFloat(item.totalPrice).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  const addr = data.shippingAddress;
  const addressStr = [addr.name, addr.line1, addr.line2, `${addr.city}, ${addr.state} — ${addr.pinCode}`, addr.phone]
    .filter(Boolean)
    .join('<br>');

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1A2E40; padding: 28px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 2px;">ABPATEL</h1>
              <p style="margin: 4px 0 0; color: #B8860B; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">Hardware Fittings</p>
            </td>
          </tr>

          <!-- Success Banner -->
          <tr>
            <td style="padding: 32px 32px 16px; text-align: center;">
              <div style="width: 56px; height: 56px; border-radius: 50%; background-color: #e8f5e9; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 28px;">✓</span>
              </div>
              <h2 style="margin: 0 0 8px; color: #1A2E40; font-size: 20px;">Order Confirmed!</h2>
              <p style="margin: 0; color: #777; font-size: 14px;">Thank you for your order, ${data.customerName}.</p>
            </td>
          </tr>

          <!-- Order Number -->
          <tr>
            <td style="padding: 0 32px 24px; text-align: center;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px; display: inline-block;">
                <span style="color: #777; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Number</span><br>
                <span style="color: #1A2E40; font-size: 20px; font-weight: 700; letter-spacing: 1px;">${data.orderNumber}</span>
              </div>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px 16px; text-align: left; font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                  <th style="padding: 10px 16px; text-align: center; font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                  <th style="padding: 10px 16px; text-align: right; font-size: 12px; color: #777; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                </tr>
                ${itemRows}
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding: 20px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #555;">Subtotal</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #333; text-align: right;">₹${parseFloat(data.subtotal).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #555;">GST (included)</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #333; text-align: right;">₹${parseFloat(data.gstAmount).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #555;">Shipping</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #333; text-align: right;">${parseFloat(data.shippingCharge) > 0 ? '₹' + parseFloat(data.shippingCharge).toLocaleString('en-IN') : 'Free'}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 8px 0 0;"><hr style="border: none; border-top: 1px solid #eee; margin: 0;"></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 16px; font-weight: 700; color: #1A2E40;">Total</td>
                  <td style="padding: 8px 0; font-size: 16px; font-weight: 700; color: #1A2E40; text-align: right;">₹${parseFloat(data.totalAmount).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 4px 0;">
                    <span style="font-size: 12px; color: #777; background-color: ${data.paymentMethod === 'COD' ? '#fff3e0' : '#e8f5e9'}; padding: 4px 10px; border-radius: 4px;">
                      ${data.paymentMethod === 'COD' ? '💵 Cash on Delivery' : '✅ Paid via Razorpay'}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px;">
                <h3 style="margin: 0 0 8px; font-size: 13px; color: #777; text-transform: uppercase; letter-spacing: 0.5px;">Shipping Address</h3>
                <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.6;">${addressStr}</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #777;">Estimated delivery: <strong style="color: #333;">5–7 business days</strong></p>
              <p style="margin: 0 0 12px; font-size: 13px; color: #777;">For support, contact us on WhatsApp or reply to this email.</p>
              <p style="margin: 0; font-size: 11px; color: #aaa;">© ${new Date().getFullYear()} ABPATEL Hardware Shop. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send order confirmation email. Fire-and-forget — errors are logged but don't throw.
 */
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<void> {
  if (!data.customerEmail) {
    logger.warn('Mailer', 'No customer email provided, skipping order confirmation email', { orderNumber: data.orderNumber });
    return;
  }

  try {
    const html = buildOrderConfirmationHTML(data);

    await transporter.sendMail({
      from: `"ABPATEL Hardware" <${process.env.SMTP_USER}>`,
      to: data.customerEmail,
      subject: `Order Confirmed — ${data.orderNumber} | ABPATEL Hardware`,
      html,
    });

    logger.info('Mailer', `Order confirmation email sent to ${data.customerEmail}`, { orderNumber: data.orderNumber });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Mailer', 'Failed to send order confirmation email', {
      orderNumber: data.orderNumber,
      email: data.customerEmail,
      error: err.message,
    });
    // Don't throw — email failure should not break the checkout flow
  }
}
