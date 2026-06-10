import { Router } from 'express';
import { db } from '../db/index.js';
import { blogPosts } from '../db/schema.js';
import { eq, desc, sql, like, and } from 'drizzle-orm';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET all published blog posts (Public)
router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '10', search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [eq(blogPosts.isPublished, true)];
    if (search) conditions.push(like(blogPosts.title, `%${search}%`));

    const whereClause = and(...conditions);

    const data = await db.query.blogPosts.findMany({
      where: whereClause,
      limit: limitNum,
      offset,
      orderBy: (posts, { desc }) => [desc(posts.publishedAt)],
    });

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(whereClause);
    const total = countResult[0].count;

    res.json({ data, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET all blog posts including drafts (Admin only)
router.get('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const data = await db.query.blogPosts.findMany({
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET single blog post by slug (Public)
router.get('/slug/:slug', async (req, res) => {
  try {
    const slug = req.params.slug as string;
    const post = await db.query.blogPosts.findFirst({ where: eq(blogPosts.slug, slug) });
    if (!post) { res.status(404).json({ message: 'Post not found' }); return; }
    res.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET single blog post by ID (Admin)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const post = await db.query.blogPosts.findFirst({ where: eq(blogPosts.id, id) });
    if (!post) { res.status(404).json({ message: 'Post not found' }); return; }
    res.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST new blog post (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, slug, excerpt, content, coverImageUrl, isPublished, seoTitle, seoDescription } = req.body;
    if (!title || !slug || !content) {
      res.status(400).json({ message: 'Title, slug, and content are required' });
      return;
    }
    const created = await db.insert(blogPosts).values({
      title, slug, excerpt: excerpt || null, content,
      coverImageUrl: coverImageUrl || null,
      isPublished: isPublished || false,
      publishedAt: isPublished ? new Date() : null,
      seoTitle: seoTitle || null, seoDescription: seoDescription || null,
    }).returning();
    res.status(201).json(created[0]);
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    if (error.code === '23505') { res.status(409).json({ message: 'Slug must be unique' }); return; }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update blog post (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { title, slug, excerpt, content, coverImageUrl, isPublished, seoTitle, seoDescription } = req.body;

    const existing = await db.query.blogPosts.findFirst({ where: eq(blogPosts.id, id) });
    if (!existing) { res.status(404).json({ message: 'Post not found' }); return; }

    const updated = await db.update(blogPosts)
      .set({
        title, slug, excerpt: excerpt || null, content,
        coverImageUrl: coverImageUrl || null,
        isPublished: isPublished || false,
        publishedAt: isPublished && !existing.isPublished ? new Date() : existing.publishedAt,
        seoTitle: seoTitle || null, seoDescription: seoDescription || null,
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, id))
      .returning();

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error updating blog post:', error);
    if (error.code === '23505') { res.status(409).json({ message: 'Slug must be unique' }); return; }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE blog post (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const deleted = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning();
    if (deleted.length === 0) { res.status(404).json({ message: 'Post not found' }); return; }
    res.json({ message: 'Post deleted', post: deleted[0] });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
