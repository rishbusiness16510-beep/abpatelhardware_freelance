import { Router } from 'express';
import { db } from '../db/index.js';
import { categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET all categories (Tree structure)
router.get('/', async (req, res) => {
  try {
    const allCategories = await db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.sortOrder), asc(categories.name)],
      with: {
        children: {
          orderBy: (children, { asc }) => [asc(children.sortOrder), asc(children.name)],
        }
      }
    });
    
    // We can filter on the client side, or return just roots:
    const roots = allCategories.filter(c => c.parentId === null);

    res.json(roots);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET flat list of all categories (useful for dropdowns)
router.get('/flat', async (req, res) => {
  try {
    const allCategories = await db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });
    res.json(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET category by ID
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: {
        children: true,
      }
    });

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST new category (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, coverImageUrl, parentId, sortOrder } = req.body;

    if (!name || !slug) {
      res.status(400).json({ message: 'Name and slug are required' });
      return;
    }

    const newCategory = await db.insert(categories).values({
      name,
      slug,
      description,
      coverImageUrl,
      parentId: parentId || null,
      sortOrder: sortOrder || 0,
    }).returning();

    res.status(201).json(newCategory[0]);
  } catch (error: any) {
    console.error('Error creating category:', error);
    if (error.code === '23505') { // Postgres unique violation
      res.status(409).json({ message: 'Category slug must be unique' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update category (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, slug, description, coverImageUrl, parentId, sortOrder } = req.body;

    if (!name || !slug) {
      res.status(400).json({ message: 'Name and slug are required' });
      return;
    }

    // Prevent self-parenting
    if (parentId === id) {
      res.status(400).json({ message: 'Category cannot be its own parent' });
      return;
    }

    const updatedCategory = await db.update(categories)
      .set({ 
        name, 
        slug, 
        description, 
        coverImageUrl, 
        parentId: parentId || null, 
        sortOrder: sortOrder !== undefined ? sortOrder : 0 
      })
      .where(eq(categories.id, id))
      .returning();

    if (updatedCategory.length === 0) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    res.json(updatedCategory[0]);
  } catch (error: any) {
    console.error('Error updating category:', error);
    if (error.code === '23505') {
      res.status(409).json({ message: 'Category slug must be unique' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE category (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;

    // Check if it has children
    const children = await db.query.categories.findMany({
      where: eq(categories.parentId, id),
    });

    if (children.length > 0) {
      res.status(400).json({ message: 'Cannot delete category with sub-categories. Remove them first.' });
      return;
    }

    const deletedCategory = await db.delete(categories)
      .where(eq(categories.id, id))
      .returning();

    if (deletedCategory.length === 0) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    res.json({ message: 'Category deleted successfully', category: deletedCategory[0] });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Cannot delete category. Ensure no products are attached.' });
  }
});

export default router;
