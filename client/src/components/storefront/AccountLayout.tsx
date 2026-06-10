import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { User, Package, MapPin, LogOut } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import Button from '../ui/Button';

export default function AccountLayout() {
  const { user } = useAppSelector(state => state.auth);
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Protect account routes
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const menu = [
    { label: 'Dashboard', path: '/account', icon: User, exact: true },
    { label: 'My Orders', path: '/account/orders', icon: Package },
    { label: 'Addresses', path: '/account/addresses', icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-bg py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-primary">My Account</h1>
          <p className="text-text-muted text-sm mt-1">Welcome back, {user.name}</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-surface rounded-xl border border-border p-2 sticky top-24">
              <nav className="space-y-1">
                {menu.map(item => {
                  const isActive = item.exact 
                    ? location.pathname === item.path 
                    : location.pathname.startsWith(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-primary/5 text-primary' 
                          : 'text-text-muted hover:bg-bg hover:text-text'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
                
                <Button
                  onClick={() => dispatch(logout())}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-error hover:bg-error/5 transition-colors text-left"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </Button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3">
            <div className="bg-surface rounded-xl border border-border p-6 md:p-8 min-h-[500px]">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
