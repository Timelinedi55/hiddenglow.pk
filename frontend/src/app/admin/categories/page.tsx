'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Category } from '@/lib/types';
import { getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminCategories() {
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
      if (editing.id) {
        await api.put(`/categories/${editing.id}`, editing);
        toast.success('Category updated');
      } else {
        await api.post('/categories', editing);
        toast.success('Category created');
      }
      setEditing(null);
      fetchCategories();
    } catch (err: any) { toast.error(err.message || 'Failed to save'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    try { await api.delete(`/categories/${id}`); toast.success('Deleted'); fetchCategories(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.upload(file, 'categories');
      setEditing((prev) => prev ? { ...prev, image: result.url } : null);
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">Categories</h1>
        <button onClick={() => setEditing({ name: '', description: '', image: '', isActive: true, sortOrder: 0, seoTitle: '', seoDescription: '' })} className="btn-primary">
          + Add Category
        </button>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing.id ? 'Edit Category' : 'Add Category'}</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input type="text" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={3} className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image</label>
              {editing.image && <img src={getImageUrl(editing.image)} alt="" className="w-24 h-24 object-cover rounded mb-2" />}
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <input type="number" value={editing.sortOrder || 0} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editing.isActive ?? true} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm">Active</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SEO Title</label>
              <input type="text" value={editing.seoTitle || ''} onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SEO Description</label>
              <textarea value={editing.seoDescription || ''} onChange={(e) => setEditing({ ...editing, seoDescription: e.target.value })}
                rows={3} className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div className="flex gap-3 pt-4">
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
              <th className="text-left px-4 py-3 font-medium">Slug</th>
              <th className="text-left px-4 py-3 font-medium">Order</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-10 w-full" /></td></tr>)
            ) : categories.map((cat) => (
              <tr key={cat.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                    {cat.image && <img src={getImageUrl(cat.image)} alt="" className="w-full h-full object-cover" />}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <td className="px-4 py-3 text-gray-500">{cat.slug}</td>
                <td className="px-4 py-3">{cat.sortOrder}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(cat)} className="text-blue-600 hover:underline text-sm">Edit</button>
                    <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:underline text-sm">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
