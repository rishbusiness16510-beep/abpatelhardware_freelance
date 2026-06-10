import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../lib/api';
import HeroCarousel from '../../components/storefront/home/HeroCarousel';
import BrandTrustStrip from '../../components/storefront/home/BrandTrustStrip';
import ProductTypeStrip from '../../components/storefront/home/ProductTypeStrip';
import FeaturedCategories from '../../components/storefront/home/FeaturedCategories';
import ShopByRoom from '../../components/storefront/home/ShopByRoom';
import FeaturedProducts from '../../components/storefront/home/FeaturedProducts';
import HeritageBanner from '../../components/storefront/home/HeritageBanner';
import PromoBanner from '../../components/storefront/home/PromoBanner';

export default function Home() {
  const location = useLocation();
  const [heroBanners, setHeroBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [promoBanner, setPromoBanner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Scroll to #shop-by-room when hash matches and loading has finished
  useEffect(() => {
    if (!isLoading && location.hash === '#shop-by-room') {
      const timer = setTimeout(() => {
        const element = document.getElementById('shop-by-room');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading, location.hash]);

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        setIsLoading(true);
        const [cmsRes, catRes, prodRes] = await Promise.allSettled([
          api.get('/cms?active=true'),
          api.get('/categories'),
          api.get('/products?isFeatured=true&limit=8')
        ]);

        if (cmsRes.status === 'fulfilled') {
          const cmsData = cmsRes.value.data as { type: string }[];
          setHeroBanners(cmsData.filter(item => item.type === 'HERO_BANNER'));
          const promos = cmsData.filter(item => item.type === 'PROMO_BANNER');
          if (promos.length > 0) setPromoBanner(promos[0] as any);
        }

        if (catRes.status === 'fulfilled') {
          setCategories(catRes.value.data);
        }

        if (prodRes.status === 'fulfilled') {
          setFeaturedProducts(prodRes.value.data.data || []);
        }

      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f3ed' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#b8945a]/20 border-t-[#b8945a] rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-[0.3em] text-[#9a9086]">Loading</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Full-viewport hero */}
      <HeroCarousel banners={heroBanners} />

      {/* 2. Trust strip — thin editorial bar */}
      <BrandTrustStrip />

      {/* 3. Product types — quick navigation */}
      <ProductTypeStrip />

      {/* 4. Shop by Category — from backend */}
      <FeaturedCategories categories={categories} />

      {/* 5. Shop by Room — admin-managed or fallback */}
      <ShopByRoom />

      {/* 6. Featured Products — from backend */}
      <FeaturedProducts products={featuredProducts} />

      {/* 7. Heritage / brand story */}
      <HeritageBanner />

      {/* 8. Promo banner — from CMS (optional) */}
      <PromoBanner banner={promoBanner} />
    </div>
  );
}
