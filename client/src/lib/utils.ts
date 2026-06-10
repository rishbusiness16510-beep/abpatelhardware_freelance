/**
 * Shared utility functions for the ABPATEL Admin Panel
 */

// ─── SLUG GENERATION ────────────────────────────────────────────────────────

/**
 * Converts a human-readable name/title into a URL-safe slug.
 * e.g. "Premium Brass Cabinet Handle!" → "premium-brass-cabinet-handle"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/[\s-]+/g, '-')       // Spaces and hyphens → single hyphen
    .replace(/^-+|-+$/g, '');      // Trim leading/trailing hyphens
}

// ─── SEO GENERATION ─────────────────────────────────────────────────────────

interface SeoTitleParams {
  name: string;
  categoryName?: string;
  brandName?: string;
}

interface SeoDescriptionParams {
  name: string;
  categoryName?: string;
  brandName?: string;
  roomTags?: string[];
  finishes?: string[];
  sizes?: string[];
  lowestPrice?: number;
  description?: string;
}

/**
 * Generates an SEO-optimised title for a product.
 * Format matches how Amazon/Flipkart hardware products rank:
 *   "{Name} | Buy {Category} Online at Best Price — ABPATEL Hardware"
 * Kept under 60 characters where possible.
 */
export function generateSeoTitle({ name, categoryName, brandName }: SeoTitleParams): string {
  const brand = brandName ? ` ${brandName}` : '';
  let title = '';

  if (categoryName) {
    title = `${name} | Buy${brand} ${categoryName} Online — ABPATEL Hardware`;
  } else {
    title = `${name} | Buy${brand} Hardware Online — ABPATEL Hardware Shop`;
  }

  // Truncate gracefully at 65 chars
  if (title.length > 65) {
    const short = `${name} — ABPATEL Hardware`;
    return short.length <= 65 ? short : `${name.slice(0, 45).trimEnd()}… — ABPATEL`;
  }

  return title;
}

/**
 * Generates an SEO meta description for a product.
 * Targets 140–160 characters with high purchase-intent keywords.
 * Covers: product name, category, finishes/sizes, price hint, delivery.
 */
export function generateSeoDescription({
  name,
  categoryName,
  brandName,
  roomTags,
  finishes,
  sizes,
  lowestPrice,
  description,
}: SeoDescriptionParams): string {
  const parts: string[] = [];

  // Opening hook with purchase intent
  const cat = categoryName || 'hardware fittings';
  parts.push(`Buy ${name} online.`);

  // Brand if present
  if (brandName) {
    parts.push(`By ${brandName}.`);
  }

  // Variant info (finishes or sizes)
  if (finishes && finishes.length > 1) {
    parts.push(`Available in ${finishes.length} finishes including ${finishes.slice(0, 2).join(' and ')}.`);
  } else if (finishes && finishes.length === 1) {
    parts.push(`Finish: ${finishes[0]}.`);
  }

  if (sizes && sizes.length > 0) {
    parts.push(`Sizes: ${sizes.slice(0, 3).join(', ')}.`);
  }

  // Price
  if (lowestPrice && lowestPrice > 0) {
    parts.push(`Starting ₹${lowestPrice.toLocaleString('en-IN')}.`);
  }

  // Room context
  if (roomTags && roomTags.length > 0) {
    parts.push(`Ideal for ${roomTags.slice(0, 2).join(' and ')} use.`);
  }

  // Use description excerpt if short enough
  if (!parts.some(p => p.length > 10) && description) {
    const excerpt = description.replace(/<[^>]+>/g, '').slice(0, 80).trim();
    if (excerpt) parts.push(excerpt + '.');
  }

  // Close with trust signals & category keyword
  parts.push(`Shop premium ${cat} at ABPATEL Hardware. Pan-India delivery.`);

  let result = parts.join(' ');

  // Trim to 160 chars
  if (result.length > 160) {
    result = result.slice(0, 157).trimEnd() + '…';
  }

  return result;
}

/**
 * Generates an SEO title for a blog post.
 */
export function generateBlogSeoTitle(title: string): string {
  const seo = `${title} — ABPATEL Hardware Blog`;
  return seo.length <= 65 ? seo : `${title.slice(0, 42).trimEnd()}… — ABPATEL Blog`;
}

/**
 * Generates an SEO description for a blog post from its excerpt.
 */
export function generateBlogSeoDescription(excerpt: string, title: string): string {
  if (excerpt && excerpt.length >= 60) {
    const trimmed = excerpt.slice(0, 157).trimEnd();
    return trimmed.length < excerpt.length ? `${trimmed}…` : trimmed;
  }
  return `${title} — Read expert hardware tips and guides from the ABPATEL Hardware Shop blog.`.slice(0, 160);
}
