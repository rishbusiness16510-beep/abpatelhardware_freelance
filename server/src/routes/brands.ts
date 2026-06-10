import { Router } from 'express';
import { db } from '../db/index.js';
import { brands } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET all brands (Public)
router.get('/', async (req, res) => {
  try {
    const allBrands = await db.query.brands.findMany({
      orderBy: (brands, { asc }) => [asc(brands.name)],
    });
    res.json(allBrands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET brand by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, id),
    });

    if (!brand) {
      res.status(404).json({ message: 'Brand not found' });
      return;
    }

    res.json(brand);
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST new brand (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, logoUrl, description } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Brand name is required' });
      return;
    }

    const newBrand = await db.insert(brands).values({
      name,
      logoUrl,
      description,
    }).returning();

    res.status(201).json(newBrand[0]);
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update brand (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, logoUrl, description } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Brand name is required' });
      return;
    }

    const updatedBrand = await db.update(brands)
      .set({ name, logoUrl, description })
      .where(eq(brands.id, id))
      .returning();

    if (updatedBrand.length === 0) {
      res.status(404).json({ message: 'Brand not found' });
      return;
    }

    res.json(updatedBrand[0]);
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE brand (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;

    const deletedBrand = await db.delete(brands)
      .where(eq(brands.id, id))
      .returning();

    if (deletedBrand.length === 0) {
      res.status(404).json({ message: 'Brand not found' });
      return;
    }

    res.json({ message: 'Brand deleted successfully', brand: deletedBrand[0] });
  } catch (error) {
    console.error('Error deleting brand:', error);
    // Usually fails if there are products linked due to foreign key constraint
    res.status(500).json({ message: 'Cannot delete brand. Ensure no products are attached.' });
  }
});

export default router;
