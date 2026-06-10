import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { FolderTree, Plus, Pencil, Trash2, X, ChevronRight, Save, Loader2, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import ImageUploader from '../../components/admin/ImageUploader';
import { generateSlug } from '../../lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  children?: Category[];
}

const emptyForm = { name: '', slug: '', description: '', coverImageUrl: '', parentId: '', sortOrder: 0 };

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const [treeRes, flatRes] = await Promise.all([
        api.get('/categories'),
        api.get('/categories/flat'),
      ]);
      setCategories(treeRes.data);
      setFlatCategories(flatRes.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  // generateSlug is imported from shared utils

  const openCreateForm = (parentId: string = '') => {
    setEditingId(null);
    setForm({ ...emptyForm, parentId });
    setShowForm(true);
    setError('');
  };

  const openEditForm = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      coverImageUrl: cat.coverImageUrl || '',
      parentId: cat.parentId || '',
      sortOrder: cat.sortOrder,
    });
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
        slug: form.slug || generateSlug(form.name),
        description: form.description || null,
        coverImageUrl: form.coverImageUrl || null,
        parentId: form.parentId || null,
        sortOrder: form.sortOrder,
      };
      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);
      } else {
        await api.post('/categories', payload);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      await fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const CategoryItem = ({ cat, depth = 0 }: { cat: Category; depth?: number }) => (
    <div>
      <div
        className={`flex items-center gap-3 px-4 py-3 hover:bg-bg-alt/50 transition-colors group ${depth > 0 ? 'border-l-2 border-accent/20' : ''}`}
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        {cat.children && cat.children.length > 0 && (
          <ChevronRight className="w-4 h-4 text-text-muted" />
        )}
        <FolderTree className="w-4 h-4 text-accent shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text truncate">{cat.name}</p>
          <p className="text-xs text-text-muted">/{cat.slug}</p>
        </div>
        <span className="text-xs text-text-muted bg-bg px-2 py-0.5 rounded">#{cat.sortOrder}</span>
        <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
          <Button
            onClick={() => openCreateForm(cat.id)}
            className="p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-md cursor-pointer transition-colors"
            title="Add sub-category"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button
            onClick={() => openEditForm(cat)}
            className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md cursor-pointer transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            onClick={() => handleDelete(cat.id)}
            className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-md cursor-pointer transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {cat.children?.map((child) => (
        <CategoryItem key={child.id} cat={child} depth={depth + 1} />
      ))}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Categories</h1>
          <p className="text-sm text-text-muted mt-1">Organize your product catalog</p>
        </div>
        <Button
          onClick={() => openCreateForm()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Category Tree */}
        <div className="flex-1 bg-surface rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-16">
              <FolderTree className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
              <p className="text-sm text-text-muted">No categories yet</p>
              <Button
                onClick={() => openCreateForm()}
                className="text-sm text-accent hover:underline mt-2 cursor-pointer"
              >
                Create your first category
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {categories.map((cat) => (
                <CategoryItem key={cat.id} cat={cat} />
              ))}
            </div>
          )}
        </div>

        {/* Form Panel */}
        {showForm && (
          <div className="w-full lg:w-96 bg-surface rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-text">
                {editingId ? 'Edit Category' : 'New Category'}
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
                <label htmlFor="cat-name" className="block text-sm font-medium text-text mb-1">Name</label>
                <input
                  id="cat-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, slug: editingId ? form.slug : generateSlug(e.target.value) })}
                  required
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  placeholder="e.g. Cabinet Handles"
                />
              </div>

              <div>
                <label htmlFor="cat-slug" className="block text-sm font-medium text-text mb-1">Slug</label>
                <div className="flex gap-2">
                  <input
                    id="cat-slug"
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    required
                    className="flex-1 px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                    placeholder="cabinet-handles"
                  />
                  <Button
                    type="button"
                    title="Regenerate slug from name"
                    onClick={() => setForm({ ...form, slug: generateSlug(form.name) })}
                    className="px-2.5 py-2 bg-bg border border-border rounded-lg text-text-muted hover:text-accent hover:border-accent transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <p className="text-[11px] text-text-muted mt-1">Auto-generated from name. Edit or click ↺ to regenerate.</p>
              </div>

              <div>
                <label htmlFor="cat-desc" className="block text-sm font-medium text-text mb-1">Description</label>
                <textarea
                  id="cat-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
                  placeholder="Brief description..."
                />
              </div>

              <ImageUploader
                value={form.coverImageUrl}
                onChange={(url) => setForm({ ...form, coverImageUrl: url })}
                folder="abpatel-hardware/categories"
                label="Cover Image"
              />

              <div>
                <label htmlFor="cat-parent" className="block text-sm font-medium text-text mb-1">Parent Category</label>
                <select
                  id="cat-parent"
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                >
                  <option value="">None (Top Level)</option>
                  {flatCategories
                    .filter(c => c.id !== editingId)
                    .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  }
                </select>
              </div>

              <div>
                <label htmlFor="cat-sort" className="block text-sm font-medium text-text mb-1">Sort Order</label>
                <input
                  id="cat-sort"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>

              <Button
                type="submit"
                loading={saving}
                loadingText={editingId ? 'Updating...' : 'Creating...'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Update Category' : 'Create Category'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
