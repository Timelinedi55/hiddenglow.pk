'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Expense } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlinePlusCircle } from 'react-icons/hi';

const EXPENSE_CATEGORIES = [
  'Inventory', 'Shipping', 'Marketing', 'Packaging', 'Software', 'Salary',
  'Rent', 'Utilities', 'Returns', 'Taxes', 'Other',
];

interface ExpenseStats {
  totalExpenses: number;
  byCategory: { category: string; total: string; count: string }[];
  monthlyExpenses: { month: string; total: string }[];
}

export default function AdminFinance() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', amount: '', category: 'Other', description: '', date: new Date().toISOString().slice(0, 10) });
  const [tab, setTab] = useState<'list' | 'overview'>('list');

  const fetchExpenses = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    api.get(`/orders/admin/expenses?${params}`).then((data) => {
      setExpenses(data.items); setTotal(data.total); setTotalPages(data.totalPages); setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, category, search, dateFrom, dateTo]);

  const fetchStats = useCallback(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    api.get(`/orders/admin/expenses/stats?${params}`).then(setStats).catch(() => {});
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleSave = async () => {
    if (!form.title || !form.amount) { toast.error('Title and amount required'); return; }
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editingId) {
        await api.put(`/orders/admin/expenses/${editingId}`, payload);
        toast.success('Updated');
      } else {
        await api.post('/orders/admin/expenses', payload);
        toast.success('Expense added');
      }
      setShowForm(false); setEditingId(null);
      setForm({ title: '', amount: '', category: 'Other', description: '', date: new Date().toISOString().slice(0, 10) });
      fetchExpenses(); fetchStats();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this expense?')) return;
    try { await api.delete(`/orders/admin/expenses/${id}`); toast.success('Deleted'); fetchExpenses(); fetchStats(); }
    catch { toast.error('Failed'); }
  };

  const handleEdit = (e: Expense) => {
    setEditingId(e.id);
    setForm({ title: e.title, amount: String(e.amount), category: e.category, description: e.description || '', date: e.date });
    setShowForm(true);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  const maxCatAmount = stats?.byCategory?.length ? Math.max(...stats.byCategory.map((c) => parseFloat(c.total))) : 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">Expenses & Finance</h1>
        <button onClick={() => { setEditingId(null); setForm({ title: '', amount: '', category: 'Other', description: '', date: new Date().toISOString().slice(0, 10) }); setShowForm(true); }}
          className="btn-primary text-sm flex items-center gap-1.5"><HiOutlinePlusCircle size={16} /> Add Expense</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl border p-1.5 w-fit">
        <button onClick={() => setTab('list')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'list' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Expense Log</button>
        <button onClick={() => setTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'overview' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Overview</button>
      </div>

      {tab === 'overview' && stats ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-1">Total Expenses</h2>
            <p className="text-3xl font-bold text-red-600">{formatPrice(stats.totalExpenses)}</p>
          </div>

          {/* By Category */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-4">By Category</h2>
            <div className="space-y-3">
              {stats.byCategory.map((cat) => (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="text-sm w-24 text-gray-600 capitalize">{cat.category || 'Other'}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div className="bg-brand-primary h-full rounded-full transition-all"
                      style={{ width: `${(parseFloat(cat.total) / maxCatAmount * 100)}%` }} />
                  </div>
                  <span className="text-sm font-medium w-28 text-right">{formatPrice(parseFloat(cat.total))}</span>
                  <span className="text-xs text-gray-400 w-12 text-right">{cat.count}x</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly */}
          {stats.monthlyExpenses.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold mb-4">Monthly Expenses</h2>
              <div className="space-y-2">
                {stats.monthlyExpenses.map((m) => (
                  <div key={m.month} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="text-sm text-gray-600">{m.month}</span>
                    <span className="text-sm font-semibold">{formatPrice(parseFloat(m.total))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : tab === 'list' ? (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchExpenses(); }} className="relative flex-1 min-w-[180px]">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expenses..."
                className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </form>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" />
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" />
          </div>

          {/* Total */}
          {stats && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 mb-4 flex items-center justify-between">
              <span className="text-sm text-red-700 font-medium">Total Expenses</span>
              <span className="text-lg font-bold text-red-700">{formatPrice(stats.totalExpenses)}</span>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Title</th>
                    <th className="text-left px-4 py-3 font-medium">Amount</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Description</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-left px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-10 w-full" /></td></tr>) :
                  expenses.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No expenses found</td></tr> :
                  expenses.map((e) => (
                    <tr key={e.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{e.title}</td>
                      <td className="px-4 py-3 font-semibold text-red-600">{formatPrice(e.amount)}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-xs font-medium">{e.category}</span></td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate hidden md:table-cell">{e.description || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(e.date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(e)} className="text-blue-600 hover:underline text-xs">Edit</button>
                          <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-2 rounded-lg text-sm bg-white border disabled:opacity-40">←</button>
              <span className="px-3 py-2 text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-2 rounded-lg text-sm bg-white border disabled:opacity-40">→</button>
            </div>
          )}
        </>
      ) : null}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); setEditingId(null); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editingId ? 'Edit Expense' : 'Add Expense'}</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="e.g. Facebook Ads" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount (PKR) *</label>
                <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} className="btn-primary flex-1">{editingId ? 'Update' : 'Add Expense'}</button>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
