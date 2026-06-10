import { Link } from 'react-router-dom';
import { Package, MapPin, ArrowRight } from 'lucide-react';
import { useAppSelector } from '../../../app/hooks';

export default function AccountDashboard() {
  const { user } = useAppSelector(state => state.auth);

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-primary mb-6">Account Overview</h2>
      
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-bg p-6 rounded-xl border border-border">
          <h3 className="font-semibold text-text mb-4">Profile Details</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-text-muted text-xs mb-0.5">Name</p>
              <p className="font-medium text-text">{user?.name}</p>
            </div>
            {user?.phone && (
              <div>
                <p className="text-text-muted text-xs mb-0.5">Phone</p>
                <p className="font-medium text-text">{user.phone}</p>
              </div>
            )}
            {user?.email && (
              <div>
                <p className="text-text-muted text-xs mb-0.5">Email</p>
                <p className="font-medium text-text">{user.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <Link to="/account/orders" className="group flex items-center justify-between p-5 bg-bg rounded-xl border border-border hover:border-accent transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-text text-sm">Recent Orders</p>
                <p className="text-xs text-text-muted mt-0.5">Track your packages</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
          </Link>
          
          <Link to="/account/addresses" className="group flex items-center justify-between p-5 bg-bg rounded-xl border border-border hover:border-accent transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-text text-sm">Saved Addresses</p>
                <p className="text-xs text-text-muted mt-0.5">Manage delivery locations</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
