import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Filter, Loader2, Eye } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  shippingName: string;
  totalAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
  items: {
    id: string;
    productName: string;
    variantLabel: string | null;
    quantity: number;
    unitPrice: string;
    gstRate: string;
  }[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-warning/10 text-warning',
  CONFIRMED: 'bg-blue-50 text-blue-600',
  PROCESSING: 'bg-accent/10 text-accent',
  SHIPPED: 'bg-purple-50 text-purple-600',
  DELIVERED: 'bg-success/10 text-success',
  CANCELLED: 'bg-error/10 text-error',
  RETURNED: 'bg-text-muted/10 text-text-muted',
};

export default function OrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/orders', { params });
      setOrders(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    let active = true;
    if (active) fetchOrders();
    return () => { active = false; };
  }, [fetchOrders]);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Orders</h1>
          <p className="text-sm text-text-muted mt-1">{total} orders total</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-surface rounded-xl border border-border p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by order #, name, or email..."
              className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all" />
          </div>
          <Button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg cursor-pointer transition-colors ${showFilters ? 'border-accent text-accent bg-accent/5' : 'border-border text-text-muted hover:bg-bg-alt'}`}>
            <Filter className="w-4 h-4" /> Filters
          </Button>
        </div>
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-border">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30">
              <option value="">All Statuses</option>
              {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'].map(s =>
                <option key={s} value={s}>{s}</option>
              )}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-text-muted animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
            <p className="text-sm text-text-muted">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-alt/50">
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Order #</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">Items</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted hidden lg:table-cell">Payment</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted hidden lg:table-cell">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-bg-alt/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-text">{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="text-text">{order.user?.name || order.shippingName}</p>
                      <p className="text-xs text-text-muted">{order.user?.email || '(Guest)'}</p>
                    </td>
                    <td className="px-4 py-3 text-text-muted hidden md:table-cell">{order.items.length} items</td>
                    <td className="px-4 py-3 font-medium text-text">₹{parseFloat(order.totalAmount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs">{order.paymentMethod}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[order.status] || ''}`}>{order.status}</span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md cursor-pointer transition-colors" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-text-muted">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-bg-alt cursor-pointer transition-colors">Previous</Button>
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-bg-alt cursor-pointer transition-colors">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
