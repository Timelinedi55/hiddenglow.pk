'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Category } from '@/lib/types';
import { getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';
import { HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi';
import RichTextEditor from '@/components/RichTextEditor';

interface ProductForm {
  name: string; shortDescription: string; description: string;
  price: string; discountPrice: string; categoryId: string;
  isActive: boolean; isFeatured: boolean; isBestSeller: boolean;
  seoTitle: string; seoDescription: string; videoUrl: string;
  images: Array<{ url: string }>; variants: Array<{ size: string; color: string; colorCode: string; stock: string; sku: string; variantPrice: string; weight: string; image: string }>;
}

const defaultForm: ProductForm = {
  name: '', shortDescription: '', description: '',
  price: '', discountPrice: '', categoryId: '',
  isActive: true, isFeatured: false, isBestSeller: false,
  seoTitle: '', seoDescription: '', videoUrl: '',
  images: [], variants: [{ size: 'S', color: '', colorCode: '', stock: '10', sku: '', variantPrice: '', weight: '', image: '' }],
};

export default function AdminProductEdit() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/categories/admin/list').then(setCategories).catch(() => {});
    if (!isNew) {
      api.get(`/products/${params.id}`).then((product) => {
        setForm({
          name: product.name || '', shortDescription: product.shortDescription || '', description: product.description || '',
          price: String(product.price || ''), discountPrice: String(product.discountPrice || ''),
          categoryId: String(product.categoryId || ''),
          isActive: product.isActive ?? true, isFeatured: product.isFeatured ?? false, isBestSeller: product.isBestSeller ?? false,
          seoTitle: product.seoTitle || '', seoDescription: product.seoDescription || '', videoUrl: product.videoUrl || '',
          images: product.images?.map((i: any) => ({ url: i.url })) || [],
          variants: product.variants?.map((v: any) => ({ size: v.size, color: v.color || '', colorCode: v.colorCode || '', stock: String(v.stock), sku: v.sku || '', variantPrice: v.variantPrice ? String(v.variantPrice) : '', weight: v.weight || '', image: v.image || '' })) || [],
        });
        setLoading(false);
      }).catch(() => { setLoading(false); toast.error('Product not found'); });
    }
  }, [params.id, isNew]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const result = await api.upload(file, 'products');
        setForm((prev) => ({ ...prev, images: [...prev.images, { url: result.url }] }));
      }
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const removeImage = (idx: number) => setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));

  const addVariant = () => setForm((prev) => ({ ...prev, variants: [...prev.variants, { size: '', color: '', colorCode: '', stock: '0', sku: '', variantPrice: '', weight: '', image: '' }] }));

  const handleVariantImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await api.upload(file, 'products');
      updateVariant(idx, 'image', result.url);
    } catch { toast.error('Upload failed'); }
  };
  const removeVariant = (idx: number) => setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }));
  const updateVariant = (idx: number, field: string, value: string) => {
    setForm((prev) => ({ ...prev, variants: prev.variants.map((v, i) => i === idx ? { ...v, [field]: value } : v) }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) { toast.error('Name and price are required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        videoUrl: form.videoUrl || null,
        variants: form.variants.filter((v) => v.size).map((v) => ({ ...v, stock: parseInt(v.stock) || 0, variantPrice: v.variantPrice ? parseFloat(v.variantPrice) : null, weight: v.weight || null, colorCode: v.colorCode || null, image: v.image || null })),
      };
      if (isNew) {
        await api.post('/products', payload);
        toast.success('Product created');
      } else {
        await api.put(`/products/${params.id}`, payload);
        toast.success('Product updated');
      }
      router.push('/admin/products');
    } catch (err: any) { toast.error(err.message || 'Failed to save'); }
    setSaving(false);
  };

  if (loading) return <div className="skeleton h-96 rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">{isNew ? 'Add Product' : 'Edit Product'}</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Product'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Product Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Short Description</label>
              <textarea value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                rows={2} className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Full Description (HTML)</label>
              <RichTextEditor value={form.description} onChange={(value) => setForm({ ...form, description: value })} placeholder="Write product details, sizing notes, fabric information, and care instructions..." />
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Images</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {form.images.map((img, i) => (
                <div key={i} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                  <img src={getImageUrl(img.url)} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <HiOutlineTrash size={14} />
                  </button>
                  {i === 0 && <span className="absolute bottom-1 left-1 bg-brand-dark text-white text-xs px-2 py-0.5 rounded">Primary</span>}
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                <HiOutlinePlus size={24} className="text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">{uploading ? 'Uploading...' : 'Add Image'}</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Product Video */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold">Product Video</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Video URL</label>
              <input type="url" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="YouTube, Vimeo, or direct video link (mp4)"
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              <p className="text-xs text-gray-400 mt-1">Supports YouTube, Vimeo, TikTok, or direct .mp4 video links</p>
            </div>
            {form.videoUrl && (
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {form.videoUrl.match(/youtube\.com|youtu\.be/) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${form.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/)?.[1] || ''}`}
                    className="w-full h-full" allowFullScreen title="Video preview" />
                ) : form.videoUrl.match(/vimeo\.com/) ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${form.videoUrl.match(/vimeo\.com\/(\d+)/)?.[1] || ''}`}
                    className="w-full h-full" allowFullScreen title="Video preview" />
                ) : (
                  <video src={form.videoUrl} controls className="w-full h-full object-contain" />
                )}
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Variants (Size, Price & Stock)</h2>
              <button onClick={addVariant} className="text-sm text-brand-primary hover:underline flex items-center gap-1">
                <HiOutlinePlus size={16} /> Add Variant
              </button>
            </div>
            <div className="space-y-4">
              {form.variants.map((v, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Variant {i + 1}</span>
                    {form.variants.length > 1 && (
                      <button onClick={() => removeVariant(i)} className="text-red-500 hover:text-red-600 p-1"><HiOutlineTrash size={16} /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Size *</label>
                      <input type="text" value={v.size} onChange={(e) => updateVariant(i, 'size', e.target.value)} placeholder="S, M, L..."
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Color</label>
                      <input type="text" value={v.color} onChange={(e) => updateVariant(i, 'color', e.target.value)} placeholder="Optional"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Variant Price (PKR)</label>
                      <input type="number" value={v.variantPrice} onChange={(e) => updateVariant(i, 'variantPrice', e.target.value)} placeholder="Override price"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Stock</label>
                      <input type="number" value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">SKU</label>
                      <input type="text" value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} placeholder="Optional"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Weight</label>
                      <input type="text" value={v.weight} onChange={(e) => updateVariant(i, 'weight', e.target.value)} placeholder="e.g. 150g"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Color Code</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={v.colorCode || '#000000'} onChange={(e) => updateVariant(i, 'colorCode', e.target.value)}
                          className="w-9 h-9 rounded border cursor-pointer" />
                        <input type="text" value={v.colorCode} onChange={(e) => updateVariant(i, 'colorCode', e.target.value)} placeholder="#000000"
                          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                      </div>
                    </div>
                  </div>
                  {/* Variant Image */}
                  <div className="mt-3 flex items-center gap-3">
                    {v.image ? (
                      <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden group">
                        <img src={getImageUrl(v.image)} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => updateVariant(i, 'image', '')}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <HiOutlineTrash size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="w-16 h-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                        <HiOutlinePlus size={16} className="text-gray-400" />
                        <span className="text-[9px] text-gray-400">Image</span>
                        <input type="file" accept="image/*" onChange={(e) => handleVariantImageUpload(i, e)} className="hidden" />
                      </label>
                    )}
                    <span className="text-[11px] text-gray-400">Variant-specific image (shown when swatch is selected)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold">Pricing</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Price (PKR) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount Price (PKR)</label>
              <input type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold">Organization</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option value="">None</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isBestSeller} onChange={(e) => setForm({ ...form, isBestSeller: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">Best Seller</span>
            </label>
          </div>

          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold">SEO</h2>
            <div>
              <label className="block text-sm font-medium mb-1">SEO Title</label>
              <input type="text" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SEO Description</label>
              <textarea value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                rows={3} className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
