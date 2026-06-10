import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react';
import api from '../../lib/api';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  lowStockCount: number;
  totalCategories: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    lowStockCount: 0,
    totalCategories: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch real data from APIs
        const [productsRes, categoriesRes] = await Promise.allSettled([
          api.get('/products?limit=1&status=ACTIVE'),
          api.get('/categories/flat'),
        ]);

        setStats({
          totalProducts: productsRes.status === 'fulfilled' ? productsRes.value.data.pagination?.total || 0 : 0,
          totalOrders: 0, // Will be populated when order routes are built
          lowStockCount: 0, // Will be calculated from variant stock
          totalCategories: categoriesRes.status === 'fulfilled' ? categoriesRes.value.data.length : 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { 
      label: 'Total Products', 
      value: stats.totalProducts, 
      icon: Package, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Total Orders', 
      value: stats.totalOrders, 
      icon: ShoppingCart, 
      color: 'text-accent', 
      bg: 'bg-accent/5' 
    },
    { 
      label: 'Low Stock Items', 
      value: stats.lowStockCount, 
      icon: AlertTriangle, 
      color: 'text-warning', 
      bg: 'bg-warning/5' 
    },
    { 
      label: 'Categories', 
      value: stats.totalCategories, 
      icon: TrendingUp, 
      color: 'text-success', 
      bg: 'bg-success/5' 
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">Welcome back. Here's what's happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-text font-body">
              {isLoading ? (
                <span className="inline-block w-12 h-7 bg-bg-alt rounded animate-pulse" />
              ) : value}
            </p>
            <p className="text-xs text-text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="font-heading text-lg font-semibold text-text mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/admin/products"
            className="flex items-center gap-3 px-4 py-3 bg-bg rounded-lg border border-border hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer"
          >
            <Package className="w-5 h-5 text-accent" />
            <div>
              <p className="text-sm font-medium text-text">Manage Products</p>
              <p className="text-xs text-text-muted">Add, edit, or remove products</p>
            </div>
          </Link>
          <Link
            to="/admin/categories"
            className="flex items-center gap-3 px-4 py-3 bg-bg rounded-lg border border-border hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer"
          >
            <TrendingUp className="w-5 h-5 text-accent" />
            <div>
              <p className="text-sm font-medium text-text">Manage Categories</p>
              <p className="text-xs text-text-muted">Organize your product catalog</p>
            </div>
          </Link>
          <Link
            to="/admin/orders"
            className="flex items-center gap-3 px-4 py-3 bg-bg rounded-lg border border-border hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5 text-accent" />
            <div>
              <p className="text-sm font-medium text-text">View Orders</p>
              <p className="text-xs text-text-muted">Process and track orders</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
