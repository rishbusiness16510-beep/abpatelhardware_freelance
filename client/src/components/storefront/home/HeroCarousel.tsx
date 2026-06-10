import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../ui/Button';

interface HeroBanner {
  id: string;
  imageUrl: string;
  heading?: string;
  subheading?: string | null;
  title?: string;
  content?: string | null;
  linkUrl: string | null;
}

interface HeroCarouselProps {
  banners: HeroBanner[];
}

// Fallback slides when no banners are set in CMS
const FALLBACK_BANNERS: HeroBanner[] = [
  {
    id: 'fallback-1',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1920&auto=format&fit=crop',
    heading: 'Crafted for Excellence',
    subheading: 'Premium architectural hardware for discerning spaces',
    linkUrl: '/products',
  },
  {
    id: 'fallback-2',
    imageUrl: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?q=80&w=1920&auto=format&fit=crop',
    heading: 'Timeless Interiors',
    subheading: 'Hardware that completes the story of your home',
    linkUrl: '/products',
  },
];

export default function HeroCarousel({ banners }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const activeBanners = banners && banners.length > 0 ? banners : FALLBACK_BANNERS;

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const go = (idx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((idx + activeBanners.length) % activeBanners.length);
    setTimeout(() => setIsAnimating(false), 900);
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#1a1a18]" style={{ height: 'calc(100vh - 0px)', minHeight: '560px', maxHeight: '900px' }}>
      {/* Slides */}
      {activeBanners.map((banner, index) => {
        const heading = banner.heading || banner.title || '';
        const subheading = banner.subheading || banner.content || null;

        return (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background Image */}
            <img
              src={banner.imageUrl}
              alt={heading}
              className="absolute inset-0 w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />

            {/* Multi-layer gradient for cinematic depth */}
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to top, rgba(20,18,15,0.85) 0%, rgba(20,18,15,0.3) 40%, rgba(20,18,15,0.1) 70%, rgba(20,18,15,0.25) 100%)',
            }} />

            {/* Content — bottom-left editorial placement */}
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-7xl w-full mx-auto px-6 sm:px-10 lg:px-16 pb-20 sm:pb-28">
                {/* Eyebrow */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px w-8 bg-[#b8945a]" />
                  <span className="text-[#b8945a] text-xs uppercase tracking-[0.3em] font-light">
                    Premium Hardware
                  </span>
                </div>

                {/* Headline */}
                {heading && (
                  <h1
                    className="text-white font-bold leading-tight mb-5"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                      letterSpacing: '-0.02em',
                      maxWidth: '700px',
                      textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                    }}
                  >
                    {heading}
                  </h1>
                )}

                {/* Subheading */}
                {subheading && (
                  <p className="text-white/70 text-base sm:text-lg font-light mb-8 max-w-md leading-relaxed">
                    {subheading}
                  </p>
                )}

                {/* CTA */}
                {banner.linkUrl && (
                  <Link
                    to={banner.linkUrl}
                    className="inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.2em] transition-all duration-300 group"
                    style={{
                      color: '#b8945a',
                      borderBottom: '1px solid rgba(184,148,90,0.4)',
                      paddingBottom: '6px',
                    }}
                  >
                    Discover Collection
                    <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation — Arrows */}
      {activeBanners.length > 1 && (
        <>
          <Button
            onClick={() => go(currentIndex - 1)}
            className="absolute left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 flex items-center justify-center border border-white/20 text-white/70 hover:text-white hover:border-white/50 backdrop-blur-sm transition-all duration-300"
            style={{ borderRadius: '2px', background: 'rgba(0,0,0,0.2)' }}
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => go(currentIndex + 1)}
            className="absolute right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 flex items-center justify-center border border-white/20 text-white/70 hover:text-white hover:border-white/50 backdrop-blur-sm transition-all duration-300"
            style={{ borderRadius: '2px', background: 'rgba(0,0,0,0.2)' }}
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Dot indicators — bottom right */}
          <div className="absolute bottom-8 right-10 z-30 flex items-center gap-2">
            <span className="text-white/30 text-xs font-light mr-2">
              {String(currentIndex + 1).padStart(2, '0')} / {String(activeBanners.length).padStart(2, '0')}
            </span>
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => go(idx)}
                className={`transition-all duration-500 ${
                  idx === currentIndex
                    ? 'w-8 h-0.5 bg-[#b8945a]'
                    : 'w-3 h-0.5 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
