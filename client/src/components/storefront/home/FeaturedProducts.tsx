import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  variants: any[];
  images: any[];
  brand: any;
}

interface FeaturedProductsProps {
  products: Product[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-20 sm:py-28" style={{ background: '#faf8f5' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-medium mb-3" style={{ color: '#b8945a' }}>
              Selected
            </p>
            <h2
              className="font-bold leading-none"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                color: '#2c2924',
              }}
            >
              Featured Collection
            </h2>
          </div>
          <Link
            to="/products"
            className="hidden sm:flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-medium transition-colors group"
            style={{ color: '#b8945a' }}
          >
            View All
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="flex overflow-x-auto pb-6 -mx-4 px-4 gap-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {products.map((product) => {
            const primaryImage = product.images?.[0]?.url;
            const price = product.variants?.[0]?.sellingPrice || '0';

            return (
              <div
                key={product.id}
                className="min-w-[240px] sm:min-w-0 shrink-0 snap-start group"
              >
                {/* Image container */}
                <Link
                  to={`/product/${product.slug}`}
                  className="block relative overflow-hidden mb-4"
                  style={{ aspectRatio: '3/4', borderRadius: '2px', background: '#edeae4' }}
                >
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#edeae4' }}>
                      <span className="text-xs uppercase tracking-widest" style={{ color: '#9a9086' }}>No Image</span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div
                    className="absolute inset-x-0 bottom-0 py-4 opacity-0 group-hover:opacity-100 transition-all duration-300 flex justify-center"
                    style={{ background: 'linear-gradient(to top, rgba(44,41,36,0.7) 0%, transparent 100%)' }}
                  >
                    <span className="text-white text-xs uppercase tracking-[0.2em] font-medium translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      View Details
                    </span>
                  </div>
                </Link>

                {/* Product info */}
                <div>
                  {product.brand && (
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#b8945a' }}>
                      {product.brand.name}
                    </p>
                  )}
                  <h3
                    className="font-medium mb-2 line-clamp-1 transition-colors"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      color: '#2c2924',
                      fontSize: '1rem',
                    }}
                  >
                    <Link to={`/product/${product.slug}`} className="hover:text-[#b8945a] transition-colors">
                      {product.name}
                    </Link>
                  </h3>
                  <p className="text-sm font-medium" style={{ color: '#353838' }}>
                    ₹{Number(price).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium pb-1 transition-colors"
            style={{ color: '#b8945a', borderBottom: '1px solid #b8945a' }}
          >
            View All Collection
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
