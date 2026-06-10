import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Target, Award, MapPin, Phone, Mail } from 'lucide-react';
import api from '../../lib/api';
import PageHero from '../../components/storefront/PageHero';

interface CmsPage { id: string; title: string; content: string | null; imageUrl: string | null; }

export default function AboutUs() {
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/cms/about-us');
        setPage(data);
      } catch { /* Use fallback content */ }
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // If CMS has content, render it. Otherwise, render placeholder.
  if (page?.content) {
    return (
      <div className="min-h-screen bg-bg">
        <PageHero title={page.title} />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="prose prose-lg max-w-none text-text" dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      </div>
    );
  }

  // Placeholder About Us
  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <PageHero title="About ABPATEL" subtitle="Your trusted partner for premium hardware fittings and architectural solutions." />

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Mission Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {[
            { icon: Building2, title: 'Our Story', desc: 'Founded with a vision to provide the finest hardware fittings to architects, builders, and homeowners across India. We curate products from world-renowned brands to deliver quality you can trust.' },
            { icon: Target, title: 'Our Mission', desc: 'To be the most trusted hardware fittings partner by offering an unmatched selection of premium products, expert guidance, and seamless shopping experiences — both online and in-store.' },
            { icon: Award, title: 'Our Promise', desc: 'Every product we sell is hand-selected for quality, durability, and design. We back everything with genuine warranties, professional support, and hassle-free returns.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl p-8 hover:shadow-lg transition-shadow" style={{ background: '#faf8f5', border: '1px solid #e0dbd4' }}>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-5" style={{ background: 'rgba(184,148,90,0.1)' }}>
                <Icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-heading text-lg font-bold text-primary mb-3">{title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Why Choose Us */}
        <div className="rounded-2xl p-10 mb-20" style={{ background: '#faf8f5', border: '1px solid #e0dbd4' }}>
          <h2 className="font-heading text-2xl font-bold text-primary text-center mb-10">Why Choose ABPATEL?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '500+', label: 'Premium Products' },
              { num: '50+', label: 'Trusted Brands' },
              { num: '1000+', label: 'Happy Customers' },
              { num: '10+', label: 'Years of Experience' },
            ].map(({ num, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-heading font-bold text-accent mb-1">{num}</p>
                <p className="text-sm text-text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Visit Us */}
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-primary mb-4">Visit Our Store</h2>
          <div className="w-12 h-0.5 bg-accent mx-auto mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-text-muted">
            <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> Ahmedabad, Gujarat</span>
            <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-accent" /> +91 98765 43210</span>
            <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-accent" /> info@abpatel.com</span>
          </div>
          <div className="mt-8">
            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium uppercase tracking-wider hover:opacity-90 transition-opacity" style={{ background: '#b8945a', color: '#1a1a18' }}>
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
