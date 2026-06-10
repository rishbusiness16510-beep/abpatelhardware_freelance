export default function HeritageBanner() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: '#1a1a18' }}
    >
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b8945a' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 sm:py-24">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center gap-3 mb-6 justify-center lg:justify-start">
              <div className="h-px w-8 bg-[#b8945a]" />
              <span className="text-[#b8945a] text-xs uppercase tracking-[0.3em] font-light">
                Our Commitment
              </span>
            </div>

            <h2
              className="text-white font-bold leading-tight mb-6"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(2rem, 4vw, 3.25rem)',
              }}
            >
              Precision in Every{' '}
              <span style={{ color: '#b8945a', fontStyle: 'italic' }}>Detail</span>
            </h2>

            <p className="font-light leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem' }}>
              Every piece of hardware we carry is selected for its quality of material, 
              precision of engineering, and longevity of design. We believe the finest 
              spaces deserve fittings that last generations.
            </p>

            <div className="flex items-center gap-8 justify-center lg:justify-start">
              {[
                { num: '500+', label: 'Products' },
                { num: '50+', label: 'Brands' },
                { num: '10+', label: 'Years' },
              ].map(({ num, label }) => (
                <div key={label} className="text-center lg:text-left">
                  <p
                    className="font-bold leading-none mb-1"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '2rem',
                      color: '#b8945a',
                    }}
                  >
                    {num}
                  </p>
                  <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: image */}
          <div className="flex-1 max-w-md w-full">
            <div
              className="relative overflow-hidden"
              style={{ borderRadius: '2px', aspectRatio: '4/3' }}
            >
              <img
                src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=1000&auto=format&fit=crop"
                alt="Premium hardware craftsmanship"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Gold frame accent */}
              <div
                className="absolute inset-3 pointer-events-none"
                style={{ border: '1px solid rgba(184,148,90,0.3)', borderRadius: '1px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
