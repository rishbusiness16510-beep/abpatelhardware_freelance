import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const phoneNumber = '919876543210'; // In production, get from env or settings
  const message = 'Hello, I have an enquiry regarding your hardware fittings.';
  
  const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a 
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-surface text-text text-sm font-medium rounded-lg shadow-md border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap pointer-events-none">
        Need help? Chat with us
        {/* Triangle arrow */}
        <span className="absolute left-full top-1/2 -translate-y-1/2 border-y-4 border-l-4 border-y-transparent border-l-surface -mr-1"></span>
      </span>
    </a>
  );
}
