import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, ChevronDown } from 'lucide-react';
import api from '../../lib/api';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectCartItemCount, toggleCartDrawer } from '../../features/cart/cartSlice';
import Button from '../ui/Button';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const cartItemCount = useAppSelector(selectCartItemCount);

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch categories
  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/contact' },
  ];

  // Transparent on hero, solid after scroll
  const isTransparent = !isScrolled && location.pathname === '/';

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: isTransparent
            ? 'linear-gradient(to bottom, rgba(20,18,15,0.6) 0%, transparent 100%)'
            : '#faf8f5',
          borderBottom: isTransparent ? 'none' : '1px solid #e0dbd4',
          boxShadow: isScrolled && !isTransparent ? '0 1px 20px rgba(44,41,36,0.08)' : 'none',
          backdropFilter: isTransparent ? 'none' : 'none',
          paddingTop: isScrolled ? '14px' : '20px',
          paddingBottom: isScrolled ? '14px' : '20px',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex items-center justify-between">

            {/* Mobile Menu Button */}
            <Button
              className="lg:hidden p-2 -ml-2 transition-colors bg-transparent border-none outline-none"
              style={{ color: isTransparent ? 'white' : '#2c2924' }}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 group">
              <span
                className="font-bold tracking-tight transition-colors duration-300 group-hover:opacity-80"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 'clamp(1.25rem, 2vw, 1.6rem)',
                  color: isTransparent ? 'white' : '#2c2924',
                  letterSpacing: '0.05em',
                }}
              >
                AB<span style={{ color: '#b8945a' }}>PATEL</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {/* All Products Mega Menu */}
              <div className="group relative">
                <button
                  className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 pb-0.5"
                  style={{
                    color: isTransparent ? 'rgba(255,255,255,0.85)' : '#2c2924',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  All Products
                  <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
                </button>

                {/* Mega Dropdown */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[560px] pt-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                  <div
                    className="p-6 grid grid-cols-2 gap-x-8 gap-y-4"
                    style={{
                      background: '#faf8f5',
                      border: '1px solid #e0dbd4',
                      borderRadius: '2px',
                      boxShadow: '0 20px 60px rgba(44,41,36,0.15)',
                    }}
                  >
                    {/* Browse all link */}
                    <div className="col-span-2 pb-3 mb-1 border-b" style={{ borderColor: '#e0dbd4' }}>
                      <Link
                        to="/products"
                        className="text-xs uppercase tracking-[0.2em] font-medium hover:opacity-70 transition-opacity flex items-center gap-2"
                        style={{ color: '#b8945a' }}
                      >
                        Browse All Products →
                      </Link>
                    </div>

                    {categories.length > 0 ? categories.map((cat) => (
                      <div key={cat.id}>
                        <Link
                          to={`/category/${cat.slug}`}
                          className="text-sm font-semibold mb-2 block transition-colors hover:opacity-70"
                          style={{ fontFamily: "'Playfair Display', serif", color: '#2c2924' }}
                        >
                          {cat.name}
                        </Link>
                        {cat.children && cat.children.length > 0 && (
                          <ul className="space-y-1.5 pl-2 border-l" style={{ borderColor: '#e0dbd4' }}>
                            {cat.children.slice(0, 4).map(child => (
                              <li key={child.id}>
                                <Link
                                  to={`/category/${child.slug}`}
                                  className="text-xs transition-colors hover:opacity-70"
                                  style={{ color: '#7a7368' }}
                                >
                                  {child.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )) : (
                      <p className="text-xs col-span-2" style={{ color: '#7a7368' }}>Loading categories...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shop by Room */}
              <Link
                to="/#shop-by-room"
                onClick={e => {
                  if (location.pathname === '/') {
                    e.preventDefault();
                    document.getElementById('shop-by-room')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-sm font-medium transition-colors duration-200"
                style={{ color: isTransparent ? 'rgba(255,255,255,0.85)' : '#2c2924' }}
              >
                Shop by Room
              </Link>

              {/* Standard links */}
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  end={link.path === '/'}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors duration-200 ${isActive ? 'opacity-100' : 'hover:opacity-70'}`
                  }
                  style={({ isActive }) => ({
                    color: isTransparent ? 'rgba(255,255,255,0.85)' : '#2c2924',
                    borderBottom: isActive && !isTransparent ? '1px solid #b8945a' : 'none',
                    paddingBottom: '2px',
                  })}
                >
                  {link.name}
                </NavLink>
              ))}
            </nav>

            {/* Utility Icons */}
            <div className="flex items-center gap-1">
              <Button
                className="p-2 transition-colors bg-transparent border-none outline-none"
                style={{ color: isTransparent ? 'rgba(255,255,255,0.8)' : '#2c2924' }}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </Button>
              <Link
                to="/account"
                className="hidden sm:flex p-2 transition-colors"
                style={{ color: isTransparent ? 'rgba(255,255,255,0.8)' : '#2c2924' }}
                aria-label="Account"
              >
                <User className="w-5 h-5" />
              </Link>
              <Button
                onClick={() => dispatch(toggleCartDrawer())}
                className="relative p-2 transition-colors bg-transparent border-none outline-none"
                style={{ color: isTransparent ? 'rgba(255,255,255,0.8)' : '#2c2924' }}
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span
                    className="absolute top-0.5 right-0.5 w-4 h-4 text-white text-[9px] font-bold flex items-center justify-center rounded-full"
                    style={{ background: '#b8945a' }}
                  >
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Side Panel ── */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(20,18,15,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Panel */}
        <div
          className={`absolute inset-y-0 left-0 w-4/5 max-w-sm flex flex-col transition-transform duration-400 ease-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ background: '#faf8f5' }}
        >
          {/* Panel Header */}
          <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid #e0dbd4' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: '#2c2924' }}>
              AB<span style={{ color: '#b8945a' }}>PATEL</span>
            </span>
            <Button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 transition-colors bg-transparent border-none outline-none"
              style={{ color: '#7a7368' }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Nav Links */}
          <div className="flex-1 overflow-y-auto py-6 px-6">
            <nav className="flex flex-col gap-1">
              <Link
                to="/products"
                className="px-3 py-3 text-sm font-medium uppercase tracking-[0.15em] transition-colors hover:opacity-60"
                style={{ color: '#b8945a' }}
              >
                All Products
              </Link>

              <Link
                to="/#shop-by-room"
                onClick={e => {
                  setMobileMenuOpen(false);
                  if (location.pathname === '/') {
                    e.preventDefault();
                    document.getElementById('shop-by-room')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-3 py-3 text-sm font-medium transition-colors hover:opacity-60"
                style={{ color: '#2c2924' }}
              >
                Shop by Room
              </Link>

              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  end={link.path === '/'}
                  className={({ isActive }) =>
                    `px-3 py-3 text-sm font-medium transition-colors ${isActive ? 'opacity-100' : 'hover:opacity-60'}`
                  }
                  style={{ color: '#2c2924' }}
                >
                  {link.name}
                </NavLink>
              ))}
            </nav>

            {/* Mobile Categories */}
            {categories.length > 0 && (
              <div className="mt-6 pt-6" style={{ borderTop: '1px solid #e0dbd4' }}>
                <p className="text-xs uppercase tracking-[0.25em] font-medium mb-4" style={{ color: '#b8945a' }}>
                  Categories
                </p>
                <ul className="space-y-3">
                  {categories.map(cat => (
                    <li key={cat.id}>
                      <Link
                        to={`/category/${cat.slug}`}
                        className="text-sm font-medium block transition-colors hover:opacity-60"
                        style={{ color: '#2c2924' }}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Panel Footer */}
          <div className="p-6" style={{ borderTop: '1px solid #e0dbd4' }}>
            <Link
              to="/account"
              className="flex items-center gap-3 text-sm font-medium transition-colors hover:opacity-60"
              style={{ color: '#2c2924' }}
            >
              <User className="w-4 h-4" />
              Sign In / Account
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
