import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { FileText, Plus, Pencil, Trash2, X, Save, Loader2, Image, ToggleLeft, ToggleRight, Newspaper, RefreshCw, Wand2, Eye, Home } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import ImageUploader from '../../components/admin/ImageUploader';
import StaticPageEditor from '../../components/admin/StaticPageEditor';
import { generateSlug, generateBlogSeoTitle, generateBlogSeoDescription } from '../../lib/utils';


type Tab = 'HERO_BANNER' | 'PROMO_BANNER' | 'STATIC_PAGE' | 'BLOG' | 'ROOM_SECTION';

interface CmsItem { id: string; type: string; title: string; slug: string | null; content: string | null; imageUrl: string | null; linkUrl: string | null; isActive: boolean; sortOrder: number; }
interface BlogItem { id: string; title: string; slug: string; excerpt: string | null; content: string; coverImageUrl: string | null; isPublished: boolean; publishedAt: string | null; seoTitle: string | null; seoDescription: string | null; }

const emptyCms = { title: '', slug: '', content: '', imageUrl: '', linkUrl: '', isActive: true, sortOrder: 0 };
const emptyBlog = { title: '', slug: '', excerpt: '', content: '', coverImageUrl: '', isPublished: false, seoTitle: '', seoDescription: '' };

export default function CmsManager() {
  const [tab, setTab] = useState<Tab>('HERO_BANNER');
  const [cmsItems, setCmsItems] = useState<CmsItem[]>([]);
  const [blogItems, setBlogItems] = useState<BlogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cmsForm, setCmsForm] = useState(emptyCms);
  const [blogForm, setBlogForm] = useState(emptyBlog);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Visual editor state — only for STATIC_PAGE
  const [visualEditorItem, setVisualEditorItem] = useState<CmsItem | null>(null);
  // Blog SEO override — when true, admin edits manually
  const [blogSeoOverride, setBlogSeoOverride] = useState(false);

  const isBlog = tab === 'BLOG';

  const fetchData = useCallback(async () => {
    try {
      if (isBlog) {
        const res = await api.get('/blog/admin');
        setBlogItems(res.data);
      } else {
        const res = await api.get(`/cms?type=${tab}`);
        setCmsItems(res.data);
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, [isBlog, tab]);


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);


  // generateSlug is imported from shared utils

  // Auto-update blog SEO when title/excerpt changes (unless overridden)
  const updateBlogSeo = useCallback((title: string, excerpt: string, override: boolean) => {
    if (!override) {
      setBlogForm(prev => ({
        ...prev,
        seoTitle: title ? generateBlogSeoTitle(title) : '',
        seoDescription: title ? generateBlogSeoDescription(excerpt, title) : '',
      }));
    }
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setCmsForm(emptyCms); setBlogForm(emptyBlog);
    setBlogSeoOverride(false);
    setShowForm(true); setError('');
  };

  const openEditCms = (item: CmsItem) => {
    setEditingId(item.id);
    setCmsForm({ title: item.title, slug: item.slug || '', content: item.content || '', imageUrl: item.imageUrl || '', linkUrl: item.linkUrl || '', isActive: item.isActive, sortOrder: item.sortOrder });
    setShowForm(true); setError('');
  };

  const openEditBlog = (item: BlogItem) => {
    setEditingId(item.id);
    setBlogForm({ title: item.title, slug: item.slug, excerpt: item.excerpt || '', content: item.content, coverImageUrl: item.coverImageUrl || '', isPublished: item.isPublished, seoTitle: item.seoTitle || '', seoDescription: item.seoDescription || '' });
    // If existing SEO was set manually, enable override
    setBlogSeoOverride(Boolean(item.seoTitle || item.seoDescription));
    setShowForm(true); setError('');
  };

  const handleSubmitCms = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { type: tab, title: cmsForm.title, slug: cmsForm.slug || null, content: cmsForm.content || null, imageUrl: cmsForm.imageUrl || null, linkUrl: cmsForm.linkUrl || null, isActive: cmsForm.isActive, sortOrder: cmsForm.sortOrder };
      if (editingId) await api.put(`/cms/${editingId}`, payload);
      else await api.post('/cms', payload);
      setShowForm(false); setEditingId(null); await fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to save');
    }
    finally { setSaving(false); }
  };


  const handleSubmitBlog = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...blogForm, slug: blogForm.slug || generateSlug(blogForm.title), excerpt: blogForm.excerpt || null, coverImageUrl: blogForm.coverImageUrl || null, seoTitle: blogForm.seoTitle || null, seoDescription: blogForm.seoDescription || null };
      if (editingId) await api.put(`/blog/${editingId}`, payload);
      else await api.post('/blog', payload);
      setShowForm(false); setEditingId(null); setBlogSeoOverride(false); await fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to save');
    }
    finally { setSaving(false); }
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      if (isBlog) await api.delete(`/blog/${id}`);
      else await api.delete(`/cms/${id}`);
      await fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Delete failed');
    }
  };


  const tabs: { key: Tab; label: string; icon?: React.ReactNode }[] = [
    { key: 'HERO_BANNER', label: 'Hero Banners' },
    { key: 'PROMO_BANNER', label: 'Promo Banners' },
    { key: 'STATIC_PAGE', label: 'Static Pages' },
    { key: 'ROOM_SECTION', label: 'Shop by Room', icon: <Home className="w-3 h-3" /> },
    { key: 'BLOG', label: 'Blog Posts' },
  ];

  const inputClass = "w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all";

  // Render room-specific hint text
  const roomHint = tab === 'ROOM_SECTION' && (
    <p className="text-xs text-text-muted bg-bg-alt border border-border rounded-lg px-3 py-2 mb-4">
      💡 <strong>Room sections</strong> appear in the "Shop by Room" section on the homepage. Add a name, image, and optional link URL (e.g. <code>/products?room=kitchen</code>). Sort order controls display order.
    </p>
  );

  return (
    <div>
      {/* Visual Editor Overlay */}
      {visualEditorItem && (
        <StaticPageEditor
          item={visualEditorItem}
          onClose={() => setVisualEditorItem(null)}
          onSaved={async () => {
            await fetchData();
          }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-heading text-2xl font-bold text-text">Content Manager</h1><p className="text-sm text-text-muted mt-1">Manage banners, pages & blog</p></div>
        <Button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark cursor-pointer transition-colors"><Plus className="w-4 h-4" /> Add New</Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-bg border border-border rounded-lg mb-6 w-fit">
        {tabs.map(t => (
          <Button key={t.key} onClick={() => { setIsLoading(true); setTab(t.key); setShowForm(false); }}
            className={`flex items-center gap-1.5 flex-1 px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${tab === t.key ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'}`}>
            {t.icon}{t.label}
          </Button>
        ))}
      </div>

      {roomHint}

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* List */}
        <div className="flex-1 bg-surface rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-text-muted animate-spin" /></div>
          ) : (isBlog ? blogItems : cmsItems).length === 0 ? (
            <div className="text-center py-16"><FileText className="w-10 h-10 text-text-muted/30 mx-auto mb-3" /><p className="text-sm text-text-muted">No items yet</p></div>
          ) : isBlog ? (
            <div className="divide-y divide-border">
              {blogItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-bg-alt/50 transition-colors group">
                  <Newspaper className="w-4 h-4 text-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{item.title}</p>
                    <p className="text-xs text-text-muted">/{item.slug} · {item.isPublished ? 'Published' : 'Draft'}</p>
                  </div>
                  <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Button onClick={() => openEditBlog(item)} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md cursor-pointer"><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button onClick={() => handleDelete(item.id)} className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-md cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cmsItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-bg-alt/50 transition-colors group">
                  {item.imageUrl ? <div className="w-10 h-10 rounded-lg bg-bg-alt border border-border overflow-hidden shrink-0"><img src={item.imageUrl} alt="" className="w-full h-full object-cover" /></div> : <Image className="w-4 h-4 text-accent shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{item.title}</p>
                    {item.slug && <p className="text-xs text-text-muted">/{item.slug}</p>}
                    {tab === 'ROOM_SECTION' && item.linkUrl && <p className="text-xs text-text-muted/60">→ {item.linkUrl}</p>}
                  </div>
                  {item.isActive ? <ToggleRight className="w-5 h-5 text-success" /> : <ToggleLeft className="w-5 h-5 text-text-muted" />}
                  <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    {/* Visual Editor button — only for STATIC_PAGE */}
                    {tab === 'STATIC_PAGE' && (
                      <Button
                        onClick={() => setVisualEditorItem(item)}
                        title="Preview & Edit"
                        className="p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-md cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button onClick={() => openEditCms(item)} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md cursor-pointer"><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button onClick={() => handleDelete(item.id)} className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-md cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="w-full lg:w-[420px] bg-surface rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold text-text">{editingId ? 'Edit' : 'New'} {isBlog ? 'Blog Post' : tab.replace(/_/g, ' ').toLowerCase()}</h2>
              <Button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text cursor-pointer"><X className="w-4 h-4" /></Button>
            </div>
            {error && <div className="bg-error/5 border border-error/20 text-error text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

            {isBlog ? (
              <form onSubmit={handleSubmitBlog} className="space-y-4">
                <div><label className="block text-sm font-medium text-text mb-1">Title</label><input type="text" value={blogForm.title} onChange={(e) => {
                  const newTitle = e.target.value;
                  const newSlug = editingId ? blogForm.slug : generateSlug(newTitle);
                  setBlogForm({ ...blogForm, title: newTitle, slug: newSlug });
                  updateBlogSeo(newTitle, blogForm.excerpt, blogSeoOverride);
                }} required className={inputClass} /></div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Slug</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={blogForm.slug}
                      onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                      required
                      disabled={Boolean(editingId)}
                      className={`flex-1 ${inputClass} ${editingId ? 'bg-bg-alt text-text-muted cursor-not-allowed opacity-75' : ''}`}
                    />
                    {!editingId && (
                      <Button type="button" title="Regenerate slug" onClick={() => setBlogForm({ ...blogForm, slug: generateSlug(blogForm.title) })} className="px-2.5 py-2 bg-bg border border-border rounded-lg text-text-muted hover:text-accent hover:border-accent transition-all">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted mt-1">Auto-generated from title. Cannot be changed after creation.</p>
                </div>
                <div><label className="block text-sm font-medium text-text mb-1">Excerpt</label><textarea value={blogForm.excerpt} onChange={(e) => {
                  setBlogForm({ ...blogForm, excerpt: e.target.value });
                  updateBlogSeo(blogForm.title, e.target.value, blogSeoOverride);
                }} rows={2} className={inputClass + ' resize-none'} /></div>
                <div><label className="block text-sm font-medium text-text mb-1">Content (HTML)</label><textarea value={blogForm.content} onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })} rows={6} required className={inputClass + ' resize-none font-mono text-xs'} /></div>
                 <ImageUploader
                  value={blogForm.coverImageUrl}
                  onChange={(url) => setBlogForm({ ...blogForm, coverImageUrl: url })}
                  folder="abpatel-hardware/blog"
                  label="Cover Image"
                />

                <div className="flex items-center gap-2"><input type="checkbox" id="blog-pub" checked={blogForm.isPublished} onChange={(e) => setBlogForm({ ...blogForm, isPublished: e.target.checked })} className="w-4 h-4 accent-accent cursor-pointer" /><label htmlFor="blog-pub" className="text-sm text-text cursor-pointer">Published</label></div>

                {/* Blog SEO — Auto-generated */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text">SEO</p>
                      {!blogSeoOverride && <span className="inline-flex items-center gap-1 text-[11px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium"><Wand2 className="w-3 h-3" /> Auto</span>}
                    </div>
                    <Button type="button" onClick={() => { setBlogSeoOverride(v => !v); }} className="text-xs text-text-muted hover:text-accent transition-colors">
                      {blogSeoOverride ? <><Wand2 className="w-3.5 h-3.5 inline mr-1" />Reset Auto</> : <><Eye className="w-3.5 h-3.5 inline mr-1" />Override</>}
                    </Button>
                  </div>
                  <div className="space-y-3 mt-2">
                    <div>
                      <div className="flex justify-between mb-1"><label className="text-xs font-medium text-text">SEO Title</label><span className={`text-[11px] ${blogForm.seoTitle.length > 65 ? 'text-error' : 'text-text-muted'}`}>{blogForm.seoTitle.length}/65</span></div>
                      <input type="text" value={blogForm.seoTitle} onChange={(e) => { if (blogSeoOverride) setBlogForm({ ...blogForm, seoTitle: e.target.value }); }} readOnly={!blogSeoOverride} className={`w-full px-3 py-2 border border-border rounded-lg text-xs text-text focus:outline-none transition-all ${blogSeoOverride ? 'bg-bg focus:ring-2 focus:ring-accent/30' : 'bg-bg-alt text-text-muted cursor-default'}`} placeholder="Auto-generated from title" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1"><label className="text-xs font-medium text-text">SEO Description</label><span className={`text-[11px] ${blogForm.seoDescription.length > 160 ? 'text-error' : 'text-text-muted'}`}>{blogForm.seoDescription.length}/160</span></div>
                      <textarea value={blogForm.seoDescription} onChange={(e) => { if (blogSeoOverride) setBlogForm({ ...blogForm, seoDescription: e.target.value }); }} readOnly={!blogSeoOverride} rows={2} className={`w-full px-3 py-2 border border-border rounded-lg text-xs text-text focus:outline-none transition-all resize-none ${blogSeoOverride ? 'bg-bg focus:ring-2 focus:ring-accent/30' : 'bg-bg-alt text-text-muted cursor-default'}`} placeholder="Auto-generated from excerpt" />
                    </div>
                  </div>
                </div>

                <Button type="submit" loading={saving} loadingText="Saving..." className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 cursor-pointer transition-colors">
                  <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Create'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmitCms} className="space-y-4">
                <div><label className="block text-sm font-medium text-text mb-1">Title {tab === 'ROOM_SECTION' && <span className="text-text-muted font-normal">(Room Name)</span>}</label><input type="text" value={cmsForm.title} onChange={(e) => setCmsForm({ ...cmsForm, title: e.target.value })} required className={inputClass} placeholder={tab === 'ROOM_SECTION' ? 'e.g. Kitchen, Bathroom...' : ''} /></div>
                {tab === 'STATIC_PAGE' && (
                  <div>
                    <label className="block text-sm font-medium text-text mb-1">Slug</label>
                    <input 
                      type="text" 
                      value={cmsForm.slug} 
                      onChange={(e) => setCmsForm({ ...cmsForm, slug: e.target.value })} 
                      disabled={Boolean(editingId)}
                      className={`${inputClass} ${editingId ? 'bg-bg-alt text-text-muted cursor-not-allowed opacity-75' : ''}`} 
                      placeholder="about-us" 
                    />
                  </div>
                )}
                {tab === 'STATIC_PAGE' && <div><label className="block text-sm font-medium text-text mb-1">Content (HTML) <span className="text-text-muted font-normal text-xs">— or use the Visual Editor (👁️) button in the list</span></label><textarea value={cmsForm.content} onChange={(e) => setCmsForm({ ...cmsForm, content: e.target.value })} rows={8} className={inputClass + ' resize-none font-mono text-xs'} /></div>}
                 <ImageUploader
                  value={cmsForm.imageUrl}
                  onChange={(url) => setCmsForm({ ...cmsForm, imageUrl: url })}
                  folder={`abpatel-hardware/${tab.toLowerCase()}`}
                  label={tab === 'ROOM_SECTION' ? 'Room Image' : 'Image'}
                />

                {(tab === 'HERO_BANNER' || tab === 'PROMO_BANNER' || tab === 'ROOM_SECTION') && <div><label className="block text-sm font-medium text-text mb-1">Link URL {tab === 'ROOM_SECTION' && <span className="text-text-muted font-normal text-xs">(e.g. /products?room=kitchen)</span>}</label><input type="text" value={cmsForm.linkUrl} onChange={(e) => setCmsForm({ ...cmsForm, linkUrl: e.target.value })} className={inputClass} placeholder={tab === 'ROOM_SECTION' ? '/products?room=kitchen' : 'https://'} /></div>}
                <div className="flex items-center gap-2"><input type="checkbox" id="cms-active" checked={cmsForm.isActive} onChange={(e) => setCmsForm({ ...cmsForm, isActive: e.target.checked })} className="w-4 h-4 accent-accent cursor-pointer" /><label htmlFor="cms-active" className="text-sm text-text cursor-pointer">Active</label></div>
                <div><label className="block text-sm font-medium text-text mb-1">Sort Order</label><input type="number" value={cmsForm.sortOrder} onChange={(e) => setCmsForm({ ...cmsForm, sortOrder: parseInt(e.target.value) || 0 })} className={inputClass} /></div>
                <Button type="submit" loading={saving} loadingText="Saving..." className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 cursor-pointer transition-colors">
                  <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Create'}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
