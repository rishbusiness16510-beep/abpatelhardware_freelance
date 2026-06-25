import { Link } from 'react-router-dom';

// Static product types — using authentic showroom photos where available
const PRODUCT_TYPES = [
  {
    id: 'door-handles',
    label: 'Door Handles',
    imageUrl: '/images/door-handles-display.jpg',
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
    imageUrl: '/images/cabinet-knobs.png',
    link: '/products?type=knobs',
  },
  {
    id: 'cabinet-pulls',
    label: 'Cabinet Pulls',
    imageUrl: '/images/cabinet-hardware.png',
    link: '/products?type=cabinet-pulls',
  },
  {
    id: 'bath',
    label: 'Bath Accessories',
    imageUrl: '/images/bathroom-fittings.png',
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
    <section className="py-16 sm:py-24" style={{ background: '#f5f3ed' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="flex items-center gap-5 mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-medium mb-2.5" style={{ color: '#b8945a' }}>
              Browse By
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
          <div className="flex-1 h-px ml-4 bg-black/[0.06]" />
          <Link
            to="/products"
            className="text-xs uppercase tracking-[0.2em] font-semibold shrink-0 transition-colors hover:text-[#2c2924]"
            style={{ color: '#b8945a' }}
          >
            View All →
          </Link>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div 
          className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory sm:grid sm:grid-cols-4 lg:grid-cols-8 sm:overflow-visible sm:pb-0"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
          }}
        >
          {PRODUCT_TYPES.map((type) => (
            <Link
              key={type.id}
              to={type.link}
              className="group flex flex-col bg-white border border-[#2c2924]/5 rounded-[3px] shadow-xs hover:shadow-md hover:border-[#b8945a]/35 transition-all duration-300 w-[140px] sm:w-auto shrink-0 snap-start"
            >
              {/* Square Image Container */}
              <div className="relative aspect-square w-full overflow-hidden bg-neutral-100 rounded-t-[2px]">
                <img
                  src={type.imageUrl}
                  alt={type.label}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                  loading="lazy"
                />
                {/* Gold Highlight Overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'rgba(184,148,90,0.06)' }}
                />
              </div>

              {/* Label area */}
              <div className="flex flex-col items-center justify-center p-3 text-center flex-1 bg-white rounded-b-[2px]">
                <span
                  className="text-center font-heading font-semibold text-[10px] sm:text-xs uppercase tracking-[0.15em] leading-tight transition-colors duration-200"
                  style={{ color: '#2c2924' }}
                >
                  {type.label}
                </span>

                {/* Underline accent on hover */}
                <div
                  className="h-[1.5px] w-0 group-hover:w-8 transition-all duration-300 mt-2 bg-[#b8945a]"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
