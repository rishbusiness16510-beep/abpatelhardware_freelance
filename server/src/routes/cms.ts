import { Router } from 'express';
import { db } from '../db/index.js';
import { cmsContent } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET CMS content by type (Public — used by storefront)
router.get('/', async (req, res) => {
  try {
    const { type, active } = req.query;
    const conditions = [];
    if (type) conditions.push(eq(cmsContent.type, type as any));
    if (active === 'true') conditions.push(eq(cmsContent.isActive, true));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.cmsContent.findMany({
      where: whereClause,
      orderBy: (cms, { asc }) => [asc(cms.sortOrder)],
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching CMS content:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET single CMS item by ID
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    // If it looks like a UUID, fetch by ID; otherwise treat as slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const item = isUUID
      ? await db.query.cmsContent.findFirst({ where: eq(cmsContent.id, id) })
      : await db.query.cmsContent.findFirst({ where: and(eq(cmsContent.slug, id), eq(cmsContent.isActive, true)) });
    if (!item) { res.status(404).json({ message: 'Content not found' }); return; }
    res.json(item);
  } catch (error) {
    console.error('Error fetching CMS item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST new CMS content (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { type, title, slug, content, imageUrl, linkUrl, isActive, sortOrder } = req.body;
    if (!type || !title) {
      res.status(400).json({ message: 'Type and title are required' });
      return;
    }
    const created = await db.insert(cmsContent).values({
      type, title, slug: slug || null, content: content || null,
      imageUrl: imageUrl || null, linkUrl: linkUrl || null,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0,
    }).returning();
    res.status(201).json(created[0]);
  } catch (error: any) {
    console.error('Error creating CMS content:', error);
    if (error.code === '23505') { res.status(409).json({ message: 'Slug must be unique' }); return; }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update CMS content (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { title, slug, content, imageUrl, linkUrl, isActive, sortOrder } = req.body;

    const updated = await db.update(cmsContent)
      .set({
        title, slug: slug || null, content: content || null,
        imageUrl: imageUrl || null, linkUrl: linkUrl || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder !== undefined ? sortOrder : 0,
        updatedAt: new Date(),
      })
      .where(eq(cmsContent.id, id))
      .returning();

    if (updated.length === 0) { res.status(404).json({ message: 'Content not found' }); return; }
    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error updating CMS content:', error);
    if (error.code === '23505') { res.status(409).json({ message: 'Slug must be unique' }); return; }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE CMS content (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const deleted = await db.delete(cmsContent).where(eq(cmsContent.id, id)).returning();
    if (deleted.length === 0) { res.status(404).json({ message: 'Content not found' }); return; }
    res.json({ message: 'Content deleted', item: deleted[0] });
  } catch (error) {
    console.error('Error deleting CMS content:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
