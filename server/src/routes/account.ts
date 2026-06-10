import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { orders, addresses } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// ==========================================
// MY ORDERS
// ==========================================

// GET /api/account/orders
router.get('/orders', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const myOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      with: {
        items: true,
      },
    });
    res.json(myOrders);
  } catch (error) {
    console.error('Error fetching my orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==========================================
// MY ADDRESSES
// ==========================================

// GET /api/account/addresses
router.get('/addresses', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const myAddresses = await db.query.addresses.findMany({
      where: eq(addresses.userId, userId),
      orderBy: (addresses, { desc }) => [desc(addresses.isDefault)],
    });
    res.json(myAddresses);
  } catch (error) {
    console.error('Error fetching my addresses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/account/addresses
router.post('/addresses', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { name, phone, line1, line2, city, state, pinCode, isDefault } = req.body;

    if (!name || !phone || !line1 || !city || !state || !pinCode) {
      res.status(400).json({ message: 'Missing required address fields' });
      return;
    }

    // If making this default, unset others
    if (isDefault) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    }

    const newAddress = await db.insert(addresses).values({
      userId,
      name,
      phone,
      line1,
      line2,
      city,
      state,
      pinCode,
      isDefault: !!isDefault,
    }).returning();

    res.status(201).json(newAddress[0]);
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/account/addresses/:id
router.put('/addresses/:id', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const addressId = req.params.id as string;
    const { name, phone, line1, line2, city, state, pinCode, isDefault } = req.body;

    const existing = await db.query.addresses.findFirst({
      where: and(eq(addresses.id, addressId), eq(addresses.userId, userId))
    });

    if (!existing) {
      res.status(404).json({ message: 'Address not found' });
      return;
    }

    // If making this default, unset others
    if (isDefault) {
      await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    }

    const updated = await db.update(addresses).set({
      name, phone, line1, line2, city, state, pinCode, isDefault: !!isDefault,
    }).where(eq(addresses.id, addressId)).returning();

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/account/addresses/:id
router.delete('/addresses/:id', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const addressId = req.params.id as string;

    const existing = await db.query.addresses.findFirst({
      where: and(eq(addresses.id, addressId), eq(addresses.userId, userId))
    });

    if (!existing) {
      res.status(404).json({ message: 'Address not found' });
      return;
    }

    await db.delete(addresses).where(eq(addresses.id, addressId));
    res.json({ message: 'Address deleted' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
