import { Link } from 'react-router-dom';
import { MessageCircle, Tag } from 'lucide-react';

const WHATSAPP_NUMBER = '919876543210';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    brand?: { name: string } | null;
    variants: Array<{
      sellingPrice: string;
      mrp: string;
      isOnSale: boolean;
      salePrice: string | null;
      finish: string | null;
      stockQuantity: number;
    }>;
    images: Array<{ url: string; altText: string | null }>;
    isNewArrival: boolean;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images?.[0]?.url || 'https://via.placeholder.com/400x400?text=No+Image';
  const secondaryImage = product.images?.[1]?.url;

  const lowestVariant = product.variants?.reduce((lowest, v) => {
    const price = parseFloat(v.sellingPrice);
    return price < parseFloat(lowest.sellingPrice) ? v : lowest;
  }, product.variants[0]);

  const price = lowestVariant ? parseFloat(lowestVariant.sellingPrice) : 0;
  const mrp = lowestVariant ? parseFloat(lowestVariant.mrp) : 0;
  const isOnSale = lowestVariant?.isOnSale && lowestVariant?.salePrice;
  const salePrice = isOnSale ? parseFloat(lowestVariant.salePrice!) : null;
  const displayPrice = salePrice ?? price;
  const hasDiscount = mrp > 0 && mrp > displayPrice;
  const discountPercent = hasDiscount ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;

  const allOutOfStock = product.variants?.every(v => v.stockQuantity === 0);
  const finishes = [...new Set(product.variants?.map(v => v.finish).filter(Boolean))];

  // Products with no price listed → show "Contact for Price" CTA
  const hasNoPrice = !lowestVariant || price === 0;

  const whatsAppMessage = `Hi, I'm interested in: ${product.name}. Please share the price and availability.`;
  const whatsAppUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsAppMessage)}`;

  return (
    <div className="group relative flex flex-col">
      {/* Image */}
      <Link to={`/product/${product.slug}`} className="relative aspect-square overflow-hidden bg-bg-alt rounded-sm mb-4 block">
        <img
          src={primaryImage}
          alt={product.images?.[0]?.altText || product.name}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
          loading="lazy"
        />
        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            loading="lazy"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.isNewArrival && (
            <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm">
              New
            </span>
          )}
          {isOnSale && (
            <span className="bg-error text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm">
              Sale
            </span>
          )}
          {hasDiscount && discountPercent >= 5 && !isOnSale && (
            <span className="bg-success text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm">
              -{discountPercent}%
            </span>
          )}
          {allOutOfStock && (
            <span className="bg-text-muted text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm">
              Out of Stock
            </span>
          )}
        </div>

        {/* Quick View Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center">
          <span className="text-white text-xs font-semibold uppercase tracking-wider">
            View Details
          </span>
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 flex flex-col">
        {product.brand && (
          <p className="text-[11px] text-text-muted uppercase tracking-widest mb-1">
            {product.brand.name}
          </p>
        )}
        <h3 className="font-heading text-base font-bold text-primary leading-tight mb-2 line-clamp-2 group-hover:text-accent transition-colors">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>

        {/* Finish swatches (text) */}
        {finishes.length > 1 && (
          <p className="text-xs text-text-muted mb-2">
            {finishes.length} finishes available
          </p>
        )}

        {/* Price — or Contact for Price */}
        <div className="mt-auto">
          {hasNoPrice ? (
            // No price: WhatsApp inquiry button
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-sm text-xs font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Contact for Price
            </a>
          ) : (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-lg font-bold text-text">
                ₹{displayPrice.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-text-muted line-through">
                    ₹{mrp.toLocaleString('en-IN')}
                  </span>
                  {discountPercent >= 5 && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-success">
                      <Tag className="w-3 h-3" />
                      {discountPercent}% off
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
