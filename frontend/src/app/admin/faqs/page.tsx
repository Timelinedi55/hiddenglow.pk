'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Faq } from '@/lib/types';
import toast from 'react-hot-toast';

export default function AdminFaqs() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [editing, setEditing] = useState<Partial<Faq> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFaqs = () => {
    api.get('/faqs/admin/list').then((data) => { setFaqs(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchFaqs(); }, []);

  const handleSave = async () => {
    if (!editing?.question?.trim() || !editing?.answer?.trim()) { toast.error('Question and answer are required'); return; }
    try {
      if (editing.id) {
        await api.put(`/faqs/${editing.id}`, editing);
        toast.success('FAQ updated');
      } else {
        await api.post('/faqs', editing);
        toast.success('FAQ created');
      }
      setEditing(null);
      fetchFaqs();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this FAQ?')) return;
    try { await api.delete(`/faqs/${id}`); toast.success('Deleted'); fetchFaqs(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">FAQs</h1>
        <button onClick={() => setEditing({ question: '', answer: '', category: 'general', sortOrder: 0, isActive: true })} className="btn-primary">
          + Add FAQ
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing.id ? 'Edit FAQ' : 'Add FAQ'}</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Question *</label>
              <input type="text" value={editing.question || ''} onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Answer *</label>
              <textarea value={editing.answer || ''} onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
                rows={4} className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input type="text" value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <input type="number" value={editing.sortOrder || 0} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={editing.isActive ?? true} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">Active</span>
            </label>
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
              <th className="text-left px-4 py-3 font-medium">Question</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Order</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="skeleton h-8 w-full" /></td></tr>)
            ) : faqs.map((faq) => (
              <tr key={faq.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 max-w-xs truncate">{faq.question}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{faq.category}</td>
                <td className="px-4 py-3">{faq.sortOrder}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${faq.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {faq.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(faq)} className="text-blue-600 hover:underline text-sm">Edit</button>
                    <button onClick={() => handleDelete(faq.id)} className="text-red-500 hover:underline text-sm">Delete</button>
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
