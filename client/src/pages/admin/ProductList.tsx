import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, Filter, Loader2, Pencil, Trash2, Download } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';

interface ProductVariant {
  id: string;
  finish: string | null;
  size: string | null;
  sku: string;
  mrp: string;
  sellingPrice: string;
  stockQuantity: number;
}

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  isFeatured: boolean;
  isNewArrival: boolean;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  variants: ProductVariant[];
  images: ProductImage[];
  createdAt: string;
}

interface Category { id: string; name: string; }
interface Brand { id: string; name: string; }

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      const [catRes, brandRes] = await Promise.allSettled([
        api.get('/categories/flat'),
        api.get('/brands'),
      ]);
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data);
      if (brandRes.status === 'fulfilled') setBrands(brandRes.value.data);
    };
    loadFilterOptions();
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '15' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (brandFilter) params.brandId = brandFilter;

      const res = await api.get('/products', { params });
      setProducts(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, categoryFilter, brandFilter]);

  useEffect(() => {
    let active = true;
    if (active) fetchProducts();
    return () => { active = false; };
  }, [fetchProducts]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-success/10 text-success',
      DRAFT: 'bg-warning/10 text-warning',
      ARCHIVED: 'bg-text-muted/10 text-text-muted',
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || ''}`}>
        {status}
      </span>
    );
  };

  const getMinPrice = (variants: ProductVariant[]) => {
    if (variants.length === 0) return '—';
    const min = Math.min(...variants.map(v => parseFloat(v.sellingPrice)));
    return `₹${min.toLocaleString('en-IN')}`;
  };

  const getTotalStock = (variants: ProductVariant[]) => {
    return variants.reduce((sum, v) => sum + v.stockQuantity, 0);
  };

  const exportCSV = () => {
    const headers = ['Name', 'SKU', 'Status', 'Category', 'Brand', 'Min Price', 'Stock'];
    const rows = products.map(p => [
      p.name, p.sku, p.status, p.category?.name || '', p.brand?.name || '',
      getMinPrice(p.variants), String(getTotalStock(p.variants))
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Products</h1>
          <p className="text-sm text-text-muted mt-1">{total} products total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/admin/products/bulk')}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 cursor-pointer transition-colors"
          >
            Bulk Upload
          </Button>
          <Button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-bg-alt cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={() => navigate('/admin/products/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Search + Filters Bar */}
      <div className="bg-surface rounded-xl border border-border p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg cursor-pointer transition-colors ${
              showFilters ? 'border-accent text-accent bg-accent/5' : 'border-border text-text-muted hover:bg-bg-alt'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-border">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={brandFilter}
              onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="">All Brands</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Product Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
            <p className="text-sm text-text-muted">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-alt/50">
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted hidden lg:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Stock</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-bg-alt/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-bg-alt border border-border shrink-0 overflow-hidden">
                          {product.images[0] ? (
                            <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-text-muted" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text truncate max-w-[200px]">{product.name}</p>
                          {product.brand && <p className="text-xs text-text-muted">{product.brand.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted hidden md:table-cell">{product.sku}</td>
                    <td className="px-4 py-3 text-text-muted hidden lg:table-cell">{product.category?.name || '—'}</td>
                    <td className="px-4 py-3 font-medium text-text">{getMinPrice(product.variants)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${getTotalStock(product.variants) <= 5 ? 'text-error' : 'text-text'}`}>
                        {getTotalStock(product.variants)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(product.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          onClick={() => navigate(`/admin/products/${product.id}`)}
                          className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md cursor-pointer transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-md cursor-pointer transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-bg-alt cursor-pointer transition-colors"
            >
              Previous
            </Button>
            <Button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-bg-alt cursor-pointer transition-colors"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
