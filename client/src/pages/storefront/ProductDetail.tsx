import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Minus, Plus, MessageCircle, Package, ShieldCheck, Truck } from 'lucide-react';
import api from '../../lib/api';
import { useAppDispatch } from '../../app/hooks';
import { addToCart, openCartDrawer } from '../../features/cart/cartSlice';
import type { CartItem } from '../../features/cart/cartSlice';
import Button from '../../components/ui/Button';

interface Variant {
  id: string;
  finish: string | null;
  size: string | null;
  sku: string;
  mrp: string;
  sellingPrice: string;
  stockQuantity: number;
  isOnSale: boolean;
  salePrice: string | null;
}

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  variantId: string | null;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  specifications: Record<string, string> | null;
  roomTags: string[] | null;
  gstRate: string;
  status: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; logoUrl: string | null } | null;
  variants: Variant[];
  images: ProductImage[];
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'installation'>('description');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const res = await api.get(`/products/${slug}`);
        setProduct(res.data);
        if (res.data.variants?.length > 0) {
          setSelectedVariant(res.data.variants[0]);
        }
      } catch (error) {
        console.error('Failed to fetch product', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  // SEO: Update document title
  useEffect(() => {
    if (product) {
      document.title = product.seoTitle || `${product.name} — ABPATEL Hardware Shop`;
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
        <h2 className="font-heading text-2xl font-bold text-primary mb-4">Product Not Found</h2>
        <Link to="/products" className="text-accent hover:text-accent-dark font-medium">
          ← Browse All Products
        </Link>
      </div>
    );
  }

  const price = selectedVariant ? parseFloat(selectedVariant.sellingPrice) : 0;
  const mrp = selectedVariant ? parseFloat(selectedVariant.mrp) : 0;
  const salePrice = selectedVariant?.isOnSale && selectedVariant?.salePrice ? parseFloat(selectedVariant.salePrice) : null;
  const displayPrice = salePrice ?? price;
  const hasDiscount = mrp > displayPrice;
  const discountPercent = hasDiscount ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;
  const inStock = selectedVariant ? selectedVariant.stockQuantity > 0 : false;

  const uniqueFinishes = [...new Set(product.variants.map(v => v.finish).filter(Boolean))] as string[];
  const uniqueSizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))] as string[];

  const whatsAppMessage = `Hi, I'm interested in: ${product.name}${selectedVariant ? ` (${selectedVariant.finish || ''} ${selectedVariant.size || ''})` : ''} — SKU: ${selectedVariant?.sku || product.sku}`;
  const whatsAppUrl = `https://wa.me/919876543210?text=${encodeURIComponent(whatsAppMessage)}`;

  const allImages = product.images;



  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center flex-wrap text-sm text-text-muted mb-8 font-body">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 mx-2" />
          <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
          {product.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5 mx-2" />
              <Link to={`/category/${product.category.slug}`} className="hover:text-primary transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 mx-2" />
          <span className="text-text font-medium line-clamp-1">{product.name}</span>
        </nav>

        {/* Main Layout: Gallery + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-sm bg-bg-alt">
              {allImages.length > 0 ? (
                <img
                  src={allImages[selectedImageIndex]?.url}
                  alt={allImages[selectedImageIndex]?.altText || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  No Image Available
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNewArrival && (
                  <span className="bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm">New</span>
                )}
                {selectedVariant?.isOnSale && (
                  <span className="bg-error text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm">-{discountPercent}%</span>
                )}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <Button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-20 h-20 flex-shrink-0 rounded-sm overflow-hidden border-2 transition-all ${
                      idx === selectedImageIndex ? 'border-accent' : 'border-transparent hover:border-border'
                    }`}
                  >
                    <img src={img.url} alt={img.altText || ''} className="w-full h-full object-cover" />
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {product.brand && (
              <p className="text-xs text-text-muted uppercase tracking-widest mb-2">{product.brand.name}</p>
            )}
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary mb-3">{product.name}</h1>
            <p className="text-xs text-text-muted mb-6">SKU: {selectedVariant?.sku || product.sku}</p>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-text">
                ₹{displayPrice.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-text-muted line-through">
                    ₹{mrp.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm font-semibold text-success">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* GST Info */}
            <p className="text-xs text-text-muted mb-6">
              Inclusive of {product.gstRate}% GST
            </p>

            {/* Finish Selector */}
            {uniqueFinishes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-text mb-3">Finish</h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueFinishes.map(finish => {
                    const matchingVariant = product.variants.find(v => v.finish === finish);
                    const isSelected = selectedVariant?.finish === finish;
                    return (
                      <Button
                        key={finish}
                        onClick={() => matchingVariant && setSelectedVariant(matchingVariant)}
                        className={`px-4 py-2 text-sm rounded-sm border transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/5 text-accent font-semibold'
                            : 'border-border text-text-muted hover:border-primary'
                        }`}
                      >
                        {finish}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {uniqueSizes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-text mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map(size => {
                    const matchingVariant = product.variants.find(v => v.size === size && (!selectedVariant?.finish || v.finish === selectedVariant.finish));
                    const isSelected = selectedVariant?.size === size;
                    return (
                      <Button
                        key={size}
                        onClick={() => matchingVariant && setSelectedVariant(matchingVariant)}
                        className={`px-4 py-2 text-sm rounded-sm border transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/5 text-accent font-semibold'
                            : 'border-border text-text-muted hover:border-primary'
                        }`}
                      >
                        {size}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {inStock ? (
                <div className="flex items-center gap-2 text-success text-sm font-medium">
                  <Package className="w-4 h-4" />
                  In Stock ({selectedVariant?.stockQuantity} available)
                </div>
              ) : (
                <div className="flex items-center gap-2 text-error text-sm font-medium">
                  <Package className="w-4 h-4" />
                  Out of Stock
                </div>
              )}
            </div>

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-border rounded-sm">
                <Button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary transition-colors"
                  disabled={!inStock}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center text-sm font-medium text-text">{quantity}</span>
                <Button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary transition-colors"
                  disabled={!inStock}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <Button
                disabled={!inStock || !selectedVariant}
                onClick={() => {
                  if (!product || !selectedVariant) return;
                  const cartItem: CartItem = {
                    productId: product.id,
                    variantId: selectedVariant.id,
                    name: product.name,
                    slug: product.slug,
                    sku: selectedVariant.sku,
                    imageUrl: product.images?.[0]?.url || null,
                    finish: selectedVariant.finish,
                    size: selectedVariant.size,
                    unitPrice: displayPrice,
                    mrp: mrp,
                    gstRate: parseFloat(product.gstRate),
                    quantity,
                    maxStock: selectedVariant.stockQuantity,
                  };
                  dispatch(addToCart(cartItem));
                  dispatch(openCartDrawer());
                }}
                className="flex-1 py-3 bg-primary text-white font-medium text-sm uppercase tracking-wider rounded-sm hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add to Cart
              </Button>
            </div>

            {/* WhatsApp Enquiry */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 border border-[#25D366] text-[#25D366] rounded-sm hover:bg-[#25D366] hover:text-white transition-colors text-sm font-medium mb-8"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp Enquiry
            </a>

            {/* Promises */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="text-center">
                <Truck className="w-5 h-5 text-accent mx-auto mb-2" />
                <p className="text-[11px] text-text-muted">Pan-India Delivery</p>
              </div>
              <div className="text-center">
                <ShieldCheck className="w-5 h-5 text-accent mx-auto mb-2" />
                <p className="text-[11px] text-text-muted">Premium Quality</p>
              </div>
              <div className="text-center">
                <Package className="w-5 h-5 text-accent mx-auto mb-2" />
                <p className="text-[11px] text-text-muted">Secure Packaging</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="border-t border-border">
          <div className="flex gap-0 border-b border-border">
            {(['description', 'specs', 'installation'] as const).map(tab => (
              <Button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-muted hover:text-primary'
                }`}
              >
                {tab === 'specs' ? 'Specifications' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>

          <div className="py-8 max-w-3xl">
            {activeTab === 'description' && (
              <div className="prose prose-sm max-w-none text-text leading-relaxed">
                {product.description ? (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                ) : (
                  <p className="text-text-muted">No description available for this product.</p>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div>
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  <table className="w-full text-sm">
                    <tbody>
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <tr key={key} className="border-b border-border/50">
                          <td className="py-3 pr-6 font-medium text-text w-1/3">{key}</td>
                          <td className="py-3 text-text-muted">{value as string}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-text-muted">No specifications available.</p>
                )}
              </div>
            )}

            {activeTab === 'installation' && (
              <div className="text-text-muted text-sm leading-relaxed">
                <p className="mb-4">
                  For professional installation advice, please contact our team through WhatsApp or email.
                  Our hardware fittings are designed for both professional and DIY installation.
                </p>
                <p>
                  For specific installation guides, reach out to us at{' '}
                  <a href="mailto:contact@abpatel.com" className="text-accent hover:text-accent-dark transition-colors">
                    contact@abpatel.com
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
