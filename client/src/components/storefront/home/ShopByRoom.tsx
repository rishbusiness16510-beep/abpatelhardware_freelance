import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../lib/api';

// Fallback rooms if no CMS data exists yet
const FALLBACK_ROOMS = [
  {
    id: 'kitchen',
    title: 'Kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?q=80&w=1200&auto=format&fit=crop',
    linkUrl: '/products?room=kitchen',
  },
  {
    id: 'bathroom',
    title: 'Bathroom',
    imageUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=1200&auto=format&fit=crop',
    linkUrl: '/products?room=bathroom',
  },
  {
    id: 'wardrobe',
    title: 'Wardrobe',
    imageUrl: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=80&w=1200&auto=format&fit=crop',
    linkUrl: '/products?room=wardrobe',
  },
  {
    id: 'main-door',
    title: 'Main Door',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
    linkUrl: '/products?room=main-door',
  },
  {
    id: 'living',
    title: 'Living Room',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1200&auto=format&fit=crop',
    linkUrl: '/products?room=living-room',
  },
  {
    id: 'office',
    title: 'Office',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
    linkUrl: '/products?room=office',
  },
];

interface RoomItem {
  id: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string | null;
}

export default function ShopByRoom() {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cms?type=ROOM_SECTION&active=true')
      .then(res => {
        const data = res.data as any[];
        if (data && data.length > 0) {
          setRooms(data);
        } else {
          // Use fallback if admin hasn't added rooms yet
          setRooms(FALLBACK_ROOMS as any);
        }
      })
      .catch(() => setRooms(FALLBACK_ROOMS as any))
      .finally(() => setLoading(false));
  }, []);

  const displayRooms = loading ? FALLBACK_ROOMS : rooms;

  return (
    <section id="shop-by-room" className="py-20 sm:py-28" style={{ background: '#2c2924' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-medium mb-3" style={{ color: '#b8945a' }}>
              Discover
            </p>
            <h2
              className="font-bold leading-none text-white"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(2rem, 4vw, 3rem)',
              }}
            >
              Shop by Room
            </h2>
          </div>
          <p className="hidden md:block text-sm font-light text-right max-w-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Curated hardware for every space in your home
          </p>
        </div>

        {/* Grid — editorial layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {displayRooms.slice(0, 6).map((room, index) => {
            const isWide = index === 0; // first item takes wider slot
            const linkTo = room.linkUrl || '/products';

            return (
              <Link
                key={room.id}
                to={linkTo}
                className={`group relative overflow-hidden block ${isWide ? 'col-span-2 md:col-span-1' : ''}`}
                style={{
                  aspectRatio: isWide ? '16/9' : '4/3',
                  borderRadius: '2px',
                }}
              >
                {/* Image */}
                {room.imageUrl ? (
                  <img
                    src={room.imageUrl}
                    alt={room.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    style={{ transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#1a1a18]" />
                )}

                {/* Dark scrim */}
                <div
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(to top, rgba(20,16,10,0.7) 0%, rgba(20,16,10,0.1) 50%, transparent 100%)',
                    opacity: 1,
                  }}
                />

                {/* Hover scrim */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'rgba(184,148,90,0.12)' }}
                />

                {/* Label */}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <div
                    className="inline-block px-3 py-1.5 mb-0 transition-all duration-300 group-hover:mb-1"
                    style={{
                      background: 'rgba(15,12,8,0.75)',
                      backdropFilter: 'blur(4px)',
                      borderRadius: '1px',
                    }}
                  >
                    <h3
                      className="text-white font-medium text-sm sm:text-base uppercase tracking-[0.15em]"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      {room.title}
                    </h3>
                  </div>
                  <div
                    className="h-px w-0 group-hover:w-12 transition-all duration-400 mt-2"
                    style={{ background: '#b8945a' }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
