'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Product, Category } from '@/lib/types';
import { formatPrice, getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';
import { HiOutlineCube, HiOutlineTag } from 'react-icons/hi';

// ─── Categories Tab ─────────────────────────────────────────────────────────

function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchCategories = () => {
    setLoading(true);
    api.get('/categories/admin/list').then((data) => { setCategories(data); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchCategories(); }, []);

  const handleSave = async () => {
    if (!editing?.name?.trim()) { toast.error('Name is required'); return; }
    try {
      if (editing.id) { await api.put(`/categories/${editing.id}`, editing); toast.success('Updated'); }
      else { await api.post('/categories', editing); toast.success('Created'); }
      setEditing(null); fetchCategories();
    } catch (err: any) { toast.error(err.message || 'Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    try { await api.delete(`/categories/${id}`); toast.success('Deleted'); fetchCategories(); } catch { toast.error('Failed'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const r = await api.upload(file, 'categories'); setEditing((p) => p ? { ...p, image: r.url } : null); } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setEditing({ name: '', description: '', image: '', isActive: true, sortOrder: 0, seoTitle: '', seoDescription: '' })} className="btn-primary text-sm">+ Add Category</button>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing.id ? 'Edit Category' : 'Add Category'}</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input type="text" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image</label>
              {editing.image && <img src={getImageUrl(editing.image)} alt="" className="w-24 h-24 object-cover rounded mb-2" />}
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <input type="number" value={editing.sortOrder || 0} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) })} className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editing.isActive ?? true} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm">Active</span>
                </label>
              </div>
            </div>
            <div><label className="block text-sm font-medium mb-1">SEO Title</label><input type="text" value={editing.seoTitle || ''} onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })} className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" /></div>
            <div><label className="block text-sm font-medium mb-1">SEO Description</label><textarea value={editing.seoDescription || ''} onChange={(e) => setEditing({ ...editing, seoDescription: e.target.value })} rows={2} className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" /></div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} className="btn-primary flex-1">Save</button>
              <button onClick={() => setEditing(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Image</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Slug</th>
              <th className="text-left px-4 py-3 font-medium">Order</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-10 w-full" /></td></tr>) :
            categories.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No categories</td></tr> :
            categories.map((cat) => (
              <tr key={cat.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3"><div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">{cat.image && <img src={getImageUrl(cat.image)} alt="" className="w-full h-full object-cover" />}</div></td>
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{cat.slug}</td>
                <td className="px-4 py-3">{cat.sortOrder}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{cat.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => setEditing(cat)} className="text-blue-600 hover:underline text-sm">Edit</button><button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:underline text-sm">Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Products Tab ───────────────────────────────────────────────────────────

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (search) params.set('search', search);
    api.get(`/products/admin/list?${params.toString()}`).then((data) => {
      setProducts(data.items); setTotal(data.total); setTotalPages(data.totalPages); setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [page]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Deleted'); fetchProducts(); } catch { toast.error('Failed'); }
  };

  return (
    <>
      <div className="flex gap-4 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchProducts(); }} className="flex gap-2 flex-1">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
            className="border rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm" />
          <button type="submit" className="btn-primary px-6 text-sm">Search</button>
        </form>
        <Link href="/admin/products/new" className="btn-primary text-sm">+ Add Product</Link>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">Price</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Stock</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-12 w-full" /></td></tr>) :
              products.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No products found</td></tr> :
              products.map((product) => {
                const img = product.images?.find((i) => i.isPrimary) || product.images?.[0];
                const totalStock = product.variants?.reduce((s, v) => s + v.stock, 0) || 0;
                return (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {img && <img src={getImageUrl(img.url)} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="font-medium text-sm">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {product.discountPrice ? (
                        <div><span className="font-medium">{formatPrice(product.discountPrice)}</span><span className="text-gray-400 line-through text-xs ml-1">{formatPrice(product.price)}</span></div>
                      ) : formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{product.category?.name || '-'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${totalStock === 0 ? 'bg-red-100 text-red-700' : totalStock <= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/admin/products/${product.id}`} className="text-blue-600 hover:underline text-sm">Edit</Link>
                        <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:underline text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {[...Array(Math.min(totalPages, 10))].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-brand-primary text-white' : 'bg-white border hover:bg-gray-50'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AdminProducts() {
  const [tab, setTab] = useState<'products' | 'categories'>('products');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">Catalog</h1>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-xl border p-1.5">
        <button onClick={() => setTab('products')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === 'products' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-brand-dark hover:bg-gray-100'}`}>
          <HiOutlineCube size={16} /> Products
        </button>
        <button onClick={() => setTab('categories')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === 'categories' ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-brand-dark hover:bg-gray-100'}`}>
          <HiOutlineTag size={16} /> Categories
        </button>
      </div>

      {tab === 'products' ? <ProductsTab /> : <CategoriesTab />}
    </div>
  );
}
