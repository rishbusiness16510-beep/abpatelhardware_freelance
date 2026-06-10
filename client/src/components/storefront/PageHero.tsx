interface PageHeroProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}

/** Reusable luxury dark hero banner used on all static pages */
export default function PageHero({ title, subtitle, eyebrow = 'ABPATEL' }: PageHeroProps) {
  return (
    <div className="page-hero">
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div style={{ height: '1px', width: '2rem', background: '#b8945a' }} />
          <span className="text-xs uppercase tracking-[0.3em] font-light" style={{ color: '#b8945a' }}>
            {eyebrow}
          </span>
          <div style={{ height: '1px', width: '2rem', background: '#b8945a' }} />
        </div>

        {/* Title */}
        <h1
          className="font-bold leading-tight text-white mb-4"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          }}
        >
          {title}
        </h1>

        {/* Divider */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div style={{ height: '1px', width: '2rem', background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#b8945a' }} />
          <div style={{ height: '1px', width: '2rem', background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm font-light leading-relaxed max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
