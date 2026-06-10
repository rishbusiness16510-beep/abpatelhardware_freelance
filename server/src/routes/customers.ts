import { Router } from 'express';
import { db } from '../db/index.js';
import { users, orders } from '../db/schema.js';
import { eq, like, or, sql, ne } from 'drizzle-orm';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET all customers (Admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [eq(users.role, 'CUSTOMER')];
    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 1 
      ? sql`${conditions[0]} AND ${conditions[1]}`
      : conditions[0];

    const data = await db.query.users.findMany({
      where: eq(users.role, 'CUSTOMER'),
      limit: limitNum,
      offset,
      orderBy: (users, { desc }) => [desc(users.createdAt)],
      columns: { passwordHash: false }, // Exclude password
      with: { orders: { columns: { id: true, orderNumber: true, totalAmount: true, status: true, createdAt: true } } },
    });

    // Filter by search manually if present (since Drizzle relational queries don't combine well with complex where)
    let filteredData = data;
    if (search) {
      const s = (search as string).toLowerCase();
      filteredData = data.filter(u => 
        u.name.toLowerCase().includes(s) || 
        (u.email && u.email.toLowerCase().includes(s)) ||
        (u.phone && u.phone.includes(s))
      );
    }

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'CUSTOMER'));
    const total = countResult[0].count;

    res.json({
      data: filteredData,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET single customer with order history (Admin only)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const customer = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: { passwordHash: false },
      with: {
        addresses: true,
        orders: {
          orderBy: (orders, { desc }) => [desc(orders.createdAt)],
          with: { items: true },
        },
      },
    });

    if (!customer) { res.status(404).json({ message: 'Customer not found' }); return; }
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
