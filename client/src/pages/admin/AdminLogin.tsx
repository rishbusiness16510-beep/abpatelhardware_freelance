import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { login, clearError } from '../../features/auth/authSlice';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      const user = result.payload.user;
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        // Not an admin — clear and show error
        localStorage.removeItem('abpatel_token');
        localStorage.removeItem('abpatel_user');
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231A2E40' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-primary tracking-tight">
            ABPATEL
          </h1>
          <p className="text-text-muted text-sm mt-1 font-body tracking-widest uppercase">
            Hardware Fittings
          </p>
        </div>
        
        {/* Login Card */}
        <div className="bg-surface rounded-2xl shadow-xl border border-border p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/5 mb-3">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-text">Admin Access</h2>
            <p className="text-text-muted text-sm mt-1">Sign in to manage your store</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-error/5 border border-error/20 text-error rounded-lg px-4 py-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-text mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-lg text-text text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  placeholder="admin@abpatel.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-text mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-bg border border-border rounded-lg text-text text-sm placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              loading={isLoading}
              loadingText="Signing in..."
              className="w-full py-2.5 bg-primary text-white font-medium text-sm rounded-lg hover:bg-primary-dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          &copy; {new Date().getFullYear()} ABPATEL Hardware Shop. All rights reserved.
        </p>
      </div>
    </div>
  );
}
