'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  HiOutlineCog, HiOutlinePhone, HiOutlineGlobe, HiOutlineTruck,
  HiOutlineCode, HiOutlineDocumentText, HiOutlinePhotograph,
} from 'react-icons/hi';

type TabKey = 'general' | 'contact' | 'social' | 'shipping' | 'seo' | 'marketing' | 'footer';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'general', label: 'General', icon: HiOutlineCog },
  { key: 'contact', label: 'Contact', icon: HiOutlinePhone },
  { key: 'social', label: 'Social Media', icon: HiOutlineGlobe },
  { key: 'shipping', label: 'Shipping', icon: HiOutlineTruck },
  { key: 'seo', label: 'SEO & OG', icon: HiOutlineDocumentText },
  { key: 'marketing', label: 'Marketing', icon: HiOutlineCode },
  { key: 'footer', label: 'Footer', icon: HiOutlineDocumentText },
];

const GROUPS: Record<TabKey, { title: string; fields: { key: string; label: string; type: 'text' | 'textarea' | 'image'; hint?: string }[] }[]> = {
  general: [{
    title: 'General Settings', fields: [
      { key: 'site_name', label: 'Site Name', type: 'text' },
      { key: 'tagline', label: 'Tagline', type: 'text' },
      { key: 'logo', label: 'Logo', type: 'image' },
      { key: 'favicon', label: 'Favicon', type: 'image', hint: 'Recommended: 32x32 or 48x48 PNG/ICO' },
    ],
  }],
  contact: [{
    title: 'Contact Information', fields: [
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'whatsapp', label: 'WhatsApp Number', type: 'text' },
      { key: 'address', label: 'Address', type: 'text' },
    ],
  }],
  social: [{
    title: 'Social Media URLs', fields: [
      { key: 'instagram', label: 'Instagram', type: 'text' },
      { key: 'facebook', label: 'Facebook', type: 'text' },
      { key: 'tiktok', label: 'TikTok', type: 'text' },
      { key: 'twitter', label: 'Twitter / X', type: 'text' },
    ],
  }],
  shipping: [{
    title: 'Shipping Settings', fields: [
      { key: 'shipping_fee', label: 'Shipping Fee (PKR)', type: 'text' },
      { key: 'free_shipping_threshold', label: 'Free Shipping Above (PKR)', type: 'text' },
    ],
  }],
  seo: [
    {
      title: 'Global SEO', fields: [
        { key: 'seo_site_title', label: 'Default Site Title', type: 'text', hint: 'Shown in browser tab' },
        { key: 'seo_site_description', label: 'Default Meta Description', type: 'textarea', hint: '150-160 characters recommended' },
        { key: 'seo_keywords', label: 'Focus Keywords', type: 'textarea', hint: 'Comma-separated' },
        { key: 'seo_robots', label: 'Robots Meta', type: 'text', hint: 'e.g. index, follow' },
        { key: 'seo_canonical_url', label: 'Canonical Base URL', type: 'text', hint: 'e.g. https://hiddenglow.pk' },
        { key: 'seo_google_verification', label: 'Google Search Console Code', type: 'text' },
        { key: 'seo_bing_verification', label: 'Bing Webmaster Code', type: 'text' },
      ],
    },
    {
      title: 'Open Graph / Social Sharing', fields: [
        { key: 'seo_og_site_name', label: 'OG Site Name', type: 'text' },
        { key: 'seo_og_title', label: 'OG Default Title', type: 'text' },
        { key: 'seo_og_description', label: 'OG Description', type: 'textarea' },
        { key: 'seo_og_image', label: 'OG Image', type: 'image', hint: 'Recommended: 1200x630px' },
        { key: 'seo_twitter_card', label: 'Twitter Card Type', type: 'text', hint: 'summary or summary_large_image' },
        { key: 'seo_twitter_handle', label: 'Twitter Handle', type: 'text', hint: 'e.g. @hiddenglow' },
      ],
    },
    {
      title: 'Schema / Structured Data', fields: [
        { key: 'seo_org_name', label: 'Organization Name', type: 'text' },
        { key: 'seo_org_logo', label: 'Organization Logo URL', type: 'text' },
      ],
    },
  ],
  marketing: [{
    title: 'Marketing & Tracking', fields: [
      { key: 'meta_pixel', label: 'Meta Pixel ID', type: 'text' },
      { key: 'google_analytics', label: 'Google Analytics ID', type: 'text' },
      { key: 'google_ads', label: 'Google Ads ID', type: 'text' },
      { key: 'custom_scripts_head', label: 'Custom Scripts (Head)', type: 'textarea' },
      { key: 'custom_scripts_body', label: 'Custom Scripts (Body)', type: 'textarea' },
    ],
  }],
  footer: [{
    title: 'Footer Settings', fields: [
      { key: 'footer_text', label: 'Footer Copyright Text', type: 'text' },
      { key: 'footer_about', label: 'Footer About Text', type: 'textarea' },
    ],
  }],
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('general');

  useEffect(() => {
    api.get('/settings').then((data) => { setSettings(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const update = (key: string, value: string) => setSettings({ ...settings, [key]: value });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { const r = await api.upload(file, 'settings'); update(key, r.url); } catch { toast.error('Upload failed'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try { await api.put('/settings', settings); toast.success('Saved'); } catch { toast.error('Failed'); }
    setSaving(false);
  };

  if (loading) return <div className="skeleton h-96 rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">Settings</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50 text-sm">
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl border p-1.5">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-brand-dark hover:bg-gray-100'
            }`}>
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {(GROUPS[activeTab] || []).map((group) => (
          <div key={group.title} className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-lg mb-4">{group.title}</h2>
            <div className="space-y-4">
              {group.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1">
                    {field.label}
                    {field.hint && <span className="text-xs text-gray-400 font-normal ml-2">{field.hint}</span>}
                  </label>
                  {field.type === 'image' ? (
                    <div>
                      {settings[field.key] && <img src={getImageUrl(settings[field.key])} alt={field.label} className="h-16 mb-2 rounded" />}
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, field.key)} className="text-sm" />
                    </div>
                  ) : field.type === 'textarea' ? (
                    <textarea value={settings[field.key] || ''} onChange={(e) => update(field.key, e.target.value)}
                      rows={3} className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono text-sm" />
                  ) : (
                    <input type="text" value={settings[field.key] || ''} onChange={(e) => update(field.key, e.target.value)}
                      className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
