import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Search, Save, Wand2, Globe, FileText, Package, Newspaper, Eye } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';

/**
 * SEO Manager — Dedicated admin section for managing store-wide SEO settings.
 * Covers: Homepage, Products listing page, About/Contact pages, and global meta defaults.
 */

interface SeoSettings {
  homepageTitle: string;
  homepageDescription: string;
  productsPageTitle: string;
  productsPageDescription: string;
  siteTitle: string; // Appended to all page titles e.g. "Page Name — ABPATEL Hardware"
  defaultDescription: string; // Fallback for pages with no custom meta
  googleAnalyticsId: string;
}

const DEFAULT_SETTINGS: SeoSettings = {
  siteTitle: 'ABPATEL Hardware',
  homepageTitle: 'ABPATEL Hardware Shop — Premium Cabinet Fittings & Hardware Online India',
  homepageDescription: 'Buy premium cabinet handles, hinges, drawer slides, locks & hardware fittings online. Wide range of finishes. Pan-India delivery. Trusted by builders and interior designers.',
  productsPageTitle: 'All Hardware Products — ABPATEL Hardware Shop',
  productsPageDescription: 'Browse our complete range of hardware products including cabinet handles, drawer slides, hinges, locks, and more. Shop online at best prices with pan-India delivery.',
  defaultDescription: 'ABPATEL Hardware Shop — Premium quality hardware fittings for homes and offices. Pan-India delivery.',
  googleAnalyticsId: '',
};

const STORAGE_KEY = 'abpatel_seo_settings';

function charCount(val: string, max: number) {
  return (
    <span className={`text-[11px] ${val.length > max ? 'text-error font-medium' : val.length > max * 0.9 ? 'text-amber-500' : 'text-text-muted'}`}>
      {val.length}/{max}
    </span>
  );
}

interface GooglePreviewProps {
  title: string;
  description: string;
  url?: string;
}
function GooglePreview({ title, description, url = 'abpatel.com' }: GooglePreviewProps) {
  return (
    <div className="p-3 bg-white rounded-lg border border-border/60 shadow-sm">
      <p className="text-[11px] text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
        <Eye className="w-3 h-3" /> Google Search Preview
      </p>
      <p className="text-blue-700 text-sm font-medium leading-tight truncate">{title || 'Page Title'}</p>
      <p className="text-green-700 text-[11px] mb-1">{url}</p>
      <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">{description || 'No description set.'}</p>
    </div>
  );
}

export default function SeoManager() {
  const [settings, setSettings] = useState<SeoSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'homepage' | 'products' | 'global'>('homepage');

  // Load settings from localStorage (or backend if integrated)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // Ignore parse errors, use defaults
    }
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Persist to localStorage (extend to API when backend supports it)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

      // Optionally post to CMS endpoint for STORE_SETTINGS type
      try {
        await api.post('/cms', {
          type: 'STORE_SETTINGS',
          title: 'SEO Settings',
          slug: 'seo-settings',
          content: JSON.stringify(settings),
          isActive: true,
          sortOrder: 0,
        });
      } catch {
        // Silent: CMS may already have this entry — that's fine, localStorage is the source
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof SeoSettings, value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const tabs = [
    { key: 'homepage' as const, icon: Globe, label: 'Homepage' },
    { key: 'products' as const, icon: Package, label: 'Products Page' },
    { key: 'global' as const, icon: FileText, label: 'Global Defaults' },
  ];

  const inputClass = 'w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all';
  const textareaClass = `${inputClass} resize-none`;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text flex items-center gap-2">
            <Search className="w-6 h-6 text-accent" />
            SEO Manager
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage how your store appears in Google and other search engines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
            <Wand2 className="w-3.5 h-3.5" /> Product SEO is auto-generated
          </span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg px-4 py-3 mb-6">
        <p className="text-sm text-text leading-relaxed">
          <span className="font-semibold text-accent">How SEO works here:</span>{' '}
          Product pages generate their SEO automatically from product name, category, brand, and variants.
          This panel controls the <strong>homepage</strong>, <strong>product listing</strong>, and{' '}
          <strong>global fallback</strong> meta tags. Blog post SEO is managed in the CMS section.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-bg border border-border rounded-xl w-fit">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === key
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Homepage Tab */}
        {activeTab === 'homepage' && (
          <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h2 className="font-heading text-base font-semibold text-text">Homepage Meta Tags</h2>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-text">Page Title</label>
                {charCount(settings.homepageTitle, 65)}
              </div>
              <input
                type="text"
                value={settings.homepageTitle}
                onChange={(e) => update('homepageTitle', e.target.value)}
                className={inputClass}
                placeholder="Homepage title for Google search results"
              />
              {settings.homepageTitle.length > 65 && (
                <p className="text-[11px] text-error mt-1">Title exceeds 65 characters — Google will truncate it.</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-text">Meta Description</label>
                {charCount(settings.homepageDescription, 160)}
              </div>
              <textarea
                value={settings.homepageDescription}
                onChange={(e) => update('homepageDescription', e.target.value)}
                rows={3}
                className={textareaClass}
                placeholder="Description shown below your link in Google search"
              />
              {settings.homepageDescription.length > 160 && (
                <p className="text-[11px] text-error mt-1">Description exceeds 160 characters.</p>
              )}
            </div>

            <GooglePreview
              title={settings.homepageTitle}
              description={settings.homepageDescription}
              url="abpatel.com"
            />
          </section>
        )}

        {/* Products Page Tab */}
        {activeTab === 'products' && (
          <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h2 className="font-heading text-base font-semibold text-text">Products Listing Page Meta Tags</h2>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-text">Page Title</label>
                {charCount(settings.productsPageTitle, 65)}
              </div>
              <input
                type="text"
                value={settings.productsPageTitle}
                onChange={(e) => update('productsPageTitle', e.target.value)}
                className={inputClass}
                placeholder="Title for /products page"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-text">Meta Description</label>
                {charCount(settings.productsPageDescription, 160)}
              </div>
              <textarea
                value={settings.productsPageDescription}
                onChange={(e) => update('productsPageDescription', e.target.value)}
                rows={3}
                className={textareaClass}
                placeholder="Description for /products page"
              />
            </div>

            <GooglePreview
              title={settings.productsPageTitle}
              description={settings.productsPageDescription}
              url="abpatel.com/products"
            />
          </section>
        )}

        {/* Global Tab */}
        {activeTab === 'global' && (
          <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <h2 className="font-heading text-base font-semibold text-text">Global SEO Defaults</h2>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Site Name</label>
              <input
                type="text"
                value={settings.siteTitle}
                onChange={(e) => update('siteTitle', e.target.value)}
                className={inputClass}
                placeholder="e.g. ABPATEL Hardware"
              />
              <p className="text-[11px] text-text-muted mt-1">Appended to all page titles: "Product Name — {settings.siteTitle}"</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-text">Default Fallback Description</label>
                {charCount(settings.defaultDescription, 160)}
              </div>
              <textarea
                value={settings.defaultDescription}
                onChange={(e) => update('defaultDescription', e.target.value)}
                rows={2}
                className={textareaClass}
                placeholder="Fallback meta description for pages without a custom one"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Google Analytics ID <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={settings.googleAnalyticsId}
                onChange={(e) => update('googleAnalyticsId', e.target.value)}
                className={inputClass}
                placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
              />
            </div>

            {/* Quick tips */}
            <div className="bg-bg rounded-lg border border-border p-4 space-y-2">
              <p className="text-xs font-semibold text-text flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5 text-accent" /> SEO Quick Tips for Hardware Products
              </p>
              <ul className="text-xs text-text-muted space-y-1.5 leading-relaxed">
                <li>• Product SEO titles are auto-generated: <em>"[Name] | Buy [Category] Online — ABPATEL Hardware"</em></li>
                <li>• Include keywords like "Buy online", "Best Price", "India" — high purchase intent</li>
                <li>• Keep titles under 65 chars and descriptions under 160 chars to avoid Google truncation</li>
                <li>• Category page descriptions are pulled from the category's own description field</li>
                <li>• Blog post SEO is managed in CMS → Blog Posts with auto-generation from title/excerpt</li>
              </ul>
            </div>
          </section>
        )}

        {/* Save button */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm text-success font-medium">✓ Settings saved!</span>
          )}
          <Button
            type="submit"
            loading={saving}
            loadingText="Saving…"
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            Save SEO Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
