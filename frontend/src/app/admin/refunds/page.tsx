'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Refund } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { HiOutlineSearch } from 'react-icons/hi';

interface RefundStats {
  total: number;
  pending: number;
  approved: number;
  totalRefunded: number;
}

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [stats, setStats] = useState<RefundStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Refund | null>(null);
  const [form, setForm] = useState({ orderId: '', amount: '', reason: '', method: '' });

  const fetchRefunds = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);
    api.get(`/orders/admin/refunds?${params}`).then((data) => {
      setRefunds(data.items); setTotal(data.total); setTotalPages(data.totalPages); setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, statusFilter, search]);

  const fetchStats = useCallback(() => {
    api.get('/orders/admin/refunds/stats').then(setStats).catch(() => {});
  }, []);

  useEffect(() => { fetchRefunds(); }, [fetchRefunds]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleCreate = async () => {
    if (!form.orderId || !form.amount) { toast.error('Order ID and amount required'); return; }
    try {
      await api.post('/orders/admin/refunds', {
        orderId: parseInt(form.orderId),
        amount: parseFloat(form.amount),
        reason: form.reason,
        method: form.method,
      });
      toast.success('Refund created');
      setShowCreate(false);
      setForm({ orderId: '', amount: '', reason: '', method: '' });
      fetchRefunds(); fetchStats();
    } catch { toast.error('Failed to create refund'); }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/orders/admin/refunds/${id}`, { status });
      toast.success(`Refund ${status}`);
      fetchRefunds(); fetchStats();
    } catch { toast.error('Failed'); }
  };

  const handleUpdateNote = async (id: number, adminNote: string) => {
    try {
      await api.put(`/orders/admin/refunds/${id}`, { adminNote });
      toast.success('Note saved');
      setEditing(null);
      fetchRefunds();
    } catch { toast.error('Failed'); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">Refunds</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">+ New Refund</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-2xl font-bold text-brand-dark">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Refunds</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-xs text-gray-500">Approved</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-2xl font-bold text-red-600">{formatPrice(stats.totalRefunded)}</p>
            <p className="text-xs text-gray-500">Total Refunded</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchRefunds(); }} className="relative flex-1 min-w-[180px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order number..."
            className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </form>
        <div className="flex gap-1">
          {['all', 'pending', 'approved', 'rejected', 'completed'].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize ${statusFilter === s ? 'bg-brand-primary text-white' : 'bg-white border text-gray-600'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Order</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Reason</th>
                <th className="text-left px-4 py-3 font-medium">Method</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-10 w-full" /></td></tr>) :
              refunds.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No refunds found</td></tr> :
              refunds.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.order?.orderNumber || `#${r.orderId}`}</td>
                  <td className="px-4 py-3 font-semibold text-red-600">{formatPrice(r.amount)}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{r.reason || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{r.method || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[r.status] || 'bg-gray-100 text-gray-600'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => handleUpdateStatus(r.id, 'approved')} className="text-green-600 hover:underline text-xs">Approve</button>
                          <button onClick={() => handleUpdateStatus(r.id, 'rejected')} className="text-red-500 hover:underline text-xs">Reject</button>
                        </>
                      )}
                      {r.status === 'approved' && (
                        <button onClick={() => handleUpdateStatus(r.id, 'completed')} className="text-blue-600 hover:underline text-xs">Complete</button>
                      )}
                      <button onClick={() => setEditing(r)} className="text-gray-500 hover:underline text-xs">Note</button>
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

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">New Refund</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Order ID *</label>
              <input type="number" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Enter order ID" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount (PKR) *</label>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Method</label>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option value="">Select method</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="easypaisa">Easypaisa</option>
                <option value="jazzcash">JazzCash</option>
                <option value="store_credit">Store Credit</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCreate} className="btn-primary flex-1">Create Refund</button>
              <button onClick={() => setShowCreate(false)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Admin Note</h2>
            <textarea defaultValue={editing.adminNote || ''} id="refund-note" rows={3}
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            <div className="flex gap-3">
              <button onClick={() => handleUpdateNote(editing.id, (document.getElementById('refund-note') as HTMLTextAreaElement).value)} className="btn-primary flex-1">Save</button>
              <button onClick={() => setEditing(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
