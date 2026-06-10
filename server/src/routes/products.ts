import { Router } from 'express';
import { db } from '../db/index.js';
import { products, productVariants, productImages, categories, brands } from '../db/schema.js';
import { eq, like, or, and, sql, inArray } from 'drizzle-orm';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

const router = Router();

// GET all products with pagination, search, and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = '1', limit = '12', search, categoryId, categorySlug, brandId, 
      status, isFeatured, isNewArrival, sort, room 
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Resolve categorySlug to categoryId if provided
    let resolvedCategoryId = categoryId as string | undefined;
    if (!resolvedCategoryId && categorySlug) {
      const cat = await db.query.categories.findFirst({
        where: eq(categories.slug, categorySlug as string),
      });
      if (cat) resolvedCategoryId = cat.id;
    }

    // Build where conditions
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.sku, `%${search}%`)
        )
      );
    }
    if (resolvedCategoryId) conditions.push(eq(products.categoryId, resolvedCategoryId));
    if (brandId) conditions.push(eq(products.brandId, brandId as string));
    if (isFeatured === 'true') conditions.push(eq(products.isFeatured, true));
    if (isNewArrival === 'true') conditions.push(eq(products.isNewArrival, true));
    if (room) conditions.push(sql`${products.roomTags}::jsonb @> ${JSON.stringify([room])}::jsonb`);
    
    // Handle status filtering (Admin passes 'all' to see everything, public defaults to 'ACTIVE')
    if (status === 'all') {
      // No condition pushed, fetch all statuses
    } else if (status) {
      conditions.push(eq(products.status, status as any));
    } else {
      conditions.push(eq(products.status, 'ACTIVE'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort order
    let orderByFn: any;
    switch (sort) {
      case 'price_asc':
        orderByFn = (p: any, { asc }: any) => [asc(p.name)]; // Sort by name as proxy; real price sort would need a join
        break;
      case 'price_desc':
        orderByFn = (p: any, { desc }: any) => [desc(p.name)];
        break;
      case 'name_asc':
        orderByFn = (p: any, { asc }: any) => [asc(p.name)];
        break;
      case 'name_desc':
        orderByFn = (p: any, { desc }: any) => [desc(p.name)];
        break;
      case 'oldest':
        orderByFn = (p: any, { asc }: any) => [asc(p.createdAt)];
        break;
      default: // 'newest' or undefined
        orderByFn = (p: any, { desc }: any) => [desc(p.createdAt)];
    }

    const data = await db.query.products.findMany({
      where: whereClause,
      limit: limitNum,
      offset,
      orderBy: orderByFn,
      with: {
        category: true,
        brand: true,
        variants: true,
        images: {
          orderBy: (images: any, { asc }: any) => [asc(images.sortOrder)],
        },
      }
    });

    // Basic count (for pagination)
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(products).where(whereClause);
    const total = countResult[0].count;

    res.json({
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      }
    });
  } catch (error) {
    logger.error('Products API', 'Error fetching products', { error });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET category by slug (public, for storefront category pages)
router.get('/by-category/:slug', async (req, res) => {
  try {
    const slug = req.params.slug as string;
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
      with: { children: true },
    });
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    res.json(category);
  } catch (error) {
    logger.error('Products API', 'Error fetching category by slug', { error });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET single product by slug or ID
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Check if UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    const product = await db.query.products.findFirst({
      where: isUuid ? eq(products.id, identifier) : eq(products.slug, identifier),
      with: {
        category: true,
        brand: true,
        variants: true,
        images: {
          orderBy: (images, { asc }) => [asc(images.sortOrder)],
        },
      }
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (error) {
    logger.error('Products API', 'Error fetching product', { error });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST bulk product upload (Admin only)
router.post('/bulk', authenticate, requireAdmin, async (req, res) => {
  try {
    const { products: bulkProducts } = req.body;
    
    if (!Array.isArray(bulkProducts) || bulkProducts.length === 0) {
      res.status(400).json({ message: 'Products array is required' });
      return;
    }

    // 1. Fetch all categories and brands to match names/slugs
    const allCategories = await db.select().from(categories);
    const allBrands = await db.select().from(brands);

    const categoryMap = new Map(allCategories.map(c => [c.slug.toLowerCase(), c.id]));
    const brandMap = new Map(allBrands.map(b => [b.name.toLowerCase(), b.id]));

    let productsCreated = 0;
    let variantsCreated = 0;

    // Use transaction to ensure data integrity
    await db.transaction(async (tx) => {
      for (const prodData of bulkProducts) {
        // Find category ID by slug
        const categorySlug = prodData.categorySlug?.toLowerCase();
        const categoryId = categorySlug ? categoryMap.get(categorySlug) : null;
        
        if (!categoryId) {
          throw new Error(`Category not found for slug: ${prodData.categorySlug}`);
        }

        // Find brand ID by name (optional)
        const brandName = prodData.brandName?.toLowerCase();
        const brandId = brandName ? brandMap.get(brandName) : null;

        // Auto-generate slug from name if needed
        const slug = prodData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Create product
        const [insertedProduct] = await tx.insert(products).values({
          name: prodData.name,
          slug: slug,
          sku: prodData.sku,
          description: prodData.description || null,
          categoryId,
          brandId,
          status: prodData.status || 'DRAFT',
          gstRate: '18', // Default
        }).returning();

        productsCreated++;

        // Create variants
        if (prodData.variants && prodData.variants.length > 0) {
          const variantValues = prodData.variants.map((v: any) => ({
            productId: insertedProduct.id,
            sku: v.sku,
            finish: v.finish || null,
            size: v.size || null,
            mrp: v.mrp ? v.mrp.toString() : '0',
            sellingPrice: v.sellingPrice ? v.sellingPrice.toString() : '0',
            stockQuantity: v.stockQuantity || 0,
          }));
          await tx.insert(productVariants).values(variantValues);
          variantsCreated += variantValues.length;
        }

        // Create images
        if (prodData.images && prodData.images.length > 0) {
          const imageValues = prodData.images.map((url: string, index: number) => ({
            productId: insertedProduct.id,
            url,
            sortOrder: index,
          }));
          await tx.insert(productImages).values(imageValues);
        }
      }
    });

    logger.info('Products API', `Bulk upload successful: ${productsCreated} products, ${variantsCreated} variants`);
    res.status(201).json({ productsCreated, variantsCreated });
  } catch (error: any) {
    logger.error('Products API', 'Error in bulk upload', { error: error.message });
    if (error.code === '23505') {
      res.status(409).json({ message: 'Product slug or SKU must be unique. A product with this SKU/Slug already exists.' });
      return;
    }
    res.status(400).json({ message: error.message || 'Bulk upload failed' });
  }
});

// POST new product (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { 
      name, slug, sku, description, categoryId, brandId, roomTags, specifications, 
      gstRate, lowStockThreshold, status, isFeatured, isNewArrival, seoTitle, seoDescription,
      variants, // Array of variants
      images, // Array of {url, altText, sortOrder, variantId?}
    } = req.body;

    if (!name || !slug || !sku || !categoryId) {
      res.status(400).json({ message: 'Name, slug, sku, and categoryId are required' });
      return;
    }

    // Use transaction to ensure all or nothing creation
    const newProduct = await db.transaction(async (tx) => {
      // 1. Create product
      const createdProducts = await tx.insert(products).values({
        name, slug, sku, description, categoryId, brandId, roomTags, specifications,
        gstRate, lowStockThreshold, status, isFeatured, isNewArrival, seoTitle, seoDescription
      }).returning();
      
      const productId = createdProducts[0].id;

      // 2. Create variants if provided
      const createdVariantsMap: Record<string, string> = {}; // To map temporary IDs to real IDs for images
      
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          const insertedVariant = await tx.insert(productVariants).values({
            productId,
            finish: variant.finish,
            size: variant.size,
            sku: variant.sku,
            mrp: variant.mrp,
            sellingPrice: variant.sellingPrice,
            stockQuantity: variant.stockQuantity,
            isOnSale: variant.isOnSale,
            salePrice: variant.salePrice,
          }).returning();
          
          if (variant.tempId) {
            createdVariantsMap[variant.tempId] = insertedVariant[0].id;
          }
        }
      }

      // 3. Create images if provided
      if (images && images.length > 0) {
        const imageValues = images.map((img: any) => ({
          productId,
          variantId: img.tempVariantId ? createdVariantsMap[img.tempVariantId] : null,
          url: img.url,
          altText: img.altText,
          sortOrder: img.sortOrder || 0,
        }));
        await tx.insert(productImages).values(imageValues);
      }

      return productId;
    });

    // Fetch the fully populated created product
    const fullProduct = await db.query.products.findFirst({
      where: eq(products.id, newProduct),
      with: { variants: true, images: true }
    });

    res.status(201).json(fullProduct);
  } catch (error: any) {
    logger.error('Products API', 'Error creating product', { error: error.message });
    if (error.code === '23505') {
      res.status(409).json({ message: 'Product slug or SKU must be unique' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update product (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { 
      name, slug, sku, description, categoryId, brandId, roomTags, specifications, 
      gstRate, lowStockThreshold, status, isFeatured, isNewArrival, seoTitle, seoDescription,
      variants, // Array of variants
      images, // Array of {url, altText, sortOrder, tempVariantId?}
    } = req.body;

    if (!name || !slug || !sku || !categoryId) {
      res.status(400).json({ message: 'Name, slug, sku, and categoryId are required' });
      return;
    }

    // Check if product exists
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!existingProduct) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    await db.transaction(async (tx) => {
      // 1. Update basic product info
      await tx.update(products).set({
        name, slug, sku, description, categoryId, brandId, roomTags, specifications,
        gstRate, lowStockThreshold, status, isFeatured, isNewArrival, seoTitle, seoDescription,
        updatedAt: new Date()
      }).where(eq(products.id, id));

      // 2. Fetch existing variants from DB
      const dbVariants = await tx.select().from(productVariants).where(eq(productVariants.productId, id));
      const dbVariantIds = dbVariants.map(v => v.id);

      // 3. Process variants from payload
      const createdVariantsMap: Record<string, string> = {}; // Maps payload tempId to actual DB ID
      const payloadVariantIds: string[] = [];

      if (variants && variants.length > 0) {
        for (const variant of variants) {
          const isUpdate = dbVariantIds.includes(variant.tempId);
          if (isUpdate) {
            await tx.update(productVariants).set({
              finish: variant.finish,
              size: variant.size,
              sku: variant.sku,
              mrp: variant.mrp,
              sellingPrice: variant.sellingPrice,
              stockQuantity: variant.stockQuantity,
              isOnSale: variant.isOnSale,
              salePrice: variant.salePrice,
            }).where(eq(productVariants.id, variant.tempId));
            
            createdVariantsMap[variant.tempId] = variant.tempId;
            payloadVariantIds.push(variant.tempId);
          } else {
            // Insert brand new variant
            const [insertedVariant] = await tx.insert(productVariants).values({
              productId: id,
              finish: variant.finish,
              size: variant.size,
              sku: variant.sku,
              mrp: variant.mrp,
              sellingPrice: variant.sellingPrice,
              stockQuantity: variant.stockQuantity,
              isOnSale: variant.isOnSale,
              salePrice: variant.salePrice,
            }).returning();
            
            createdVariantsMap[variant.tempId] = insertedVariant.id;
            payloadVariantIds.push(insertedVariant.id);
          }
        }
      }

      // 4. Delete variants that were removed in the form
      const toDeleteIds = dbVariantIds.filter(vId => !payloadVariantIds.includes(vId));
      if (toDeleteIds.length > 0) {
        await tx.delete(productVariants).where(inArray(productVariants.id, toDeleteIds));
      }

      // 5. Delete and re-insert images
      await tx.delete(productImages).where(eq(productImages.productId, id));
      if (images && images.length > 0) {
        const imageValues = images.map((img: any) => ({
          productId: id,
          variantId: img.tempVariantId ? (createdVariantsMap[img.tempVariantId] || null) : null,
          url: img.url,
          altText: img.altText,
          sortOrder: img.sortOrder || 0,
        }));
        await tx.insert(productImages).values(imageValues);
      }
    });

    // Fetch the fully updated product details to return
    const updatedProduct = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: { 
        variants: true, 
        images: {
          orderBy: (images: any, { asc }: any) => [asc(images.sortOrder)],
        }
      }
    });

    res.json(updatedProduct);
  } catch (error: any) {
    logger.error('Products API', 'Error updating product', { error: error.message });
    if (error.code === '23505') {
      res.status(409).json({ message: 'Product slug or SKU must be unique' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE product (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    await db.delete(products).where(eq(products.id, id));
    res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    logger.error('Products API', 'Error deleting product', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
