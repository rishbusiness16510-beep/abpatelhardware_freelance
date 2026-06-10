import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Tags, Plus, Pencil, Trash2, X, Save, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import ImageUploader from '../../components/admin/ImageUploader';

interface Brand {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
}

const emptyForm = { name: '', logoUrl: '', description: '' };

export default function BrandManager() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchBrands = async () => {
    try {
      const res = await api.get('/brands');
      setBrands(res.data);
    } catch (err) {
      console.error('Failed to fetch brands', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError('');
  };

  const openEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setForm({ name: brand.name, logoUrl: brand.logoUrl || '', description: brand.description || '' });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        logoUrl: form.logoUrl || null,
        description: form.description || null,
      };
      if (editingId) {
        await api.put(`/brands/${editingId}`, payload);
      } else {
        await api.post('/brands', payload);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await fetchBrands();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? Products linked to this brand will lose their brand association.')) return;
    try {
      await api.delete(`/brands/${id}`);
      await fetchBrands();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete brand');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Brands</h1>
          <p className="text-sm text-text-muted mt-1">Manage your product brands</p>
        </div>
        <Button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </Button>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Brand List */}
        <div className="flex-1 bg-surface rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
            </div>
          ) : brands.length === 0 ? (
            <div className="text-center py-16">
              <Tags className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
              <p className="text-sm text-text-muted">No brands yet</p>
              <Button onClick={openCreate} className="text-sm text-accent hover:underline mt-2 cursor-pointer">
                Create your first brand
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {brands.map((brand) => (
                <div key={brand.id} className="flex items-center gap-4 px-5 py-4 hover:bg-bg-alt/50 transition-colors group">
                  {/* Logo preview */}
                  <div className="w-10 h-10 rounded-lg bg-bg-alt border border-border flex items-center justify-center shrink-0 overflow-hidden">
                    {brand.logoUrl ? (
                      <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <Tags className="w-4 h-4 text-text-muted" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text">{brand.name}</p>
                    {brand.description && (
                      <p className="text-xs text-text-muted truncate mt-0.5">{brand.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => openEdit(brand)}
                      className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md cursor-pointer transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(brand.id)}
                      className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-md cursor-pointer transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Panel */}
        {showForm && (
          <div className="w-full lg:w-96 bg-surface rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-text">
                {editingId ? 'Edit Brand' : 'New Brand'}
              </h2>
              <Button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text cursor-pointer">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {error && (
              <div className="bg-error/5 border border-error/20 text-error text-sm rounded-lg px-3 py-2 mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="brand-name" className="block text-sm font-medium text-text mb-1">Brand Name</label>
                <input
                  id="brand-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  placeholder="e.g. ABPATEL"
                />
              </div>

              <ImageUploader
                value={form.logoUrl}
                onChange={(url) => setForm({ ...form, logoUrl: url })}
                folder="abpatel-hardware/brands"
                label="Brand Logo"
              />

              <div>
                <label htmlFor="brand-desc" className="block text-sm font-medium text-text mb-1">Description</label>
                <textarea
                  id="brand-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
                  placeholder="Brief description of the brand..."
                />
              </div>

              <Button
                type="submit"
                loading={saving}
                loadingText={editingId ? 'Updating...' : 'Creating...'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Update Brand' : 'Create Brand'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
