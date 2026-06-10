import { useState, useEffect, useCallback } from 'react';
import { Users, Search, Loader2, Download } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';

interface Customer {
  id: string; name: string; email: string; phone: string | null;
  role: string; createdAt: string;
  orders: { id: string; orderNumber: string; totalAmount: string; status: string; createdAt: string }[];
}

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      const res = await api.get('/customers', { params });
      setCustomers(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400); return () => clearTimeout(t); }, [searchInput]);

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Orders', 'Joined'];
    const rows = customers.map(c => [c.name, c.email, c.phone || '', String(c.orders.length), new Date(c.createdAt).toLocaleDateString('en-IN')]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-heading text-2xl font-bold text-text">Customers</h1><p className="text-sm text-text-muted mt-1">{total} customers</p></div>
        <Button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-bg-alt cursor-pointer transition-colors"><Download className="w-4 h-4" /> Export</Button>
      </div>

      <div className="bg-surface rounded-xl border border-border p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all" />
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-text-muted animate-spin" /></div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16"><Users className="w-10 h-10 text-text-muted/30 mx-auto mb-3" /><p className="text-sm text-text-muted">No customers found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-bg-alt/50">
                <th className="text-left px-4 py-3 font-medium text-text-muted">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Orders</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden lg:table-cell">Joined</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-bg-alt/30 transition-colors">
                    <td className="px-4 py-3"><p className="font-medium text-text">{c.name}</p><p className="text-xs text-text-muted">{c.email}</p></td>
                    <td className="px-4 py-3 text-text-muted hidden md:table-cell">{c.phone || '—'}</td>
                    <td className="px-4 py-3 font-medium text-text">{c.orders.length}</td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden lg:table-cell">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
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
          <div className="flex gap-2">
            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-bg-alt cursor-pointer">Previous</Button>
            <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-bg-alt cursor-pointer">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
