import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';

import { ChevronRight, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import api from '../../lib/api';
import ProductCard from '../../components/storefront/ProductCard';
import Button from '../../components/ui/Button';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  children?: Category[];
}

interface Brand {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  categoryId: string;
  brandId: string | null;
  brand?: { name: string } | null;
  gstRate: number;
  status: 'ACTIVE' | 'INACTIVE';
  isFeatured: boolean;
  isNewArrival: boolean;
  images: { id: string; url: string; altText: string | null }[];
  variants: {
    id: string;
    finish: string | null;
    size: string | null;
    sku: string;
    sellingPrice: string;
    mrp: string;
    isOnSale: boolean;
    salePrice: string | null;
    stockQuantity: number;
  }[];
}

export default function ProductCatalog() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();


  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Read filters from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentSort = searchParams.get('sort') || 'newest';
  const currentBrandId = searchParams.get('brandId') || '';
  const currentRoom = searchParams.get('room') || '';
  const currentSearch = searchParams.get('search') || '';

  // Fetch metadata (brands, categories) on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [brandsRes, catsRes] = await Promise.allSettled([
          api.get('/brands'),
          api.get('/categories'),
        ]);
        if (brandsRes.status === 'fulfilled') setAllBrands(brandsRes.value.data);
        if (catsRes.status === 'fulfilled') setAllCategories(catsRes.value.data);
      } catch { /* silent */ }
    };
    fetchMeta();
  }, []);

  // Fetch category info when slug changes
  useEffect(() => {
    let active = true;
    const fetchCat = async () => {
      if (!slug) {
        setCategory(null);
        return;
      }
      try {
        const res = await api.get(`/products/by-category/${slug}`);
        if (active) setCategory(res.data);
      } catch {
        if (active) setCategory(null);
      }
    };
    fetchCat();
    return () => { active = false; };
  }, [slug]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(currentPage),
        limit: '12',
        sort: currentSort,
      };
      if (slug) params.categorySlug = slug;
      if (currentBrandId) params.brandId = currentBrandId;
      if (currentRoom) params.room = currentRoom;
      if (currentSearch) params.search = currentSearch;

      const res = await api.get('/products', { params });
      setProducts(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setIsLoading(false);
    }
  }, [slug, currentPage, currentSort, currentBrandId, currentRoom, currentSearch]);

  useEffect(() => {
    // Defer the initial fetch to avoid synchronous setState warnings in strict mode
    const timer = setTimeout(() => {
      fetchProducts();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Helper to update a filter param
  const setFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 when filters change (except page itself)
    if (key !== 'page') newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    if (slug) {
      navigate('/products');
    }
  };

  const hasActiveFilters = Boolean(slug) || Boolean(currentBrandId) || Boolean(currentRoom) || Boolean(currentSearch);


  const rooms = [
    { id: 'kitchen', name: 'Kitchen' },
    { id: 'bathroom', name: 'Bathroom' },
    { id: 'wardrobe', name: 'Wardrobe' },
    { id: 'main-door', name: 'Main Door' },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name_asc', label: 'Name A-Z' },
    { value: 'name_desc', label: 'Name Z-A' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Category Hero (if on a category page) */}
      {category && (
        <div className="relative h-48 md:h-64 bg-primary overflow-hidden">
          {category.coverImageUrl && (
            <img src={category.coverImageUrl} alt={category.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-primary/40"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-8">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2">{category.name}</h1>
            {category.description && (
              <p className="text-white/70 text-sm max-w-xl">{category.description}</p>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm text-text-muted mb-6 font-body">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 mx-2" />
          {category ? (
            <>
              <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
              <ChevronRight className="w-3.5 h-3.5 mx-2" />
              <span className="text-text font-medium">{category.name}</span>
            </>
          ) : (
            <span className="text-text font-medium">All Products</span>
          )}
        </nav>

        {/* Page title (when no category hero) */}
        {!category && (
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-primary">
              {currentSearch ? `Search results for "${currentSearch}"` : 'All Products'}
            </h1>
            <div className="w-16 h-0.5 bg-accent mt-3"></div>
          </div>
        )}

        {/* Sub-category chips */}
        {category?.children && category.children.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {category.children.map(child => (
              <Link
                key={child.id}
                to={`/category/${child.slug}`}
                className="px-4 py-1.5 rounded-full border border-border text-sm text-text-muted hover:bg-primary hover:text-white hover:border-primary transition-all"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        <div className="flex gap-8 lg:gap-12">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-lg font-semibold text-text">Filters</h2>
                {hasActiveFilters && (
                  <Button onClick={clearAllFilters} className="text-xs text-accent hover:text-accent-dark transition-colors">
                    Clear all
                  </Button>
                )}
              </div>
              <FilterContent 
                slug={slug}
                allCategories={allCategories}
                allBrands={allBrands}
                currentBrandId={currentBrandId}
                currentRoom={currentRoom}
                setFilter={setFilter}
                rooms={rooms}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar: Sort + Count + Mobile Filter Toggle */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <p className="text-sm text-text-muted">
                <span className="font-semibold text-text">{pagination.total}</span> products
              </p>
              <div className="flex items-center gap-4">
                {/* Sort */}
                <div className="relative">
                  <select
                    value={currentSort}
                    onChange={(e) => setFilter('sort', e.target.value)}
                    className="appearance-none bg-transparent text-sm text-text font-medium pr-6 cursor-pointer focus:outline-none"
                  >
                    {sortOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" />
                </div>

                {/* Mobile filter toggle */}
                <Button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-text hover:border-primary transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-6">
                {currentBrandId && (
                  <Button onClick={() => setFilter('brandId', '')} className="flex items-center gap-1 px-3 py-1 bg-bg-alt rounded-full text-xs text-text border border-border hover:border-error transition-colors">
                    Brand: {allBrands.find(b => b.id === currentBrandId)?.name}
                    <X className="w-3 h-3" />
                  </Button>
                )}
                {currentRoom && (
                  <Button onClick={() => setFilter('room', '')} className="flex items-center gap-1 px-3 py-1 bg-bg-alt rounded-full text-xs text-text border border-border hover:border-error transition-colors">
                    Room: {rooms.find(r => r.id === currentRoom)?.name}
                    <X className="w-3 h-3" />
                  </Button>
                )}
                {currentSearch && (
                  <Button onClick={() => setFilter('search', '')} className="flex items-center gap-1 px-3 py-1 bg-bg-alt rounded-full text-xs text-text border border-border hover:border-error transition-colors">
                    Search: {currentSearch}
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}

            {/* Product Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-bg-alt rounded-sm mb-4"></div>
                    <div className="h-3 bg-bg-alt rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-bg-alt rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-bg-alt rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-text-muted text-lg mb-4">No products found</p>
                <p className="text-sm text-text-muted mb-6">Try adjusting your filters or search terms.</p>
                <Button onClick={clearAllFilters} className="text-accent hover:text-accent-dark font-medium text-sm transition-colors">
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  disabled={currentPage <= 1}
                  onClick={() => setFilter('page', String(currentPage - 1))}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-sm hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </Button>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-text-muted">…</span>
                      )}
                      <Button
                        onClick={() => setFilter('page', String(p))}
                        className={`w-10 h-10 text-sm font-medium rounded-sm transition-colors ${
                          p === currentPage
                            ? 'bg-primary text-white'
                            : 'border border-border hover:border-primary text-text'
                        }`}
                      >
                        {p}
                      </Button>
                    </span>
                  ))}

                <Button
                  disabled={currentPage >= pagination.totalPages}
                  onClick={() => setFilter('page', String(currentPage + 1))}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-sm hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Panel */}
      <div className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${showMobileFilters ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
        <div className={`absolute inset-y-0 right-0 w-4/5 max-w-sm bg-surface shadow-2xl flex flex-col transition-transform duration-300 ease-out ${showMobileFilters ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-text">Filters</h2>
            <Button onClick={() => setShowMobileFilters(false)} className="p-2 -mr-2 text-text-muted hover:text-error transition-colors">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <FilterContent 
              slug={slug}
              allCategories={allCategories}
              allBrands={allBrands}
              currentBrandId={currentBrandId}
              currentRoom={currentRoom}
              setFilter={setFilter}
              rooms={rooms}
            />
          </div>
          <div className="p-4 border-t border-border bg-bg-alt flex gap-3">
            <Button onClick={clearAllFilters} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-text">
              Clear
            </Button>
            <Button onClick={() => setShowMobileFilters(false)} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium">
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Filter Sidebar JSX (shared between mobile/desktop) ---
interface FilterContentProps {
  slug?: string;
  allCategories: Category[];
  allBrands: Brand[];
  currentBrandId: string;
  currentRoom: string;
  setFilter: (key: string, value: string) => void;
  rooms: { id: string; name: string }[];
}

function FilterContent({ 
  slug, allCategories, allBrands, currentBrandId, currentRoom, setFilter, rooms 
}: FilterContentProps) {
  return (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-text mb-4">Categories</h3>
        <ul className="space-y-2">
          <li>
            <Link
              to="/products"
              className={`text-sm transition-colors block py-1 ${!slug ? 'text-accent font-semibold' : 'text-text-muted hover:text-primary'}`}
            >
              All Products
            </Link>
          </li>
          {allCategories.map(cat => (
            <li key={cat.id}>
              <Link
                to={`/category/${cat.slug}`}
                className={`text-sm transition-colors block py-1 ${slug === cat.slug ? 'text-accent font-semibold' : 'text-text-muted hover:text-primary'}`}
              >
                {cat.name}
              </Link>
              {cat.children && cat.children.length > 0 && (
                <ul className="ml-4 mt-1 space-y-1">
                  {cat.children.map(child => (
                    <li key={child.id}>
                      <Link
                        to={`/category/${child.slug}`}
                        className={`text-xs transition-colors block py-0.5 ${slug === child.slug ? 'text-accent font-semibold' : 'text-text-muted hover:text-primary'}`}
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Brands */}
      {allBrands.length > 0 && (
        <div>
          <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-text mb-4">Brands</h3>
          <ul className="space-y-2">
            <li>
              <Button
                onClick={() => setFilter('brandId', '')}
                className={`text-sm transition-colors block py-1 text-left w-full ${!currentBrandId ? 'text-accent font-semibold' : 'text-text-muted hover:text-primary'}`}
              >
                All Brands
              </Button>
            </li>
            {allBrands.map(brand => (
              <li key={brand.id}>
                <Button
                  onClick={() => setFilter('brandId', brand.id)}
                  className={`text-sm transition-colors block py-1 text-left w-full ${currentBrandId === brand.id ? 'text-accent font-semibold' : 'text-text-muted hover:text-primary'}`}
                >
                  {brand.name}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Room */}
      <div>
        <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-text mb-4">Shop by Room</h3>
        <ul className="space-y-2">
          <li>
            <Button
              onClick={() => setFilter('room', '')}
              className={`text-sm transition-colors block py-1 text-left w-full ${!currentRoom ? 'text-accent font-semibold' : 'text-text-muted hover:text-primary'}`}
            >
              All Rooms
            </Button>
          </li>
          {rooms.map(room => (
            <li key={room.id}>
              <Button
                onClick={() => setFilter('room', room.id)}
                className={`text-sm transition-colors block py-1 text-left w-full ${currentRoom === room.id ? 'text-accent font-semibold' : 'text-text-muted hover:text-primary'}`}
              >
                {room.name}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
