import { Link } from 'react-router-dom';

// Static product types — like Armac Martin's product type navigation
const PRODUCT_TYPES = [
  {
    id: 'door-handles',
    label: 'Door Handles',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop',
    link: '/products?type=door-handles',
  },
  {
    id: 'hinges',
    label: 'Hinges',
    imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=400&auto=format&fit=crop',
    link: '/products?type=hinges',
  },
  {
    id: 'locks',
    label: 'Locks & Latches',
    imageUrl: 'https://images.unsplash.com/photo-1558618047-f4e80c2e4e3c?q=80&w=400&auto=format&fit=crop',
    link: '/products?type=locks',
  },
  {
    id: 'knobs',
    label: 'Door Knobs',
    imageUrl: 'https://images.unsplash.com/photo-1617104551722-3b2d51366400?q=80&w=400&auto=format&fit=crop',
    link: '/products?type=knobs',
  },
  {
    id: 'cabinet-pulls',
    label: 'Cabinet Pulls',
    imageUrl: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?q=80&w=400&auto=format&fit=crop',
    link: '/products?type=cabinet-pulls',
  },
  {
    id: 'bath',
    label: 'Bath Accessories',
    imageUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=400&auto=format&fit=crop',
    link: '/products?type=bath-accessories',
  },
  {
    id: 'window',
    label: 'Window Hardware',
    imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=400&auto=format&fit=crop',
    link: '/products?type=window-hardware',
  },
  {
    id: 'stoppers',
    label: 'Door Stoppers',
    imageUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=400&auto=format&fit=crop',
    link: '/products?type=stoppers',
  },
];

export default function ProductTypeStrip() {
  return (
    <section className="py-16 sm:py-20" style={{ background: '#f5f3ed' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="flex items-center gap-5 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-medium mb-2" style={{ color: '#b8945a' }}>
              Browse
            </p>
            <h2
              className="font-bold leading-none"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                color: '#2c2924',
              }}
            >
              Product Types
            </h2>
          </div>
          <div className="flex-1 h-px ml-4" style={{ background: 'rgba(0,0,0,0.08)' }} />
          <Link
            to="/products"
            className="text-xs uppercase tracking-[0.2em] font-medium shrink-0 transition-colors"
            style={{ color: '#b8945a' }}
          >
            View All →
          </Link>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:grid sm:grid-cols-4 lg:grid-cols-8 sm:overflow-visible sm:pb-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {PRODUCT_TYPES.map((type) => (
            <Link
              key={type.id}
              to={type.link}
              className="group flex flex-col items-center gap-3 shrink-0 snap-start sm:shrink sm:snap-none"
              style={{ minWidth: '90px' }}
            >
              {/* Circle image */}
              <div
                className="relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '2px solid rgba(0,0,0,0.06)',
                }}
              >
                <img
                  src={type.imageUrl}
                  alt={type.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'rgba(184,148,90,0.2)' }}
                />
              </div>

              {/* Label */}
              <span
                className="text-center text-xs font-medium uppercase tracking-wide leading-tight transition-colors duration-200"
                style={{ color: '#2c2924', maxWidth: '80px' }}
              >
                {type.label}
              </span>

              {/* Underline accent on hover */}
              <div
                className="h-px w-0 group-hover:w-8 transition-all duration-300"
                style={{ background: '#b8945a' }}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
