import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a1a18 0%, #2c2924 50%, #1a1a18 100%)' }}>

      {/* Background grain texture */}
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px',
        }}
      />

      {/* Large watermark 404 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span
          className="font-serif font-bold text-white leading-none"
          style={{
            fontSize: 'clamp(12rem, 30vw, 24rem)',
            opacity: 0.04,
            letterSpacing: '-0.05em',
          }}
        >
          404
        </span>
      </div>

      {/* Decorative horizontal lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#b8945a]/30 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#b8945a]/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-xl mx-auto">
        {/* Brand mark */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="h-px w-12 bg-[#b8945a]/60" />
          <span className="text-[#b8945a] text-xs uppercase tracking-[0.3em] font-light">
            {isAdmin ? 'Admin Panel' : 'ABPATEL Hardware'}
          </span>
          <div className="h-px w-12 bg-[#b8945a]/60" />
        </div>

        {/* Error code */}
        <p className="text-[#b8945a] text-sm uppercase tracking-[0.25em] font-medium mb-4">
          Error 404
        </p>

        {/* Headline */}
        <h1
          className="text-white font-bold mb-5 leading-tight"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          }}
        >
          Page Not Found
        </h1>

        {/* Divider */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-8 bg-white/20" />
          <div className="w-1 h-1 rounded-full bg-[#b8945a]" />
          <div className="h-px w-8 bg-white/20" />
        </div>

        {/* Description */}
        <p className="text-white/50 text-base font-light leading-relaxed mb-10 max-w-sm mx-auto">
          The page you're looking for doesn't exist or may have been moved. Let's get you back on track.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {isAdmin ? (
            <>
              <Link
                to="/admin"
                className="group flex items-center gap-2 px-7 py-3.5 text-sm font-medium uppercase tracking-wider transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #b8945a, #d4a96a)',
                  color: '#1a1a18',
                  borderRadius: '2px',
                }}
              >
                <Home className="w-4 h-4" />
                Admin Dashboard
              </Link>
              <button
                onClick={() => window.history.back()}
                className="group flex items-center gap-2 px-7 py-3.5 text-sm font-medium uppercase tracking-wider border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all duration-300"
                style={{ borderRadius: '2px' }}
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Go Back
              </button>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="group flex items-center gap-2 px-7 py-3.5 text-sm font-medium uppercase tracking-wider transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #b8945a, #d4a96a)',
                  color: '#1a1a18',
                  borderRadius: '2px',
                }}
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
              <Link
                to="/products"
                className="group flex items-center gap-2 px-7 py-3.5 text-sm font-medium uppercase tracking-wider border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all duration-300"
                style={{ borderRadius: '2px' }}
              >
                <Search className="w-4 h-4" />
                Browse Products
              </Link>
            </>
          )}
        </div>

        {/* Bottom hint */}
        <p className="mt-12 text-white/20 text-xs tracking-widest uppercase">
          Crafted with precision · Since establishment
        </p>
      </div>
    </div>
  );
}
