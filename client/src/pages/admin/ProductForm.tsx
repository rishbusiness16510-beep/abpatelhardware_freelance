import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, Loader2, ImagePlus, RefreshCw, Wand2, Eye, EyeOff } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import { generateSlug, generateSeoTitle, generateSeoDescription } from '../../lib/utils';

interface VariantForm {
  tempId: string;
  finish: string;
  size: string;
  sku: string;
  mrp: string;
  sellingPrice: string;
  stockQuantity: number;
  isOnSale: boolean;
  salePrice: string;
}

interface ImageForm {
  url: string;
  altText: string;
  sortOrder: number;
  tempVariantId: string;
}

interface Category { id: string; name: string; }
interface Brand { id: string; name: string; }

interface VariantApi {
  id?: string;
  finish?: string | null;
  size?: string | null;
  sku: string;
  mrp: string | number;
  sellingPrice: string | number;
  stockQuantity?: number;
  isOnSale?: boolean;
  salePrice?: string | number | null;
}

interface ImageApi {
  url: string;
  altText?: string | null;
  sortOrder?: number;
  variantId?: string | null;
}


const newVariant = (): VariantForm => ({
  tempId: crypto.randomUUID(),
  finish: '',
  size: '',
  sku: '',
  mrp: '',
  sellingPrice: '',
  stockQuantity: 0,
  isOnSale: false,
  salePrice: '',
});

// Character count colour
function charCountColor(len: number, max: number) {
  if (len > max) return 'text-error';
  if (len > max * 0.9) return 'text-warning';
  return 'text-text-muted';
}

export default function ProductForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [roomTags, setRoomTags] = useState('');
  const [specifications] = useState('');
  const [gstRate, setGstRate] = useState('18');
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('DRAFT');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);

  // SEO state
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoOverride, setSeoOverride] = useState(false); // When true, admin can manually edit SEO

  // Variants & images
  const [variants, setVariants] = useState<VariantForm[]>([newVariant()]);
  const [images, setImages] = useState<ImageForm[]>([]);

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  // ── Derived: auto-generate SEO from current form state ──────────────────
  const autoSeoTitle = useCallback(() => {
    if (!name) return '';
    const catName = categories.find(c => c.id === categoryId)?.name;
    const brandName = brands.find(b => b.id === brandId)?.name;
    return generateSeoTitle({ name, categoryName: catName, brandName });
  }, [name, categoryId, brandId, categories, brands]);

  const autoSeoDescription = useCallback(() => {
    if (!name) return '';
    const catName = categories.find(c => c.id === categoryId)?.name;
    const brandName = brands.find(b => b.id === brandId)?.name;
    const finishes = [...new Set(variants.map(v => v.finish).filter(Boolean))] as string[];
    const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))] as string[];
    const prices = variants.map(v => parseFloat(v.sellingPrice)).filter(p => p > 0);
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : undefined;
    const rooms = roomTags ? roomTags.split(',').map(t => t.trim()).filter(Boolean) : undefined;
    return generateSeoDescription({
      name, categoryName: catName, brandName,
      roomTags: rooms, finishes, sizes, lowestPrice, description,
    });
  }, [name, categoryId, brandId, variants, roomTags, description, categories, brands]);

  // Keep SEO auto-generated unless admin has overridden
  useEffect(() => {
    if (!seoOverride) {
      setSeoTitle(autoSeoTitle());
      setSeoDescription(autoSeoDescription());
    }
  }, [seoOverride, autoSeoTitle, autoSeoDescription]);

  useEffect(() => {
    const load = async () => {
      if (isEditing) setLoadingProduct(true);
      const [catRes, brandRes] = await Promise.allSettled([
        api.get('/categories/flat'),
        api.get('/brands'),
      ]);
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data);
      if (brandRes.status === 'fulfilled') setBrands(brandRes.value.data);

      if (isEditing && id) {
        try {
          const res = await api.get(`/products/${id}`);
          const prod = res.data;
          setName(prod.name || '');
          setSlug(prod.slug || '');
          setSlugManuallyEdited(true); // Editing: keep existing slug
          setSku(prod.sku || '');
          setDescription(prod.description || '');
          setCategoryId(prod.categoryId || '');
          setBrandId(prod.brandId || '');
          setRoomTags(Array.isArray(prod.roomTags) ? prod.roomTags.join(', ') : '');
          setGstRate(prod.gstRate ? String(prod.gstRate) : '18');
          setLowStockThreshold(prod.lowStockThreshold ?? 5);
          setStatus(prod.status || 'DRAFT');
          setIsFeatured(prod.isFeatured || false);
          setIsNewArrival(prod.isNewArrival || false);

          // Load existing SEO — if set, turn on override mode
          if (prod.seoTitle || prod.seoDescription) {
            setSeoTitle(prod.seoTitle || '');
            setSeoDescription(prod.seoDescription || '');
            setSeoOverride(true);
          }

          if (prod.variants && prod.variants.length > 0) {
            setVariants(prod.variants.map((v: VariantApi) => ({
              tempId: v.id || crypto.randomUUID(),
              finish: v.finish || '',
              size: v.size || '',
              sku: v.sku || '',
              mrp: v.mrp ? String(v.mrp) : '',
              sellingPrice: v.sellingPrice ? String(v.sellingPrice) : '',
              stockQuantity: v.stockQuantity ?? 0,
              isOnSale: v.isOnSale || false,
              salePrice: v.salePrice ? String(v.salePrice) : '',
            })));
          }

          if (prod.images && prod.images.length > 0) {
            setImages(prod.images.map((img: ImageApi) => ({
              url: img.url || '',
              altText: img.altText || '',
              sortOrder: img.sortOrder || 0,
              tempVariantId: img.variantId || '',
            })));
          }
        } catch (err) {
          console.error('Failed to load product details', err);
          setError('Failed to load product details for editing.');
        } finally {
          setLoadingProduct(false);
        }
      }
    };
    load();
  }, [id, isEditing]);


  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('images', f));
      formData.append('folder', 'abpatel-hardware/products');

      const res = await api.post('/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newImages: ImageForm[] = res.data.map((img: { url: string }, i: number) => ({
        url: img.url,
        altText: '',
        sortOrder: images.length + i,
        tempVariantId: '',
      }));

      setImages(prev => [...prev, ...newImages]);
    } catch (err: unknown) {
      console.error('Upload failed', err);
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addVariant = () => setVariants(prev => [...prev, newVariant()]);

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantForm, value: string | number | boolean) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const finalSlug = slug || generateSlug(name);
      const payload = {
        name, slug: finalSlug, sku, description, categoryId,
        brandId: brandId || null,
        roomTags: roomTags ? roomTags.split(',').map(t => t.trim()) : null,
        specifications: specifications ? JSON.parse(specifications) : null,
        gstRate, lowStockThreshold, status, isFeatured, isNewArrival,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        variants: variants.map(v => ({
          tempId: v.tempId,
          finish: v.finish || null,
          size: v.size || null,
          sku: v.sku,
          mrp: v.mrp,
          sellingPrice: v.sellingPrice,
          stockQuantity: v.stockQuantity,
          isOnSale: v.isOnSale,
          salePrice: v.salePrice || null,
        })),
        images: images.map(img => ({
          url: img.url,
          altText: img.altText || null,
          sortOrder: img.sortOrder,
          tempVariantId: img.tempVariantId || null,
        })),
      };

      if (isEditing) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      navigate('/admin/products');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to save product');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button onClick={() => navigate('/admin/products')} className="text-text-muted hover:text-text cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">
            {isEditing ? 'Edit Product' : 'New Product'}
          </h1>
          <p className="text-sm text-text-muted mt-0.5">Fill in the product details below</p>
        </div>
      </div>

      {error && (
        <div className="bg-error/5 border border-error/20 text-error text-sm rounded-lg px-4 py-3 mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <h2 className="font-heading text-base font-semibold text-text mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prod-name" className="block text-sm font-medium text-text mb-1">Product Name *</label>
              <input id="prod-name" type="text" value={name} required
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugManuallyEdited) setSlug(generateSlug(e.target.value));
                }}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                placeholder="e.g. Premium Brass Cabinet Handle" />
            </div>
            <div>
              <label htmlFor="prod-slug" className="block text-sm font-medium text-text mb-1">Slug *</label>
              <div className="flex gap-2">
                <input id="prod-slug" type="text" value={slug} required
                  onChange={(e) => { setSlug(e.target.value); setSlugManuallyEdited(true); }}
                  className="flex-1 px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  placeholder="premium-brass-cabinet-handle" />
                <Button
                  type="button"
                  title="Regenerate slug from name"
                  onClick={() => { setSlug(generateSlug(name)); setSlugManuallyEdited(false); }}
                  className="px-2.5 py-2 bg-bg border border-border rounded-lg text-text-muted hover:text-accent hover:border-accent transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-[11px] text-text-muted mt-1">Auto-generated from name. Edit or click ↺ to regenerate.</p>
            </div>
            <div>
              <label htmlFor="prod-sku" className="block text-sm font-medium text-text mb-1">SKU *</label>
              <input id="prod-sku" type="text" value={sku} required
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                placeholder="ABPATEL-CH-001" />
            </div>
            <div>
              <label htmlFor="prod-status" className="block text-sm font-medium text-text mb-1">Status</label>
              <select id="prod-status" value={status} onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'DRAFT' | 'ARCHIVED')}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div>
              <label htmlFor="prod-category" className="block text-sm font-medium text-text mb-1">Category *</label>
              <select id="prod-category" value={categoryId} required onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="prod-brand" className="block text-sm font-medium text-text mb-1">Brand</label>
              <select id="prod-brand" value={brandId} onChange={(e) => setBrandId(e.target.value)}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all">
                <option value="">Select brand</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="prod-desc" className="block text-sm font-medium text-text mb-1">Description</label>
            <textarea id="prod-desc" value={description} onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
              placeholder="Product description..." />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label htmlFor="prod-gst" className="block text-sm font-medium text-text mb-1">GST Rate (%)</label>
              <input id="prod-gst" type="text" value={gstRate} onChange={(e) => setGstRate(e.target.value)}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all" />
            </div>
            <div>
              <label htmlFor="prod-lowstock" className="block text-sm font-medium text-text mb-1">Low Stock Alert</label>
              <input id="prod-lowstock" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all" />
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <input id="prod-featured" type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-accent cursor-pointer" />
              <label htmlFor="prod-featured" className="text-sm text-text cursor-pointer">Featured</label>
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <input id="prod-newarrival" type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)}
                className="w-4 h-4 accent-accent cursor-pointer" />
              <label htmlFor="prod-newarrival" className="text-sm text-text cursor-pointer">New Arrival</label>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="prod-rooms" className="block text-sm font-medium text-text mb-1">Room Tags (comma-separated)</label>
            <input id="prod-rooms" type="text" value={roomTags} onChange={(e) => setRoomTags(e.target.value)}
              className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              placeholder="Kitchen, Bathroom, Bedroom" />
          </div>
        </section>

        {/* Variants */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base font-semibold text-text">Variants</h2>
            <Button type="button" onClick={addVariant}
              className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-dark cursor-pointer transition-colors">
              <Plus className="w-4 h-4" /> Add Variant
            </Button>
          </div>

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div key={variant.tempId} className="bg-bg rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-text-muted">Variant {index + 1}</span>
                  {variants.length > 1 && (
                    <Button type="button" onClick={() => removeVariant(index)}
                      className="text-text-muted hover:text-error cursor-pointer transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <input type="text" value={variant.finish} placeholder="Finish (e.g. Antique Brass)"
                    onChange={(e) => updateVariant(index, 'finish', e.target.value)}
                    className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
                  <input type="text" value={variant.size} placeholder="Size (e.g. 6 inch)"
                    onChange={(e) => updateVariant(index, 'size', e.target.value)}
                    className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
                  <input type="text" value={variant.sku} placeholder="Variant SKU *" required
                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                    className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
                  <input type="number" value={variant.stockQuantity} placeholder="Stock"
                    onChange={(e) => updateVariant(index, 'stockQuantity', parseInt(e.target.value) || 0)}
                    className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
                  <input type="text" value={variant.mrp} placeholder="MRP (₹) *" required
                    onChange={(e) => updateVariant(index, 'mrp', e.target.value)}
                    className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
                  <input type="text" value={variant.sellingPrice} placeholder="Selling Price (₹) *" required
                    onChange={(e) => updateVariant(index, 'sellingPrice', e.target.value)}
                    className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
                  <div className="flex items-center gap-2 col-span-2">
                    <input type="checkbox" checked={variant.isOnSale} id={`sale-${index}`}
                      onChange={(e) => updateVariant(index, 'isOnSale', e.target.checked)}
                      className="w-4 h-4 accent-accent cursor-pointer" />
                    <label htmlFor={`sale-${index}`} className="text-sm text-text cursor-pointer">On Sale</label>
                    {variant.isOnSale && (
                      <input type="text" value={variant.salePrice} placeholder="Sale Price (₹)"
                        onChange={(e) => updateVariant(index, 'salePrice', e.target.value)}
                        className="ml-2 flex-1 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Images */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <h2 className="font-heading text-base font-semibold text-text mb-4">Images</h2>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4">
            {images.map((img, index) => (
              <div key={index} className="relative group aspect-square rounded-lg border border-border overflow-hidden bg-bg-alt">
                <img src={img.url} alt={img.altText || 'Product image'} className="w-full h-full object-cover" />
                <Button type="button" onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}

            {/* Upload button */}
            <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-accent/40 flex flex-col items-center justify-center cursor-pointer transition-colors">
              {uploading ? (
                <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-5 h-5 text-text-muted mb-1" />
                  <span className="text-xs text-text-muted">Upload</span>
                </>
              )}
              <input type="file" multiple accept="image/*" className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)} disabled={uploading} />
            </label>
          </div>
        </section>

        {/* SEO — Auto-generated with override option */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-base font-semibold text-text">SEO</h2>
              {!seoOverride && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                  <Wand2 className="w-3 h-3" /> Auto-generated
                </span>
              )}
            </div>
            <Button
              type="button"
              onClick={() => {
                if (seoOverride) {
                  // Reset to auto
                  setSeoOverride(false);
                } else {
                  setSeoOverride(true);
                }
              }}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors"
            >
              {seoOverride ? (
                <><Wand2 className="w-3.5 h-3.5" /> Reset to Auto</>
              ) : (
                <><EyeOff className="w-3.5 h-3.5" /> Override Manually</>
              )}
            </Button>
          </div>
          <p className="text-[11px] text-text-muted mb-4">
            {seoOverride
              ? 'You are manually editing SEO fields. Click "Reset to Auto" to restore auto-generation.'
              : 'SEO fields are auto-generated from product details. Add name, category, and variants above to see them populate.'}
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="seo-title" className="block text-sm font-medium text-text">SEO Title</label>
                <span className={`text-[11px] ${charCountColor(seoTitle.length, 65)}`}>
                  {seoTitle.length}/65
                </span>
              </div>
              <input
                id="seo-title"
                type="text"
                value={seoTitle}
                onChange={(e) => { if (seoOverride) setSeoTitle(e.target.value); }}
                readOnly={!seoOverride}
                className={`w-full px-3 py-2 border border-border rounded-lg text-sm text-text focus:outline-none transition-all ${
                  seoOverride
                    ? 'bg-bg focus:ring-2 focus:ring-accent/30 focus:border-accent'
                    : 'bg-bg-alt text-text-muted cursor-default'
                }`}
                placeholder="Will auto-generate from product name and category"
              />
              {seoTitle.length > 65 && (
                <p className="text-[11px] text-error mt-1">Title is too long — search engines may truncate it.</p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="seo-desc" className="block text-sm font-medium text-text">SEO Description</label>
                <span className={`text-[11px] ${charCountColor(seoDescription.length, 160)}`}>
                  {seoDescription.length}/160
                </span>
              </div>
              <textarea
                id="seo-desc"
                value={seoDescription}
                onChange={(e) => { if (seoOverride) setSeoDescription(e.target.value); }}
                readOnly={!seoOverride}
                rows={3}
                className={`w-full px-3 py-2 border border-border rounded-lg text-sm text-text transition-all resize-none focus:outline-none ${
                  seoOverride
                    ? 'bg-bg focus:ring-2 focus:ring-accent/30 focus:border-accent'
                    : 'bg-bg-alt text-text-muted cursor-default'
                }`}
                placeholder="Will auto-generate from product details"
              />
              {seoDescription.length > 160 && (
                <p className="text-[11px] text-error mt-1">Description is too long — keep it under 160 characters.</p>
              )}
            </div>

            {/* Preview how it looks in search */}
            {(seoTitle || seoDescription) && (
              <div className="mt-2 p-3 bg-bg rounded-lg border border-border/60">
                <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Google Preview
                </p>
                <p className="text-blue-600 text-sm font-medium leading-tight truncate">
                  {seoTitle || name}
                </p>
                <p className="text-green-700 text-[11px] mb-1">abpatel.com/product/{slug || 'product-slug'}</p>
                <p className="text-text-muted text-xs leading-relaxed line-clamp-2">
                  {seoDescription || 'No description yet.'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" onClick={() => navigate('/admin/products')}
            className="px-4 py-2.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-bg-alt cursor-pointer transition-colors">
            Cancel
          </Button>
          <Button type="submit" loading={saving} loadingText={isEditing ? 'Updating...' : 'Creating...'}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 cursor-pointer transition-colors">
            <Save className="w-4 h-4" />
            {isEditing ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
