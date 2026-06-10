import { Link } from 'react-router-dom';

interface PromoBannerProps {
  banner: {
    id: string;
    imageUrl: string | null;
    title: string;
    content: string | null;
    linkUrl: string | null;
  } | null;
}

export default function PromoBanner({ banner }: PromoBannerProps) {
  if (!banner) return null;

  return (
    <section
      className="relative overflow-hidden py-24 sm:py-32"
      style={{ background: '#2c2924' }}
    >
      {/* Background image with overlay */}
      {banner.imageUrl && (
        <div className="absolute inset-0">
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="w-full h-full object-cover opacity-25"
            style={{ filter: 'saturate(0.3)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(44,41,36,0.9) 0%, rgba(44,41,36,0.7) 100%)' }}
          />
        </div>
      )}

      {/* Decorative element */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent via-[#b8945a]/40 to-transparent" />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent via-[#b8945a]/40 to-transparent" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-8 bg-[#b8945a]/60" />
          <span className="text-[#b8945a] text-xs uppercase tracking-[0.3em] font-light">
            Special Feature
          </span>
          <div className="h-px w-8 bg-[#b8945a]/60" />
        </div>

        {/* Title */}
        <h2
          className="text-white font-bold leading-tight mb-6"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          }}
        >
          {banner.title}
        </h2>

        {/* Divider */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-6 bg-white/20" />
          <div className="w-1 h-1 rounded-full bg-[#b8945a]" />
          <div className="h-px w-6 bg-white/20" />
        </div>

        {/* Content */}
        {banner.content && (
          <div
            className="text-base font-light leading-relaxed mb-10 max-w-xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            dangerouslySetInnerHTML={{ __html: banner.content }}
          />
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
            Explore More
            <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
          </Link>
        )}
      </div>
    </section>
  );
}
