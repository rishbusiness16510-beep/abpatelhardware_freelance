import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, ShieldCheck, Truck, CreditCard, CheckCircle,
  MapPin, Plus, Loader2
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectCartItems, selectCartSubtotal, selectCartItemCount, clearCart } from '../../features/cart/cartSlice';
import api from '../../lib/api';
import Button from '../../components/ui/Button';

// ---- Types ----
type Step = 'contact' | 'shipping' | 'review' | 'payment';

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
}

interface ShippingAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pinCode: string;
}

interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
}

const STEPS: { key: Step; label: string; icon: typeof ChevronRight }[] = [
  { key: 'contact', label: 'Contact', icon: ShieldCheck },
  { key: 'shipping', label: 'Shipping', icon: Truck },
  { key: 'review', label: 'Review', icon: CheckCircle },
  { key: 'payment', label: 'Payment', icon: CreditCard },
];

// Shipping logic: ₹150 flat, free above ₹5000
function calcShipping(subtotal: number): number {
  return subtotal >= 5000 ? 0 : 150;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: { color: string };
  modal: {
    ondismiss: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const itemCount = useAppSelector(selectCartItemCount);

  const [currentStep, setCurrentStep] = useState<Step>('contact');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contact, setContact] = useState<ContactInfo>({ name: '', email: '', phone: '' });

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const [shipping, setShipping] = useState<ShippingAddress>({
    line1: '', line2: '', city: '', state: '', pinCode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');

  const shippingCharge = calcShipping(subtotal);
  const total = subtotal + shippingCharge;

  // Redirect to login if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location } });
    }
  }, [user, navigate, location]);

  // Auto-fill contact details from user profile
  useEffect(() => {
    if (user) {
      setContact((prev) => ({
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Fetch saved addresses for logged-in users
  useEffect(() => {
    if (!user) return;
    setLoadingAddresses(true);
    api.get('/account/addresses')
      .then((res) => {
        const addrs: SavedAddress[] = res.data;
        setSavedAddresses(addrs);
        // Auto-select default address if any
        const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setShowNewAddressForm(false);
          // Pre-fill shipping from the default address
          setShipping({
            line1: defaultAddr.line1,
            line2: defaultAddr.line2 || '',
            city: defaultAddr.city,
            state: defaultAddr.state,
            pinCode: defaultAddr.pinCode,
          });
        } else {
          // No saved addresses — show the form directly
          setShowNewAddressForm(true);
        }
      })
      .catch(() => {
        // On error, just show the new address form
        setShowNewAddressForm(true);
      })
      .finally(() => setLoadingAddresses(false));
  }, [user]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/products');
    }
  }, [items.length, navigate]);

  // When user selects a saved address, pre-fill shipping form
  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setShowNewAddressForm(false);
    setShipping({
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state,
      pinCode: addr.pinCode,
    });
    setError(null);
  };

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  const validateContact = () => {
    if (!contact.name.trim()) return 'Name is required';
    if (!contact.email.trim() || !/\S+@\S+\.\S+/.test(contact.email)) return 'Valid email is required';
    if (!contact.phone.trim() || !/^\d{10}$/.test(contact.phone.replace(/\D/g, ''))) return 'Valid 10-digit phone is required';
    return null;
  };

  const validateShipping = () => {
    if (!shipping.line1.trim()) return 'Address line 1 is required';
    if (!shipping.city.trim()) return 'City is required';
    if (!shipping.state.trim()) return 'State is required';
    if (!shipping.pinCode.trim() || !/^\d{6}$/.test(shipping.pinCode)) return 'Valid 6-digit pin code is required';
    return null;
  };

  // Save new address to account (called when moving past the shipping step with a new address)
  const saveNewAddressToAccount = async () => {
    if (!showNewAddressForm) return; // Using a saved address, skip saving
    const err = validateShipping();
    if (err) return; // Don't save if invalid

    try {
      const payload = {
        name: contact.name,
        phone: contact.phone,
        line1: shipping.line1,
        line2: shipping.line2 || null,
        city: shipping.city,
        state: shipping.state,
        pinCode: shipping.pinCode,
        isDefault: savedAddresses.length === 0, // First address becomes default
      };
      const res = await api.post('/account/addresses', payload);
      const newAddr: SavedAddress = res.data;
      setSavedAddresses(prev => [...prev, newAddr]);
      setSelectedAddressId(newAddr.id);
    } catch {
      // Non-blocking — silently fail if address save fails; order can still proceed
    }
  };

  const goNext = async () => {
    setError(null);
    if (currentStep === 'contact') {
      const err = validateContact();
      if (err) { setError(err); return; }
      setCurrentStep('shipping');
    } else if (currentStep === 'shipping') {
      const err = validateShipping();
      if (err) { setError(err); return; }
      // Save new address to account before moving on
      await saveNewAddressToAccount();
      setCurrentStep('review');
    } else if (currentStep === 'review') {
      setCurrentStep('payment');
    }
  };

  const goBack = () => {
    setError(null);
    if (currentStep === 'shipping') setCurrentStep('contact');
    else if (currentStep === 'review') setCurrentStep('shipping');
    else if (currentStep === 'payment') setCurrentStep('review');
  };

  const handlePlaceOrder = useCallback(async () => {
    setError(null);
    setIsProcessing(true);

    try {
      // 1. Create order on backend
      const orderPayload = {
        guestName: contact.name,
        guestEmail: contact.email,
        guestPhone: contact.phone,
        shippingName: contact.name,
        shippingPhone: contact.phone,
        shippingLine1: shipping.line1,
        shippingLine2: shipping.line2 || null,
        shippingCity: shipping.city,
        shippingState: shipping.state,
        shippingPinCode: shipping.pinCode,
        paymentMethod,
        customerNotes: '',
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.name,
          variantLabel: [item.finish, item.size].filter(Boolean).join(' / ') || null,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstRate: item.gstRate,
          imageUrl: item.imageUrl,
        })),
      };

      const { data: order } = await api.post('/orders/checkout', orderPayload);

      if (paymentMethod === 'COD') {
        dispatch(clearCart());
        navigate(`/order-success?orderId=${order.id}&orderNumber=${order.orderNumber}`);
        return;
      }

      // 2. Razorpay — create payment order
      const { data: rpOrder } = await api.post('/orders/create-razorpay-order', {
        orderId: order.id,
      });

      const isProd = import.meta.env.PROD;
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || (isProd
        ? import.meta.env.VITE_RAZORPAY_KEY_ID_PROD
        : import.meta.env.VITE_RAZORPAY_KEY_ID_DEV);

      // 3. Open Razorpay checkout
      const options = {
        key: razorpayKeyId,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        name: 'ABPATEL Hardware Shop',
        description: `Order #${order.orderNumber}`,
        order_id: rpOrder.razorpayOrderId,
        handler: async (response: RazorpayResponse) => {
          try {
            await api.post('/orders/verify-payment', {
              orderId: order.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            dispatch(clearCart());
            navigate(`/order-success?orderId=${order.id}&orderNumber=${order.orderNumber}`);
          } catch (verifyErr: unknown) {
            const err = verifyErr as { response?: { data?: { message?: string } } };
            setError(err.response?.data?.message || 'Payment verification failed. Contact support.');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: contact.name,
          email: contact.email,
          contact: contact.phone,
        },
        theme: { color: '#C47D2B' },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      if (!window.Razorpay) {
        setError('Payment system not loaded. Please refresh and try again.');
        setIsProcessing(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create order. Please try again.');
      setIsProcessing(false);
    }
  }, [contact, shipping, paymentMethod, items, dispatch, navigate]);

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-text-muted mb-8 font-body">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 mx-2" />
          <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
          <ChevronRight className="w-3.5 h-3.5 mx-2" />
          <span className="text-text font-medium">Checkout</span>
        </nav>

        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary mb-8">Checkout</h1>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((step, idx) => {
            const isActive = idx === stepIndex;
            const isCompleted = idx < stepIndex;
            return (
              <div key={step.key} className="flex-1 flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-accent text-white'
                        : isCompleted
                          ? 'bg-success text-white'
                          : 'bg-border text-text-muted'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                  </div>
                  <span
                    className={`hidden sm:block text-sm font-medium ${
                      isActive ? 'text-accent' : isCompleted ? 'text-success' : 'text-text-muted'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-3 transition-colors ${
                      idx < stepIndex ? 'bg-success' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-error/10 border border-error/30 rounded-md text-sm text-error">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2">
            {/* Step: Contact */}
            {currentStep === 'contact' && (
              <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
                <h2 className="font-heading text-lg font-bold text-primary mb-6">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => setContact({ ...contact, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-md text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-bg"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">Email *</label>
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => setContact({ ...contact, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-border rounded-md text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-bg"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">Phone *</label>
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-border rounded-md text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-bg"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Shipping */}
            {currentStep === 'shipping' && (
              <div className="space-y-4">
                {loadingAddresses ? (
                  <div className="bg-surface rounded-lg p-6 shadow-sm border border-border flex items-center justify-center gap-3 text-text-muted">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading your saved addresses…</span>
                  </div>
                ) : (
                  <>
                    {/* Saved Addresses */}
                    {savedAddresses.length > 0 && (
                      <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
                        <h2 className="font-heading text-lg font-bold text-primary mb-4">Deliver To</h2>
                        <div className="space-y-3">
                          {savedAddresses.map((addr) => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => handleSelectAddress(addr)}
                              className={`w-full text-left flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                                selectedAddressId === addr.id && !showNewAddressForm
                                  ? 'border-accent bg-accent/5'
                                  : 'border-border hover:border-primary/40'
                              }`}
                            >
                              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                selectedAddressId === addr.id && !showNewAddressForm
                                  ? 'border-accent bg-accent'
                                  : 'border-border'
                              }`}>
                                {selectedAddressId === addr.id && !showNewAddressForm && (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                                  <p className="text-sm font-semibold text-text">{addr.name}</p>
                                  {addr.isDefault && (
                                    <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">Default</span>
                                  )}
                                </div>
                                <p className="text-sm text-text-muted">
                                  {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
                                </p>
                                <p className="text-sm text-text-muted">
                                  {addr.city}, {addr.state} — {addr.pinCode}
                                </p>
                                <p className="text-xs text-text-muted mt-1">{addr.phone}</p>
                              </div>
                            </button>
                          ))}

                          {/* Add new address option */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewAddressForm(true);
                              setSelectedAddressId(null);
                              setShipping({ line1: '', line2: '', city: '', state: '', pinCode: '' });
                            }}
                            className={`w-full text-left flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                              showNewAddressForm
                                ? 'border-accent bg-accent/5'
                                : 'border-dashed border-border hover:border-primary/40'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                              showNewAddressForm ? 'border-accent bg-accent' : 'border-border'
                            }`}>
                              {showNewAddressForm && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <Plus className="w-4 h-4 text-text-muted" />
                            <span className="text-sm font-medium text-text-muted">Use a different address</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* New Address Form */}
                    {(showNewAddressForm || savedAddresses.length === 0) && (
                      <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
                        <h2 className="font-heading text-lg font-bold text-primary mb-4">
                          {savedAddresses.length > 0 ? 'New Shipping Address' : 'Shipping Address'}
                        </h2>
                        <p className="text-xs text-text-muted mb-4">This address will be saved to your account for future orders.</p>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-text mb-1.5">Address Line 1 *</label>
                            <input
                              type="text"
                              value={shipping.line1}
                              onChange={(e) => setShipping({ ...shipping, line1: e.target.value })}
                              className="w-full px-4 py-2.5 border border-border rounded-md text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-bg"
                              placeholder="123 Main Street, Apt 4B"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-text mb-1.5">Address Line 2</label>
                            <input
                              type="text"
                              value={shipping.line2}
                              onChange={(e) => setShipping({ ...shipping, line2: e.target.value })}
                              className="w-full px-4 py-2.5 border border-border rounded-md text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-bg"
                              placeholder="Near landmark (optional)"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-text mb-1.5">City *</label>
                              <input
                                type="text"
                                value={shipping.city}
                                onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                                className="w-full px-4 py-2.5 border border-border rounded-md text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-bg"
                                placeholder="Mumbai"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-text mb-1.5">State *</label>
                              <input
                                type="text"
                                value={shipping.state}
                                onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                                className="w-full px-4 py-2.5 border border-border rounded-md text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-bg"
                                placeholder="Maharashtra"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-text mb-1.5">PIN Code *</label>
                              <input
                                type="text"
                                maxLength={6}
                                value={shipping.pinCode}
                                onChange={(e) => setShipping({ ...shipping, pinCode: e.target.value.replace(/\D/g, '') })}
                                className="w-full px-4 py-2.5 border border-border rounded-md text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent bg-bg"
                                placeholder="400001"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step: Review */}
            {currentStep === 'review' && (
              <div className="space-y-6">
                {/* Contact Summary */}
                <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading text-lg font-bold text-primary">Contact</h2>
                    <Button onClick={() => setCurrentStep('contact')} className="text-xs text-accent hover:text-accent-dark font-medium">Edit</Button>
                  </div>
                  <p className="text-sm text-text">{contact.name}</p>
                  <p className="text-sm text-text-muted">{contact.email} · {contact.phone}</p>
                </div>

                {/* Shipping Summary */}
                <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading text-lg font-bold text-primary">Ship To</h2>
                    <Button onClick={() => setCurrentStep('shipping')} className="text-xs text-accent hover:text-accent-dark font-medium">Edit</Button>
                  </div>
                  <p className="text-sm text-text">{shipping.line1}{shipping.line2 ? `, ${shipping.line2}` : ''}</p>
                  <p className="text-sm text-text-muted">{shipping.city}, {shipping.state} — {shipping.pinCode}</p>
                </div>

                {/* Items */}
                <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
                  <h2 className="font-heading text-lg font-bold text-primary mb-4">Items ({itemCount})</h2>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 text-sm">
                        <div className="w-12 h-12 rounded-md bg-bg-alt overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-muted text-[10px]">N/A</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-text font-medium line-clamp-1">{item.name}</p>
                          <p className="text-text-muted text-xs">
                            {[item.finish, item.size].filter(Boolean).join(' / ')} · Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-text whitespace-nowrap">
                          ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step: Payment */}
            {currentStep === 'payment' && (
              <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
                <h2 className="font-heading text-lg font-bold text-primary mb-6">Payment Method</h2>
                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'RAZORPAY'
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="RAZORPAY"
                      checked={paymentMethod === 'RAZORPAY'}
                      onChange={() => setPaymentMethod('RAZORPAY')}
                      className="accent-accent w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text">Pay Online</p>
                      <p className="text-xs text-text-muted">UPI, Credit/Debit Card, Net Banking</p>
                    </div>
                    <CreditCard className="w-5 h-5 text-accent" />
                  </label>

                  <label
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="accent-accent w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text">Cash on Delivery</p>
                      <p className="text-xs text-text-muted">Pay when your order arrives</p>
                    </div>
                    <Truck className="w-5 h-5 text-accent" />
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8">
              {stepIndex > 0 ? (
                <Button
                  onClick={goBack}
                  className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary font-medium transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep !== 'payment' ? (
                <Button
                  onClick={goNext}
                  className="px-8 py-3 bg-primary text-white text-sm font-medium uppercase tracking-wider rounded-md hover:bg-primary-dark transition-colors"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handlePlaceOrder}
                  loading={isProcessing}
                  loadingText={paymentMethod === 'COD' ? 'Placing Order...' : 'Processing Payment...'}
                  className="px-8 py-3 bg-accent text-white text-sm font-medium uppercase tracking-wider rounded-md hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {paymentMethod === 'COD' ? 'Place Order' : 'Pay Now'}
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-surface rounded-lg p-6 shadow-sm border border-border sticky top-24">
              <h2 className="font-heading text-lg font-bold text-primary mb-4">Order Summary</h2>

              <div className="space-y-3 border-b border-border pb-4 mb-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
                    <span className="text-text-muted line-clamp-1 flex-1 mr-2">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-text font-medium whitespace-nowrap">
                      ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="text-text font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Shipping</span>
                  <span className={`font-medium ${shippingCharge === 0 ? 'text-success' : 'text-text'}`}>
                    {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
                  </span>
                </div>
                <p className="text-xs text-text-muted italic">GST included in prices</p>
              </div>

              <div className="border-t border-border mt-4 pt-4 flex justify-between">
                <span className="font-heading font-bold text-text">Total</span>
                <span className="font-heading text-xl font-bold text-text">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>

              {shippingCharge > 0 && (
                <p className="text-xs text-accent mt-3">
                  Add ₹{(5000 - subtotal).toLocaleString('en-IN')} more for free shipping!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
