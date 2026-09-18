'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';
import RichTextEditor from '@/components/RichTextEditor';
import MediaImage from '@/components/MediaImage';
import {
  HiOutlinePencil, HiOutlineTrash, HiOutlinePlus,
  HiOutlineChevronUp, HiOutlineChevronDown, HiOutlineCheck,
  HiOutlineX, HiOutlinePhotograph, HiOutlineSave,
  HiOutlineSearchCircle, HiOutlineEye, HiOutlineInformationCircle,
  HiOutlineArrowLeft, HiOutlineExternalLink, HiOutlineDocumentText,
  HiOutlineChevronRight,
} from 'react-icons/hi';

interface CmsItem {
  id: number;
  pageKey: string;
  sectionKey: string;
  title: string;
  content: string;
  metadata: any;
}

interface HeroSlide {
  image: string;
  alt?: string;
}

interface SeoMeta {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  ogTitle: string;
  ogDescription: string;
}

const PAGE_KEYS = ['homepage', 'about', 'contact', 'privacy', 'terms', 'returns', 'shipping'] as const;

const PAGE_LABELS: Record<string, string> = {
  homepage: 'Homepage',
  about: 'About Us',
  contact: 'Contact',
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
  returns: 'Returns & Exchange',
  shipping: 'Shipping Policy',
};

const PAGE_URLS: Record<string, string> = {
  homepage: 'https://hiddenglow.pk/',
  about: 'https://hiddenglow.pk/about',
  contact: 'https://hiddenglow.pk/contact',
  privacy: 'https://hiddenglow.pk/privacy-policy',
  terms: 'https://hiddenglow.pk/terms',
  returns: 'https://hiddenglow.pk/returns',
  shipping: 'https://hiddenglow.pk/shipping',
};

// ─── SEO Scoring Engine ─────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

interface SeoCheck {
  label: string;
  passed: boolean;
  tip: string;
  weight: number;
}

function computeSeoChecks(meta: SeoMeta, allContent: string, pageKey: string): SeoCheck[] {
  const plainContent = stripHtml(allContent);
  const words = countWords(plainContent);
  const keyword = meta.focusKeyword?.toLowerCase().trim() || '';
  const titleLen = (meta.metaTitle || '').length;
  const descLen = (meta.metaDescription || '').length;

  const checks: SeoCheck[] = [
    {
      label: 'Meta title set',
      passed: titleLen > 0,
      tip: 'Add a meta title for this page.',
      weight: 10,
    },
    {
      label: 'Title length (50-60 chars)',
      passed: titleLen >= 50 && titleLen <= 60,
      tip: titleLen < 50 ? `Too short (${titleLen}). Aim for 50-60 characters.` : titleLen > 60 ? `Too long (${titleLen}). Keep under 60 characters.` : 'Good length!',
      weight: 10,
    },
    {
      label: 'Meta description set',
      passed: descLen > 0,
      tip: 'Add a meta description to improve search snippets.',
      weight: 10,
    },
    {
      label: 'Description length (120-160 chars)',
      passed: descLen >= 120 && descLen <= 160,
      tip: descLen < 120 ? `Too short (${descLen}). Aim for 120-160 characters.` : descLen > 160 ? `Too long (${descLen}). Keep under 160 characters.` : 'Good length!',
      weight: 10,
    },
    {
      label: 'Focus keyword set',
      passed: keyword.length > 0,
      tip: 'Set a focus keyword for better SEO targeting.',
      weight: 10,
    },
    {
      label: 'Keyword in title',
      passed: keyword.length > 0 && (meta.metaTitle || '').toLowerCase().includes(keyword),
      tip: keyword ? 'Include your focus keyword in the meta title.' : 'Set a focus keyword first.',
      weight: 10,
    },
    {
      label: 'Keyword in description',
      passed: keyword.length > 0 && (meta.metaDescription || '').toLowerCase().includes(keyword),
      tip: keyword ? 'Include your focus keyword in the description.' : 'Set a focus keyword first.',
      weight: 8,
    },
    {
      label: 'Keyword in content',
      passed: keyword.length > 0 && plainContent.toLowerCase().includes(keyword),
      tip: keyword ? 'Use your focus keyword naturally in the page content.' : 'Set a focus keyword first.',
      weight: 8,
    },
    {
      label: 'Content length (100+ words)',
      passed: words >= 100,
      tip: `Page has ${words} words. Aim for at least 100 words.`,
      weight: 8,
    },
    {
      label: 'Headings used in content',
      passed: /<h[1-6][^>]*>/i.test(allContent),
      tip: 'Use headings (H1-H6) to structure your content for better readability.',
      weight: 6,
    },
    {
      label: 'Internal links in content',
      passed: /<a\s[^>]*href/i.test(allContent),
      tip: 'Add links within your content to improve navigation and SEO.',
      weight: 5,
    },
    {
      label: 'OG title set',
      passed: (meta.ogTitle || '').length > 0,
      tip: 'Add an Open Graph title for social sharing.',
      weight: 5,
    },
  ];

  return checks;
}

function computeSeoScore(checks: SeoCheck[]): number {
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.filter((c) => c.passed).reduce((s, c) => s + c.weight, 0);
  return totalWeight === 0 ? 0 : Math.round((earned / totalWeight) * 100);
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-500';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Good';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}

// ─── SEO Sidebar Component ──────────────────────────────────────────────────────

function SeoSidebar({
  seo,
  onChange,
  onSave,
  checks,
  score,
  pageKey,
  saving,
}: {
  seo: SeoMeta;
  onChange: (seo: SeoMeta) => void;
  onSave: () => void;
  checks: SeoCheck[];
  score: number;
  pageKey: string;
  saving: boolean;
}) {
  const [tab, setTab] = useState<'seo' | 'analysis' | 'preview'>('seo');
  const passedCount = checks.filter((c) => c.passed).length;

  return (
    <div className="w-[340px] flex-shrink-0 hidden xl:block">
      <div className="sticky top-0 space-y-3 max-h-screen overflow-y-auto pb-4 pr-1 scrollbar-thin">
        {/* Score Ring */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`relative w-14 h-14 rounded-full flex items-center justify-center border-4 ${score >= 80 ? 'border-green-500' : score >= 50 ? 'border-yellow-500' : 'border-red-400'}`}>
              <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-brand-dark">SEO Score</p>
              <p className={`text-xs font-medium ${getScoreColor(score)}`}>{getScoreLabel(score)}</p>
              <p className="text-[10px] text-gray-400">{passedCount}/{checks.length} checks passed</p>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${getScoreBg(score)}`} style={{ width: `${score}%` }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="flex border-b">
            {([
              { key: 'seo' as const, label: 'SEO' },
              { key: 'analysis' as const, label: 'Analysis' },
              { key: 'preview' as const, label: 'Preview' },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${tab === t.key ? 'border-brand-primary text-brand-primary bg-brand-bg/30' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {tab === 'seo' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={seo.metaTitle}
                    onChange={(e) => onChange({ ...seo, metaTitle: e.target.value })}
                    placeholder="Page meta title"
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[10px] text-gray-400">50-60 chars</span>
                    <span className={`text-[10px] font-medium ${(seo.metaTitle || '').length >= 50 && (seo.metaTitle || '').length <= 60 ? 'text-green-600' : 'text-gray-400'}`}>
                      {(seo.metaTitle || '').length}/60
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1">Meta Description</label>
                  <textarea
                    value={seo.metaDescription}
                    onChange={(e) => onChange({ ...seo, metaDescription: e.target.value })}
                    placeholder="Page description for search engines"
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[10px] text-gray-400">120-160 chars</span>
                    <span className={`text-[10px] font-medium ${(seo.metaDescription || '').length >= 120 && (seo.metaDescription || '').length <= 160 ? 'text-green-600' : 'text-gray-400'}`}>
                      {(seo.metaDescription || '').length}/160
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1">Focus Keyword</label>
                  <input
                    type="text"
                    value={seo.focusKeyword}
                    onChange={(e) => onChange({ ...seo, focusKeyword: e.target.value })}
                    placeholder="Primary keyword"
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1">OG Title</label>
                  <input
                    type="text"
                    value={seo.ogTitle}
                    onChange={(e) => onChange({ ...seo, ogTitle: e.target.value })}
                    placeholder="Social share title"
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-dark mb-1">OG Description</label>
                  <input
                    type="text"
                    value={seo.ogDescription}
                    onChange={(e) => onChange({ ...seo, ogDescription: e.target.value })}
                    placeholder="Social share description"
                    className="w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="w-full btn-primary text-xs !py-2 flex items-center justify-center gap-1.5"
                >
                  <HiOutlineSave className="w-3.5 h-3.5" />
                  {saving ? 'Saving...' : 'Save SEO'}
                </button>
              </div>
            )}

            {tab === 'analysis' && (
              <div className="space-y-1.5">
                {checks.map((check, idx) => (
                  <div key={idx} className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg ${check.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                    <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] flex-shrink-0 ${check.passed ? 'bg-green-500' : 'bg-red-400'}`}>
                      {check.passed ? '✓' : '✗'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium leading-tight ${check.passed ? 'text-green-800' : 'text-red-800'}`}>{check.label}</p>
                      {!check.passed && <p className="text-[10px] text-red-600 mt-0.5 leading-tight">{check.tip}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'preview' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">Google Preview</p>
                  <div className="border rounded-lg p-3 bg-white">
                    <p className="text-[11px] text-green-700 truncate">{PAGE_URLS[pageKey] || 'https://hiddenglow.pk'}</p>
                    <p className="text-sm text-blue-700 font-medium truncate leading-tight mt-0.5">
                      {seo.metaTitle || PAGE_LABELS[pageKey] + ' - Hidden Glow'}
                    </p>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {seo.metaDescription || 'No description set. Search engines will auto-generate a snippet.'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">Social Preview</p>
                  <div className="border rounded-lg overflow-hidden bg-gray-50">
                    <div className="h-24 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-gray-400 text-[10px]">
                      OG Image
                    </div>
                    <div className="p-2.5">
                      <p className="text-[10px] text-gray-400 uppercase">hiddenglow.pk</p>
                      <p className="text-xs font-bold text-brand-dark truncate">{seo.ogTitle || seo.metaTitle || PAGE_LABELS[pageKey]}</p>
                      <p className="text-[10px] text-gray-500 line-clamp-2">{seo.ogDescription || seo.metaDescription || ''}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page Score Badge ────────────────────────────────────────────────────────────

function PageScoreBadge({ score }: { score: number }) {
  return (
    <span className={`ml-auto inline-flex items-center justify-center w-7 h-5 rounded text-[9px] font-bold text-white ${getScoreBg(score)}`}>
      {score}
    </span>
  );
}

// ─── Hero Slides Manager ───────────────────────────────────────────────────────

function HeroSlidesManager({
  slides,
  onSave,
}: {
  slides: HeroSlide[];
  onSave: (slides: HeroSlide[]) => Promise<void>;
}) {
  const [items, setItems] = useState<HeroSlide[]>(slides);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(slides);
    setDirty(false);
  }, [slides]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const newSlides: HeroSlide[] = [];
      for (const file of Array.from(files)) {
        const res = await api.upload(file, 'settings');
        newSlides.push({ image: res.url, alt: '' });
      }
      setItems((prev) => [...prev, ...newSlides]);
      setDirty(true);
      toast.success(`${newSlides.length} image(s) added`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    setItems(copy);
    setDirty(true);
  };

  const remove = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const updateAlt = (idx: number, alt: string) => {
    setItems((prev) => prev.map((s, i) => (i === idx ? { ...s, alt } : s)));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(items);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiOutlinePhotograph className="w-5 h-5 text-brand-primary" />
          <h3 className="font-semibold text-brand-dark">Hero Slides</h3>
          <span className="text-xs text-gray-400 ml-1">{items.length} slide(s)</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-outline text-sm !py-1.5 !px-3 flex items-center gap-1.5"
          >
            <HiOutlinePlus className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Add Images'}
          </button>
          {dirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-sm !py-1.5 !px-3 flex items-center gap-1.5"
            >
              <HiOutlineSave className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Slides'}
            </button>
          )}
        </div>
      </div>

      {/* Recommended size hint */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
        <HiOutlineInformationCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-700">
          <span className="font-semibold">Recommended:</span> 1080 × 1920px (9:16 portrait) for mobile-first display. Images will be cropped to 3:4 on desktop.
          Use high quality JPEG/WebP under 500KB per slide.
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-gray-400 py-8 text-center border border-dashed rounded-xl">
          No hero slides yet. Click &quot;Add Images&quot; to upload.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((slide, idx) => (
            <div key={`${slide.image}-${idx}`} className="group relative border rounded-xl overflow-hidden bg-gray-50">
              <div className="aspect-[3/4] relative">
                <MediaImage src={slide.image} alt={slide.alt || `Slide ${idx + 1}`} className="object-cover" />
              </div>
              <div className="p-2 space-y-1.5">
                <input
                  type="text"
                  value={slide.alt || ''}
                  onChange={(e) => updateAlt(idx, e.target.value)}
                  placeholder="Alt text..."
                  className="w-full text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-medium">#{idx + 1}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                      title="Move up"
                    >
                      <HiOutlineChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => move(idx, 1)}
                      disabled={idx === items.length - 1}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"
                      title="Move down"
                    >
                      <HiOutlineChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => remove(idx)}
                      className="p-1 rounded hover:bg-red-100 text-red-500"
                      title="Remove"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Inline Section Editor ─────────────────────────────────────────────────────

function SectionEditor({
  section,
  onSave,
}: {
  section: CmsItem;
  onSave: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(section.title || '');
  const [content, setContent] = useState(section.content || '');
  const [metadata, setMetadata] = useState<any>(section.metadata || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(section.title || '');
    setContent(section.content || '');
    setMetadata(section.metadata || {});
  }, [section]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/cms/page/${section.pageKey}/${section.sectionKey}`, {
        title,
        content,
        metadata,
      });
      toast.success('Section saved');
      onSave();
    } catch {
      toast.error('Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTitle(section.title || '');
    setContent(section.content || '');
    setMetadata(section.metadata || {});
    setExpanded(false);
  };

  return (
    <div className="border rounded-xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="text-left">
          <p className="font-medium text-sm text-brand-dark">{section.title || section.sectionKey}</p>
          <p className="text-xs text-gray-400 mt-0.5">{section.sectionKey}</p>
        </div>
        <HiOutlinePencil className="w-4 h-4 text-gray-400" />
      </button>

      {expanded && (
        <div className="border-t px-5 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Content</label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Edit this section using headings, lists, emphasis, and links."
            />
          </div>
          <div className="rounded-xl border border-brand-secondary/50 bg-brand-bg/30 p-4">
            <p className="mb-2 text-xs font-semibold text-brand-dark uppercase tracking-wide">Preview</p>
            <div
              className="cms-content text-sm text-brand-dark-light"
              dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400">Nothing to preview yet.</p>' }}
            />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-sm !py-2 !px-5 flex items-center gap-1.5"
            >
              <HiOutlineCheck className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="btn-outline text-sm !py-2 !px-5 flex items-center gap-1.5"
            >
              <HiOutlineX className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Section Form ──────────────────────────────────────────────────────────

function AddSectionForm({
  pageKey,
  onCreated,
}: {
  pageKey: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [sectionKey, setSectionKey] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const key = sectionKey.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!key) {
      toast.error('Section key is required');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/cms/page/${pageKey}/${key}`, { title, content, metadata: null });
      toast.success('Section created');
      setSectionKey('');
      setTitle('');
      setContent('');
      setOpen(false);
      onCreated();
    } catch {
      toast.error('Failed to create section');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border-2 border-dashed rounded-xl py-3 text-sm text-gray-400 hover:text-brand-primary hover:border-brand-primary transition-colors flex items-center justify-center gap-1.5"
      >
        <HiOutlinePlus className="w-4 h-4" />
        Add Section
      </button>
    );
  }

  return (
    <div className="border rounded-xl bg-white p-5 space-y-4">
      <h4 className="font-semibold text-sm text-brand-dark">New Section</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">Section Key</label>
          <input
            type="text"
            value={sectionKey}
            onChange={(e) => setSectionKey(e.target.value)}
            placeholder="e.g. intro_text"
            className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm"
          />
          <p className="text-[11px] text-gray-400 mt-1">Lowercase, underscores, no spaces</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Section title"
            className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-brand-dark mb-1">Content</label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Section content..."
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleCreate}
          disabled={saving}
          className="btn-primary text-sm !py-2 !px-5 flex items-center gap-1.5"
        >
          <HiOutlineCheck className="w-4 h-4" />
          {saving ? 'Creating...' : 'Create Section'}
        </button>
        <button
          onClick={() => { setOpen(false); setSectionKey(''); setTitle(''); setContent(''); }}
          className="btn-outline text-sm !py-2 !px-5 flex items-center gap-1.5"
        >
          <HiOutlineX className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminCmsPage() {
  const [pages, setPages] = useState<Record<string, CmsItem[]>>({});
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageSeo, setPageSeo] = useState<Record<string, SeoMeta>>({});
  const [savingSeo, setSavingSeo] = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    api
      .get('/cms/admin/all')
      .then((data) => {
        setPages(data);
        const seoMap: Record<string, SeoMeta> = {};
        for (const pk of PAGE_KEYS) {
          const sections = data[pk] || [];
          const seoSection = sections.find((s: CmsItem) => s.sectionKey === '_page_seo');
          const meta = seoSection?.metadata || {};
          seoMap[pk] = {
            metaTitle: meta.metaTitle || '',
            metaDescription: meta.metaDescription || '',
            focusKeyword: meta.focusKeyword || '',
            ogTitle: meta.ogTitle || '',
            ogDescription: meta.ogDescription || '',
          };
        }
        setPageSeo(seoMap);
      })
      .catch(() => toast.error('Failed to load CMS content'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Compute scores for all pages
  const pageScores = useMemo(() => {
    const scores: Record<string, number> = {};
    for (const pk of PAGE_KEYS) {
      const sections = pages[pk] || [];
      const content = sections
        .filter((s) => s.sectionKey !== 'hero_slides' && s.sectionKey !== '_page_seo')
        .map((s) => `<h2>${s.title || ''}</h2>${s.content || ''}`)
        .join('\n');
      const meta = pageSeo[pk] || { metaTitle: '', metaDescription: '', focusKeyword: '', ogTitle: '', ogDescription: '' };
      const checks = computeSeoChecks(meta, content, pk);
      scores[pk] = computeSeoScore(checks);
    }
    return scores;
  }, [pages, pageSeo]);

  // ── Page List View ──
  if (!editingPage) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">Pages</h1>
            <p className="text-sm text-gray-400 mt-0.5">{PAGE_KEYS.length} pages</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_140px_80px_100px_80px] gap-4 px-5 py-3 bg-gray-50 border-b text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <span>Page</span>
              <span>URL</span>
              <span className="text-center">Sections</span>
              <span className="text-center">SEO Score</span>
              <span className="text-right">Action</span>
            </div>

            {/* Page rows */}
            {PAGE_KEYS.map((key, idx) => {
              const sections = (pages[key] || []).filter((s) => s.sectionKey !== '_page_seo' && s.sectionKey !== 'hero_slides');
              const sectionCount = sections.length + (key === 'homepage' && pages['homepage']?.find((s) => s.sectionKey === 'hero_slides') ? 1 : 0);
              const score = pageScores[key] || 0;
              const seo = pageSeo[key];
              const hasTitle = seo?.metaTitle?.length > 0;
              const hasDesc = seo?.metaDescription?.length > 0;

              return (
                <div
                  key={key}
                  className={`grid grid-cols-[1fr_140px_80px_100px_80px] gap-4 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors cursor-pointer group ${idx !== PAGE_KEYS.length - 1 ? 'border-b' : ''}`}
                  onClick={() => setEditingPage(key)}
                >
                  {/* Page info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-brand-bg flex items-center justify-center flex-shrink-0">
                      <HiOutlineDocumentText className="w-4.5 h-4.5 text-brand-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-dark truncate group-hover:text-brand-primary transition-colors">
                        {PAGE_LABELS[key]}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {hasTitle && <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">Title</span>}
                        {hasDesc && <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">Desc</span>}
                        {seo?.focusKeyword && <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">Keyword</span>}
                      </div>
                    </div>
                  </div>

                  {/* URL */}
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-400 truncate">{PAGE_URLS[key]?.replace('https://hiddenglow.pk', '') || '/'}</p>
                  </div>

                  {/* Sections */}
                  <div className="text-center">
                    <span className="text-sm font-medium text-brand-dark">{sectionCount}</span>
                  </div>

                  {/* SEO Score */}
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getScoreBg(score)}`} style={{ width: `${score}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${getScoreColor(score)}`}>{score}</span>
                    </div>
                  </div>

                  {/* Edit */}
                  <div className="text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingPage(key); }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:text-brand-dark transition-colors"
                    >
                      Edit
                      <HiOutlineChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Page Editor View ──
  const activePageKey = editingPage || 'homepage';
  const activeSections = (pages[activePageKey] || []).filter(
    (s) => !(activePageKey === 'homepage' && s.sectionKey === 'hero_slides') && s.sectionKey !== '_page_seo'
  );

  const heroSection = activePageKey === 'homepage'
    ? pages['homepage']?.find((s) => s.sectionKey === 'hero_slides')
    : null;

  const heroSlides: HeroSlide[] = (() => {
    if (!heroSection) return [];
    try {
      const parsed = typeof heroSection.content === 'string'
        ? JSON.parse(heroSection.content)
        : heroSection.content;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();

  const handleSaveHeroSlides = async (slides: HeroSlide[]) => {
    try {
      await api.put('/cms/page/homepage/hero_slides', {
        title: heroSection?.title || 'Hero Slides',
        content: JSON.stringify(slides),
        metadata: heroSection?.metadata || null,
      });
      toast.success('Hero slides saved');
      fetchAll();
    } catch { toast.error('Failed to save hero slides'); }
  };

  const allPageContent = (pages[activePageKey] || [])
    .filter((s) => s.sectionKey !== 'hero_slides' && s.sectionKey !== '_page_seo')
    .map((s) => `<h2>${s.title || ''}</h2>${s.content || ''}`)
    .join('\n');

  const currentSeo = pageSeo[activePageKey] || { metaTitle: '', metaDescription: '', focusKeyword: '', ogTitle: '', ogDescription: '' };
  const seoChecks = computeSeoChecks(currentSeo, allPageContent, activePageKey);
  const seoScore = computeSeoScore(seoChecks);

  const handleSeoChange = (seo: SeoMeta) => {
    setPageSeo((prev) => ({ ...prev, [activePageKey]: seo }));
  };

  const handleSaveSeo = async () => {
    setSavingSeo(true);
    try {
      await api.put(`/cms/page/${activePageKey}/_page_seo`, {
        title: 'Page SEO',
        content: '',
        metadata: currentSeo,
      });
      toast.success('SEO settings saved');
      fetchAll();
    } catch { toast.error('Failed to save SEO settings'); }
    finally { setSavingSeo(false); }
  };

  const currentIdx = PAGE_KEYS.indexOf(activePageKey as any);
  const prevPage = currentIdx > 0 ? PAGE_KEYS[currentIdx - 1] : null;
  const nextPage = currentIdx < PAGE_KEYS.length - 1 ? PAGE_KEYS[currentIdx + 1] : null;

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditingPage(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-dark transition-colors"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            All Pages
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg font-bold text-brand-dark">{PAGE_LABELS[activePageKey]}</h1>
          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white ${getScoreBg(seoScore)}`}>
            {seoScore}/100
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={PAGE_URLS[activePageKey]}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline text-xs !py-1.5 !px-3 flex items-center gap-1.5"
          >
            <HiOutlineExternalLink className="w-3.5 h-3.5" />
            View Page
          </a>
          {prevPage && (
            <button onClick={() => setEditingPage(prevPage)} className="btn-outline text-xs !py-1.5 !px-3">
              ← {PAGE_LABELS[prevPage]}
            </button>
          )}
          {nextPage && (
            <button onClick={() => setEditingPage(nextPage)} className="btn-outline text-xs !py-1.5 !px-3">
              {PAGE_LABELS[nextPage]} →
            </button>
          )}
        </div>
      </div>

      {/* Editor + SEO Sidebar */}
      <div className="flex gap-5">
        {/* Content Editor */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Hero Slides (Homepage only) */}
          {activePageKey === 'homepage' && (
            <HeroSlidesManager slides={heroSlides} onSave={handleSaveHeroSlides} />
          )}

          {/* Sections */}
          {activeSections.length === 0 && !heroSection && (
            <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border">
              No sections yet. Click &quot;Add Section&quot; below to create content.
            </div>
          )}

          {activeSections.map((section) => (
            <SectionEditor key={section.id} section={section} onSave={fetchAll} />
          ))}

          {/* Add Section */}
          <AddSectionForm pageKey={activePageKey} onCreated={fetchAll} />
        </div>

        {/* SEO Sidebar */}
        <SeoSidebar
          seo={currentSeo}
          onChange={handleSeoChange}
          onSave={handleSaveSeo}
          checks={seoChecks}
          score={seoScore}
          pageKey={activePageKey}
          saving={savingSeo}
        />
      </div>
    </div>
  );
}
