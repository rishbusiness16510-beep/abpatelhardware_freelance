import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Package, MapPin, CreditCard, StickyNote } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';

const ALL_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
const statusColors: Record<string, string> = {
  PENDING: 'bg-warning/10 text-warning border-warning/20',
  CONFIRMED: 'bg-blue-50 text-blue-600 border-blue-200',
  PROCESSING: 'bg-accent/10 text-accent border-accent/20',
  SHIPPED: 'bg-purple-50 text-purple-600 border-purple-200',
  DELIVERED: 'bg-success/10 text-success border-success/20',
  CANCELLED: 'bg-error/10 text-error border-error/20',
  RETURNED: 'bg-text-muted/10 text-text-muted border-text-muted/20',
};

interface OrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantLabel: string | null;
  sku: string;
  quantity: number;
  unitPrice: string;
  gstRate: string;
  totalPrice: string;
  imageUrl: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  guestName: string | null;
  status: string;
  shippingName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPinCode: string;
  subtotal: string;
  gstAmount: string;
  shippingCharge: string;
  totalAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  adminNotes: string | null;
  customerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);
        setNewStatus(res.data.status);
        setAdminNotes(res.data.adminNotes || '');
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [id]);

  const updateStatus = async () => {
    setSaving(true);
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      setOrder((p) => p ? ({ ...p, status: newStatus }) : null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await api.put(`/orders/${id}/notes`, { adminNotes });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-text-muted animate-spin" /></div>;
  if (!order) return <div className="text-center py-16 text-text-muted">Order not found</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button onClick={() => navigate('/admin/orders')} className="text-text-muted hover:text-text cursor-pointer"><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold text-text">Order {order.orderNumber}</h1>
          <p className="text-sm text-text-muted mt-0.5">Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <span className={`text-sm font-medium px-3 py-1 rounded-full border ${statusColors[order.status] || ''}`}>{order.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <section className="bg-surface rounded-xl border border-border p-5">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-text mb-4"><Package className="w-4 h-4 text-accent" /> Items ({order.items.length})</h2>
            <div className="divide-y divide-border">
              {order.items.map((item: OrderItem) => (
                <div key={item.id} className="flex items-center gap-4 py-3">
                  <div className="w-12 h-12 rounded-lg bg-bg-alt border border-border shrink-0 overflow-hidden flex items-center justify-center">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-text-muted" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{item.productName}</p>
                    {item.variantLabel && <p className="text-xs text-text-muted">{item.variantLabel}</p>}
                    <p className="text-xs text-text-muted">SKU: {item.sku} · Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-text">₹{parseFloat(item.totalPrice).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </section>
          {/* Address */}
          <section className="bg-surface rounded-xl border border-border p-5">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-text mb-3"><MapPin className="w-4 h-4 text-accent" /> Shipping</h2>
            <div className="text-sm text-text-muted space-y-0.5">
              <p className="font-medium text-text">{order.shippingName} · {order.shippingPhone}</p>
              <p>{order.shippingLine1}{order.shippingLine2 ? `, ${order.shippingLine2}` : ''}</p>
              <p>{order.shippingCity}, {order.shippingState} - {order.shippingPinCode}</p>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Payment */}
          <section className="bg-surface rounded-xl border border-border p-5">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-text mb-3"><CreditCard className="w-4 h-4 text-accent" /> Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Subtotal</span><span>₹{parseFloat(order.subtotal).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">GST</span><span>₹{parseFloat(order.gstAmount).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Shipping</span><span>₹{parseFloat(order.shippingCharge).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between pt-2 border-t border-border font-semibold"><span>Total</span><span>₹{parseFloat(order.totalAmount).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between pt-2 text-xs"><span className="text-text-muted">Method</span><span>{order.paymentMethod}</span></div>
              <div className="flex justify-between text-xs"><span className="text-text-muted">Status</span><span>{order.paymentStatus}</span></div>
            </div>
          </section>
          {/* Status */}
          <section className="bg-surface rounded-xl border border-border p-5">
            <h2 className="font-heading text-base font-semibold text-text mb-3">Update Status</h2>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text mb-3 focus:outline-none focus:ring-2 focus:ring-accent/30">
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button onClick={updateStatus} loading={saving} loadingText="Updating..." disabled={newStatus === order.status}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 cursor-pointer transition-colors">
              <Save className="w-4 h-4" /> Update
            </Button>
          </section>
          {/* Notes */}
          <section className="bg-surface rounded-xl border border-border p-5">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-text mb-3"><StickyNote className="w-4 h-4 text-accent" /> Admin Notes</h2>
            <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none mb-3" placeholder="Internal notes..." />
            <Button onClick={saveNotes} loading={saving} loadingText="Saving..."
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 cursor-pointer transition-colors">
              <Save className="w-4 h-4" /> Save Notes
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
