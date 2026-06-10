import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { useState } from 'react';
import Button from '../ui/Button';
import { 
  LayoutDashboard, Package, FolderTree, Tags, ShoppingCart,
  Users, FileText, LogOut, Menu, X, ChevronDown, Image as ImageIcon, Search
} from 'lucide-react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: FolderTree, label: 'Categories' },
  { to: '/admin/brands', icon: Tags, label: 'Brands' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/media', icon: ImageIcon, label: 'Media Library' },
  { to: '/admin/cms', icon: FileText, label: 'CMS' },
  { to: '/admin/seo', icon: Search, label: 'SEO Manager' },
];

export default function AdminLayout() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Guard: redirect if not logged in or not admin
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-bg font-body">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-primary text-white flex flex-col
        transform transition-transform duration-200 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <h1 className="font-heading text-lg font-bold tracking-tight">ABPATEL</h1>
            <p className="text-xs text-white/50 tracking-widest uppercase">Admin Panel</p>
          </div>
          <Button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/60 hover:text-white cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4.5 h-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <Button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-border px-4 lg:px-6 py-3">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            {/* Mobile menu button */}
            <Button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-text-muted hover:text-text cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Profile dropdown */}
            <div className="relative">
              <Button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-accent font-semibold text-xs">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'}
                  </span>
                </div>
                <span className="hidden sm:inline text-text font-medium">{user?.name || 'Admin'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
              </Button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-lg shadow-lg border border-border py-1 z-20">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-text">{user.name}</p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>
                    <Button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-error hover:bg-error/5 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
