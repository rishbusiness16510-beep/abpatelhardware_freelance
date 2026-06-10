import { Link } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  slug: string;
  coverImageUrl: string | null;
}

interface FeaturedCategoriesProps {
  categories: Category[];
}

export default function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  const displayCategories = categories.filter(c => c.coverImageUrl).slice(0, 4);

  if (displayCategories.length === 0) return null;

  // Asymmetric editorial grid layout:
  // [ LARGE LEFT ]  [ SMALL TOP-RIGHT  ]
  //                 [ SMALL BOTTOM-RIGHT]
  // Then item 4 goes full-width below if exists
  const [first, second, third, fourth] = displayCategories;

  return (
    <section className="py-20 sm:py-28" style={{ background: '#faf8f5' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Section header */}
        <div className="flex items-center gap-5 mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-medium mb-2" style={{ color: '#b8945a' }}>
              Explore
            </p>
            <h2
              className="font-bold leading-none"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                color: '#2c2924',
              }}
            >
              Shop by Category
            </h2>
          </div>
          <div className="flex-1 h-px ml-4" style={{ background: 'rgba(0,0,0,0.08)' }} />
        </div>

        {/* Asymmetric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Large first item — spans 2 rows on desktop */}
          {first && (
            <Link
              to={`/category/${first.slug}`}
              className="group relative overflow-hidden block lg:row-span-2"
              style={{ aspectRatio: '3/4', borderRadius: '2px' }}
            >
              <img
                src={first.coverImageUrl!}
                alt={first.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(to top, rgba(28,22,14,0.75) 0%, rgba(28,22,14,0.1) 60%, transparent 100%)',
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-7">
                <h3
                  className="text-white font-bold mb-2"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                  }}
                >
                  {first.name}
                </h3>
                <span
                  className="text-xs uppercase tracking-[0.2em] font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 inline-block"
                  style={{ color: '#b8945a' }}
                >
                  Explore →
                </span>
              </div>
            </Link>
          )}

          {/* Right column: two stacked items */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[second, third, fourth].filter(Boolean).map((cat) => (
              <Link
                key={cat!.id}
                to={`/category/${cat!.slug}`}
                className="group relative overflow-hidden block"
                style={{ aspectRatio: '4/3', borderRadius: '2px' }}
              >
                <img
                  src={cat!.coverImageUrl!}
                  alt={cat!.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(to top, rgba(28,22,14,0.65) 0%, transparent 60%)',
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3
                    className="text-white font-semibold mb-1"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '1.1rem',
                    }}
                  >
                    {cat!.name}
                  </h3>
                  <span
                    className="text-xs uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 inline-block"
                    style={{ color: '#b8945a' }}
                  >
                    Explore →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
