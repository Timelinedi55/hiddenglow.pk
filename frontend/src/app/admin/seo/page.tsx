'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineGlobe, HiOutlineDocument, HiOutlinePhotograph, HiOutlineCode, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi';

interface SeoPageConfig {
  key: string;
  label: string;
  path: string;
  title: string;
  description: string;
}

const DEFAULT_PAGES: SeoPageConfig[] = [
  { key: 'home', label: 'Homepage', path: '/', title: '', description: '' },
  { key: 'shop', label: 'Shop', path: '/shop', title: '', description: '' },
  { key: 'about', label: 'About Us', path: '/about', title: '', description: '' },
  { key: 'contact', label: 'Contact', path: '/contact', title: '', description: '' },
  { key: 'faq', label: 'FAQ', path: '/faq', title: '', description: '' },
  { key: 'privacy', label: 'Privacy Policy', path: '/privacy-policy', title: '', description: '' },
  { key: 'terms', label: 'Terms & Conditions', path: '/terms', title: '', description: '' },
  { key: 'returns', label: 'Returns & Exchange', path: '/returns', title: '', description: '' },
  { key: 'shipping', label: 'Shipping Policy', path: '/shipping', title: '', description: '' },
];

export default function AdminSeoPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [pages, setPages] = useState<SeoPageConfig[]>(DEFAULT_PAGES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'pages' | 'technical' | 'social'>('pages');

  useEffect(() => {
    api.get('/settings').then((data) => {
      setSettings(data);
      // Load saved page SEO from settings
      const savedPages = DEFAULT_PAGES.map((p) => ({
        ...p,
        title: data[`seo_page_${p.key}_title`] || '',
        description: data[`seo_page_${p.key}_description`] || '',
      }));
      setPages(savedPages);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const updatePage = (key: string, field: 'title' | 'description', value: string) => {
    setPages((prev) => prev.map((p) => p.key === key ? { ...p, [field]: value } : p));
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Record<string, string> = { ...settings };
      pages.forEach((p) => {
        updates[`seo_page_${p.key}_title`] = p.title;
        updates[`seo_page_${p.key}_description`] = p.description;
      });
      await api.put('/settings', updates);
      toast.success('SEO settings saved');
    } catch {
      toast.error('Failed to save SEO settings');
    }
    setSaving(false);
  };

  const getScore = (page: SeoPageConfig) => {
    let score = 0;
    if (page.title && page.title.length >= 30 && page.title.length <= 60) score += 50;
    else if (page.title) score += 25;
    if (page.description && page.description.length >= 120 && page.description.length <= 160) score += 50;
    else if (page.description) score += 25;
    return score;
  };

  const overallScore = Math.round(pages.reduce((sum, p) => sum + getScore(p), 0) / pages.length);

  if (loading) return <div className="skeleton h-96 rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">SEO Manager</h1>
          <p className="text-sm text-brand-dark-light mt-1">Optimize your store for search engines</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save All SEO Settings'}
        </button>
      </div>

      {/* SEO Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${overallScore >= 70 ? 'bg-green-100' : overallScore >= 40 ? 'bg-yellow-100' : 'bg-red-100'}`}>
              {overallScore >= 70 ? <HiOutlineCheckCircle className="w-5 h-5 text-green-600" /> : <HiOutlineExclamationCircle className="w-5 h-5 text-yellow-600" />}
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-dark">{overallScore}%</p>
              <p className="text-xs text-brand-dark-light">Overall SEO Score</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center">
              <HiOutlineDocument className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-dark">{pages.filter((p) => p.title).length}/{pages.length}</p>
              <p className="text-xs text-brand-dark-light">Pages with Meta Titles</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center">
              <HiOutlineGlobe className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-dark">{pages.filter((p) => p.description).length}/{pages.length}</p>
              <p className="text-xs text-brand-dark-light">Pages with Descriptions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'pages' as const, label: 'Page SEO', icon: HiOutlineDocument },
          { key: 'social' as const, label: 'Social / Open Graph', icon: HiOutlinePhotograph },
          { key: 'technical' as const, label: 'Technical SEO', icon: HiOutlineCode },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-white shadow-sm text-brand-dark' : 'text-brand-dark-light hover:text-brand-dark'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Page SEO Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-4">
          {pages.map((page) => {
            const score = getScore(page);
            return (
              <div key={page.key} className="bg-white rounded-xl border p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-brand-dark">{page.label}</h3>
                    <span className="text-xs text-brand-dark-light bg-gray-100 px-2 py-0.5 rounded">{page.path}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${score >= 80 ? 'bg-green-100 text-green-700' : score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                    {score}%
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Meta Title
                      <span className={`ml-2 text-xs ${page.title.length > 0 && page.title.length <= 60 ? 'text-green-600' : 'text-brand-dark-light'}`}>
                        {page.title.length}/60
                      </span>
                    </label>
                    <input type="text" value={page.title}
                      onChange={(e) => updatePage(page.key, 'title', e.target.value)}
                      placeholder={`${page.label} | Hidden Glow`}
                      className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Meta Description
                      <span className={`ml-2 text-xs ${page.description.length >= 120 && page.description.length <= 160 ? 'text-green-600' : 'text-brand-dark-light'}`}>
                        {page.description.length}/160
                      </span>
                    </label>
                    <input type="text" value={page.description}
                      onChange={(e) => updatePage(page.key, 'description', e.target.value)}
                      placeholder="Describe this page in 150-160 characters..."
                      className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                  </div>
                </div>
                {/* Google Preview */}
                {(page.title || page.description) && (
                  <div className="mt-3 border rounded-lg p-3 bg-gray-50">
                    <p className="text-xs text-brand-dark-light mb-1">Google Preview</p>
                    <p className="text-blue-700 text-base font-medium truncate">{page.title || `${page.label} | Hidden Glow`}</p>
                    <p className="text-green-700 text-xs">hiddenglow.pk{page.path}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{page.description || 'No description set'}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Social / Open Graph Tab */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">Open Graph (Facebook / WhatsApp / LinkedIn)</h2>
            <p className="text-sm text-brand-dark-light">These settings control how your site looks when shared on social media.</p>
            <div>
              <label className="block text-sm font-medium mb-1">OG Site Name</label>
              <input type="text" value={settings.seo_og_site_name || ''} onChange={(e) => updateSetting('seo_og_site_name', e.target.value)}
                placeholder="Hidden Glow" className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">OG Default Title</label>
              <input type="text" value={settings.seo_og_title || ''} onChange={(e) => updateSetting('seo_og_title', e.target.value)}
                placeholder="Hidden Glow — Premium Women's Innerwear" className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">OG Default Description</label>
              <textarea value={settings.seo_og_description || ''} onChange={(e) => updateSetting('seo_og_description', e.target.value)}
                rows={2} placeholder="Premium innerwear for confident women. Free delivery across Pakistan."
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">OG Default Image URL</label>
              <input type="text" value={settings.seo_og_image || ''} onChange={(e) => updateSetting('seo_og_image', e.target.value)}
                placeholder="/uploads/settings/og-image.jpg" className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              <p className="text-xs text-brand-dark-light mt-1">Recommended: 1200x630px image</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">Twitter Card</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Twitter Card Type</label>
              <select value={settings.seo_twitter_card || 'summary_large_image'} onChange={(e) => updateSetting('seo_twitter_card', e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary with Large Image</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Twitter Handle</label>
              <input type="text" value={settings.seo_twitter_handle || ''} onChange={(e) => updateSetting('seo_twitter_handle', e.target.value)}
                placeholder="@hiddenglow" className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
          </div>
        </div>
      )}

      {/* Technical SEO Tab */}
      {activeTab === 'technical' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">Search Engine Verification</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Google Search Console</label>
              <input type="text" value={settings.seo_google_verification || ''} onChange={(e) => updateSetting('seo_google_verification', e.target.value)}
                placeholder="Verification code from Google Search Console" className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bing Webmaster</label>
              <input type="text" value={settings.seo_bing_verification || ''} onChange={(e) => updateSetting('seo_bing_verification', e.target.value)}
                placeholder="Verification code from Bing Webmaster" className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
          </div>
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">Robots & Indexing</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Robots Meta Tag</label>
              <select value={settings.seo_robots || 'index, follow'} onChange={(e) => updateSetting('seo_robots', e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option value="index, follow">Index, Follow (Recommended)</option>
                <option value="noindex, follow">NoIndex, Follow</option>
                <option value="index, nofollow">Index, NoFollow</option>
                <option value="noindex, nofollow">NoIndex, NoFollow</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Canonical Base URL</label>
              <input type="text" value={settings.seo_canonical_url || ''} onChange={(e) => updateSetting('seo_canonical_url', e.target.value)}
                placeholder="https://hiddenglow.pk" className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
          </div>
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-lg">Schema.org / Structured Data</h2>
            <p className="text-sm text-brand-dark-light">Structured data is automatically generated for product pages. You can add custom organization schema here.</p>
            <div>
              <label className="block text-sm font-medium mb-1">Organization Name</label>
              <input type="text" value={settings.seo_org_name || ''} onChange={(e) => updateSetting('seo_org_name', e.target.value)}
                placeholder="Hidden Glow" className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Organization Logo URL</label>
              <input type="text" value={settings.seo_org_logo || ''} onChange={(e) => updateSetting('seo_org_logo', e.target.value)}
                placeholder="/uploads/settings/logo.png" className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-lg mb-3">SEO Checklist</h2>
            <div className="space-y-2">
              {[
                { label: 'All pages have meta titles', done: pages.every((p) => p.title.length > 0) },
                { label: 'All pages have meta descriptions', done: pages.every((p) => p.description.length > 0) },
                { label: 'Google Search Console verified', done: !!settings.seo_google_verification },
                { label: 'Open Graph image set', done: !!settings.seo_og_image },
                { label: 'Canonical URL configured', done: !!settings.seo_canonical_url },
                { label: 'Organization schema set', done: !!settings.seo_org_name },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {item.done ? <HiOutlineCheckCircle className="w-4 h-4" /> : <span className="w-2 h-2 bg-gray-300 rounded-full" />}
                  </div>
                  <span className={item.done ? 'text-brand-dark' : 'text-brand-dark-light'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
