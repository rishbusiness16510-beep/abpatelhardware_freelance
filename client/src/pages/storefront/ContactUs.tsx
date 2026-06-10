import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import PageHero from '../../components/storefront/PageHero';

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      setErrorMsg('Name and message are required.');
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      await api.post('/contact', form);
      setStatus('sent');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error.response?.data?.message || 'Failed to send. Please try again or contact us on WhatsApp.');
      setStatus('error');
    }
  };

  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210';

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <PageHero title="Contact Us" subtitle="We'd love to hear from you. Reach out anytime." />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-heading text-xl font-bold text-primary mb-6">Get in Touch</h2>
              <div className="space-y-5">
                {[
                  { icon: MapPin, label: 'Visit Us', value: 'Ahmedabad, Gujarat, India\n(Full address editable from Admin Panel)', multiline: true },
                  { icon: Phone, label: 'Call Us', value: '+91 98765 43210' },
                  { icon: Mail, label: 'Email Us', value: 'info@abpatel.com' },
                  { icon: Clock, label: 'Working Hours', value: 'Mon – Sat: 9:00 AM – 7:00 PM\nSunday: Closed', multiline: true },
                ].map(({ icon: Icon, label, value, multiline }) => (
                  <div key={label} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(184,148,90,0.08)' }}>
                      <Icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text mb-0.5">{label}</p>
                      {multiline ? (
                        value.split('\n').map((line, i) => (
                          <p key={i} className="text-sm text-text-muted">{line}</p>
                        ))
                      ) : (
                        <p className="text-sm text-text-muted">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/${whatsappNumber}?text=Hi%20ABPATEL%2C%20I%20have%20a%20query%20about%20your%20products.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-4 bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl hover:bg-[#25D366]/15 transition-colors"
            >
              <svg className="w-6 h-6 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <div>
                <p className="text-sm font-semibold text-[#25D366]">Chat on WhatsApp</p>
                <p className="text-xs text-text-muted">Get instant support</p>
              </div>
            </a>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="p-8" style={{ background: '#faf8f5', border: '1px solid #e0dbd4', borderRadius: '2px' }}>
              <h2 className="font-heading text-xl font-bold text-primary mb-6">Send a Message</h2>

              {status === 'sent' && (
                <div className="flex items-center gap-3 bg-success/5 border border-success/20 text-success rounded-lg px-4 py-3 mb-6 text-sm">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>Message sent successfully! We'll get back to you shortly.</span>
                </div>
              )}

              {status === 'error' && (
                <div className="flex items-center gap-3 bg-error/5 border border-error/20 text-error rounded-lg px-4 py-3 mb-6 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-text mb-1.5">Name *</label>
                    <input id="contact-name" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-text text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                      placeholder="Your name" />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-text mb-1.5">Email</label>
                    <input id="contact-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-text text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                      placeholder="your@email.com" />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-text mb-1.5">Phone</label>
                  <input id="contact-phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-text text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                    placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-text mb-1.5">Message *</label>
                  <textarea id="contact-message" rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-text text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
                    placeholder="How can we help you?" />
                </div>
                <Button type="submit" loading={status === 'sending'} loadingText="Sending..."
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 text-sm font-medium uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-opacity cursor-pointer hover:opacity-90"
                  style={{ background: '#2c2924', color: 'white', borderRadius: '2px' }}>
                  <Send className="w-4 h-4" /> Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
