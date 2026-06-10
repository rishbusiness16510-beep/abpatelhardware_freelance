import { useState, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import Button from '../../components/ui/Button';
import PageHero from '../../components/storefront/PageHero';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  // Ordering
  { category: 'Ordering', q: 'How do I place an order?', a: 'Browse our product catalog, select the items you need with the right finish and size, add them to your cart, and proceed to checkout. You can pay via Razorpay (UPI/Card/Net Banking) or choose Cash on Delivery.' },
  { category: 'Ordering', q: 'Can I order without creating an account?', a: 'Yes! We support guest checkout. Simply enter your contact details and shipping address during checkout. You can also create an account for faster future orders and order tracking.' },
  { category: 'Ordering', q: 'Can I modify or cancel my order after placing it?', a: 'You can request modifications or cancellation by contacting us on WhatsApp within 2 hours of placing the order. Once the order is shipped, modifications are not possible.' },
  { category: 'Ordering', q: 'Is there a minimum order value?', a: 'No, there is no minimum order value. However, orders below ₹5,000 attract a flat shipping fee of ₹150.' },
  // Shipping
  { category: 'Shipping', q: 'What are the shipping charges?', a: 'Shipping is FREE for orders above ₹5,000. For orders below ₹5,000, a flat ₹150 shipping charge applies. We deliver across India.' },
  { category: 'Shipping', q: 'How long does delivery take?', a: 'Standard delivery takes 5–7 business days depending on your location. We ship from our warehouse in Gujarat. Remote areas may take 1–2 additional days.' },
  { category: 'Shipping', q: 'Do you deliver to my city?', a: 'We deliver across India via trusted courier partners. Enter your pincode at checkout to verify delivery availability in your area.' },
  // Payment
  { category: 'Payment', q: 'What payment methods do you accept?', a: 'We accept Razorpay (UPI, Credit/Debit Cards, Net Banking, Wallets) and Cash on Delivery (COD). All online payments are processed securely through Razorpay.' },
  { category: 'Payment', q: 'Is Cash on Delivery (COD) available?', a: 'Yes, COD is available for orders across India. You can pay the delivery agent in cash when your order arrives.' },
  { category: 'Payment', q: 'Is my payment information secure?', a: 'Absolutely. All payments are processed through Razorpay, which is PCI-DSS compliant. We never store your card details on our servers.' },
  // Products
  { category: 'Products', q: 'Are all products genuine and branded?', a: 'Yes, every product listed on ABPATEL is 100% genuine and sourced directly from authorized brand distributors. We deal in premium brands like Hettich, Häfele, Dorset, Ozone, and more.' },
  { category: 'Products', q: 'What if the product I need is out of stock?', a: 'Contact us on WhatsApp with the product details. We can often arrange special orders for out-of-stock items within 7–10 business days.' },
  { category: 'Products', q: 'Do you provide product installation services?', a: 'We don\'t offer direct installation services, but we can recommend trusted local installers in your area. Many of our products come with detailed installation guides.' },
  // Returns
  { category: 'Returns & Warranty', q: 'What is your return policy?', a: 'We accept returns within 7 days of delivery for unused, uninstalled products in original packaging. Defective items can be returned within 15 days. Contact us on WhatsApp to initiate a return.' },
  { category: 'Returns & Warranty', q: 'Do products come with a warranty?', a: 'Yes, all branded products come with the manufacturer\'s warranty. Warranty duration varies by product and brand — check individual product pages for details.' },
];

export default function FAQ() {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(FAQ_DATA.map(f => f.category))], []);

  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter(faq => {
      const matchesSearch = !search || faq.q.toLowerCase().includes(search.toLowerCase()) || faq.a.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !activeCategory || faq.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const toggle = (idx: number) => setOpenIndex(prev => prev === idx ? null : idx);

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <PageHero title="Frequently Asked Questions" subtitle="Find answers to common questions about orders, shipping, payments, and more." />

      {/* Search — outside hero, centered below */}
      <div className="max-w-md mx-auto px-4 -mt-6 mb-2 relative z-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-11 pr-4 py-3 bg-white rounded-lg text-text text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 shadow-lg border border-border"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Category Chips */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <Button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${!activeCategory ? 'text-white' : 'bg-surface border border-border text-text-muted hover:bg-primary/5'}`}
            style={!activeCategory ? { background: '#2c2924', color: 'white' } : undefined}
          >
            All
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${activeCategory === cat ? 'text-white' : 'bg-surface border border-border text-text-muted hover:bg-primary/5'}`}
              style={activeCategory === cat ? { background: '#2c2924', color: 'white' } : undefined}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {filteredFAQs.map((faq, idx) => (
            <div key={idx} className="overflow-hidden" style={{ background: '#faf8f5', border: '1px solid #e0dbd4', borderRadius: '2px' }}>
              <Button
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer hover:bg-bg/50 transition-colors"
              >
                <span className="text-sm font-medium text-text pr-4">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform duration-200 ${openIndex === idx ? 'rotate-180' : ''}`} />
              </Button>
              {openIndex === idx && (
                <div className="px-6 pb-5">
                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-text-muted leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredFAQs.length === 0 && (
            <div className="text-center py-12 text-text-muted text-sm">
              No questions match your search. Try a different keyword.
            </div>
          )}
        </div>

        {/* Still Need Help */}
        <div className="mt-12 text-center p-10" style={{ background: '#faf8f5', border: '1px solid #e0dbd4', borderRadius: '2px' }}>
          <h3 className="font-heading text-lg font-bold text-primary mb-2">Still have questions?</h3>
          <p className="text-sm text-text-muted mb-5">We're here to help. Reach out anytime.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210'}`} target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 bg-[#25D366] text-white text-sm font-medium rounded-md hover:bg-[#20bd5a] transition-colors">
              Chat on WhatsApp
            </a>
            <a href="/contact" className="px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity" style={{ background: '#2c2924', color: 'white', borderRadius: '2px' }}>
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
