import { pgTable, text, timestamp, boolean, uuid, decimal, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  firebaseUid: text('firebase_uid').unique(),
  email: text('email').unique(),
  phone: text('phone').unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash'),
  role: text('role', { enum: ['CUSTOMER', 'ADMIN'] }).default('CUSTOMER').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


// Addresses Table
export const addresses = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  line1: text('line1').notNull(),
  line2: text('line2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  pinCode: text('pin_code').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
});

// Categories Table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  parentId: uuid('parent_id'), // Self-referencing done below
  sortOrder: integer('sort_order').default(0).notNull(),
});

// Brands Table
export const brands = pgTable('brands', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  description: text('description'),
});

// Products Table
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  sku: text('sku').notNull().unique(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
  brandId: uuid('brand_id').references(() => brands.id),
  roomTags: jsonb('room_tags'), // array of strings
  specifications: jsonb('specifications'),
  gstRate: decimal('gst_rate').default('18').notNull(),
  lowStockThreshold: integer('low_stock_threshold').default(5).notNull(),
  status: text('status', { enum: ['ACTIVE', 'DRAFT', 'ARCHIVED'] }).default('DRAFT').notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isNewArrival: boolean('is_new_arrival').default(false).notNull(),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Product Variants Table
export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  finish: text('finish'),
  size: text('size'),
  sku: text('sku').notNull(),
  mrp: decimal('mrp').notNull(),
  sellingPrice: decimal('selling_price').notNull(),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  isOnSale: boolean('is_on_sale').default(false).notNull(),
  salePrice: decimal('sale_price'),
});

// Product Images Table
export const productImages = pgTable('product_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id), // Optional, for variant specific images
  url: text('url').notNull(),
  altText: text('alt_text'),
  sortOrder: integer('sort_order').default(0).notNull(),
});

// Orders Table
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: uuid('user_id').references(() => users.id),
  guestEmail: text('guest_email'),
  guestPhone: text('guest_phone'),
  guestName: text('guest_name'),
  status: text('status', {
    enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'],
  }).default('PENDING').notNull(),
  // Shipping address (snapshot — not a reference)
  shippingName: text('shipping_name').notNull(),
  shippingPhone: text('shipping_phone').notNull(),
  shippingLine1: text('shipping_line1').notNull(),
  shippingLine2: text('shipping_line2'),
  shippingCity: text('shipping_city').notNull(),
  shippingState: text('shipping_state').notNull(),
  shippingPinCode: text('shipping_pin_code').notNull(),
  // Financials
  subtotal: decimal('subtotal').notNull(),
  gstAmount: decimal('gst_amount').notNull(),
  shippingCharge: decimal('shipping_charge').default('0').notNull(),
  totalAmount: decimal('total_amount').notNull(),
  // Payment
  paymentMethod: text('payment_method', { enum: ['RAZORPAY', 'COD'] }).notNull(),
  paymentStatus: text('payment_status', { enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] }).default('PENDING').notNull(),
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  // Notes
  adminNotes: text('admin_notes'),
  customerNotes: text('customer_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Order Items Table
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  variantId: uuid('variant_id').references(() => productVariants.id),
  productName: text('product_name').notNull(), // Snapshot
  variantLabel: text('variant_label'),
  sku: text('sku').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price').notNull(),
  gstRate: decimal('gst_rate').notNull(),
  totalPrice: decimal('total_price').notNull(),
  imageUrl: text('image_url'),
});

// CMS Content Table (hero banners, promo banners, static pages)
export const cmsContent = pgTable('cms_content', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type', {
    enum: ['HERO_BANNER', 'PROMO_BANNER', 'STATIC_PAGE', 'STORE_SETTINGS'],
  }).notNull(),
  title: text('title').notNull(),
  slug: text('slug').unique(),
  content: text('content'), // HTML/rich text for static pages
  imageUrl: text('image_url'),
  linkUrl: text('link_url'),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Blog Posts Table
export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  coverImageUrl: text('cover_image_url'),
  isPublished: boolean('is_published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ===================== RELATIONS =====================

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parent_child',
  }),
  children: many(categories, { relationName: 'parent_child' }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  variants: many(productVariants),
  images: many(productImages),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

