import { useState, useEffect } from 'react';
import { Package, Download } from 'lucide-react';
import api from '../../../lib/api';
import Button from '../../../components/ui/Button';

interface OrderItem {
  id: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/account/orders');
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const downloadInvoice = (orderId: string) => {
    window.open(`${import.meta.env.VITE_API_URL_DEV?.replace('/api', '') || 'http://localhost:5000'}/api/orders/${orderId}/invoice`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-primary mb-6">My Orders</h2>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-bg rounded-xl border border-border">
          <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <p className="text-text font-medium mb-1">No orders yet</p>
          <p className="text-sm text-text-muted">When you place an order, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-bg rounded-xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-text-muted mb-0.5">
                    Order Placed: {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="font-medium text-text text-sm">
                    Order #: {order.orderNumber}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                    order.status === 'DELIVERED' ? 'bg-success/10 text-success border-success/20' :
                    order.status === 'CANCELLED' ? 'bg-error/10 text-error border-error/20' :
                    'bg-accent/10 text-accent border-accent/20'
                  }`}>
                    {order.status}
                  </span>
                  <Button 
                    onClick={() => downloadInvoice(order.id)}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent transition-colors"
                  >
                    <Download className="w-4 h-4" /> Invoice
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-surface border border-border rounded-lg flex items-center justify-center flex-shrink-0 text-text-muted">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text line-clamp-1">{item.productName}</p>
                          {item.variantName && (
                            <p className="text-xs text-text-muted mt-0.5">{item.variantName}</p>
                          )}
                          <p className="text-xs text-text-muted mt-1">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-text">
                        ₹{(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                  <p className="text-sm font-medium text-text-muted">Total Amount</p>
                  <p className="text-lg font-bold text-primary">₹{parseFloat(order.totalAmount).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
