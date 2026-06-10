import { ShieldCheck, Truck, Award, Gem } from 'lucide-react';

const features = [
  { icon: ShieldCheck, label: 'Premium Quality' },
  { icon: Truck, label: 'Pan-India Delivery' },
  { icon: Award, label: 'Genuine Warranty' },
  { icon: Gem, label: 'Curated Brands' },
];

export default function BrandTrustStrip() {
  return (
    <div
      className="border-y"
      style={{ background: '#f5f3ed', borderColor: 'rgba(0,0,0,0.08)' }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-black/8">
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center justify-center gap-3 py-4 sm:py-5 group"
            >
              <Icon
                className="w-4 h-4 shrink-0 transition-colors"
                style={{ color: '#b8945a' }}
              />
              <span
                className="text-xs sm:text-[0.8rem] uppercase tracking-[0.15em] font-medium"
                style={{ color: '#353838' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
