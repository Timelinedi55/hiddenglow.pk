'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import {
  HiOutlineSearch, HiOutlineLink, HiOutlineUserAdd, HiOutlineCash,
  HiOutlineCursorClick, HiOutlineClipboard, HiOutlineCheck,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

interface ReferralPartner {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  code: string;
  commissionRate: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  totalClicks: number;
  totalOrders: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

interface ReferralConversion {
  id: number;
  referralId: number;
  orderId: number;
  order?: { orderNumber: string; customerName: string; total: number };
  referral?: { name: string; code: string };
  orderAmount: number;
  commissionAmount: number;
  status: string;
  note: string | null;
  createdAt: string;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalClicks: number;
  totalOrders: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  topPerformers: ReferralPartner[];
  recentConversions: ReferralConversion[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminReferrals() {
  const [activeTab, setActiveTab] = useState<'partners' | 'conversions' | 'stats'>('partners');
  const [partners, setPartners] = useState<ReferralPartner[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<ReferralPartner | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchPartners = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    api.get(`/referrals/admin/list?${params}`).then((data) => {
      setPartners(data.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [search]);

  const fetchStats = useCallback(() => {
    api.get('/referrals/admin/stats').then(setStats).catch(() => {});
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`https://hiddenglow.pk/?ref=${code}`);
    setCopiedCode(code);
    toast.success('Referral link copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleActive = async (partner: ReferralPartner) => {
    try {
      await api.put(`/referrals/admin/${partner.id}`, { isActive: !partner.isActive });
      toast.success(partner.isActive ? 'Deactivated' : 'Activated');
      fetchPartners();
      fetchStats();
    } catch { toast.error('Failed'); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">Referral & Commission</h1>
        <button onClick={() => setShowCreateModal(true)}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-primary/90 flex items-center gap-1.5">
          <HiOutlineUserAdd size={16} /> Add Partner
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label: 'Partners', value: stats.activeReferrals, icon: HiOutlineUserAdd, color: 'text-blue-600' },
            { label: 'Total Clicks', value: stats.totalClicks.toLocaleString(), icon: HiOutlineCursorClick, color: 'text-cyan-600' },
            { label: 'Total Orders', value: stats.totalOrders, icon: HiOutlineLink, color: 'text-purple-600' },
            { label: 'Total Earnings', value: formatPrice(stats.totalEarnings), icon: HiOutlineCash, color: 'text-green-600' },
            { label: 'Pending', value: formatPrice(stats.pendingEarnings), color: 'text-yellow-600' },
            { label: 'Paid Out', value: formatPrice(stats.paidEarnings), color: 'text-green-700' },
            { label: 'Conv Rate', value: stats.totalClicks > 0 ? `${((stats.totalOrders / stats.totalClicks) * 100).toFixed(1)}%` : '0%', color: 'text-brand-dark' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border p-3">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {[
          { value: 'partners', label: 'Partners' },
          { value: 'conversions', label: 'Recent Conversions' },
          { value: 'stats', label: 'Top Performers' },
        ].map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === tab.value ? 'bg-brand-dark text-white' : 'bg-white border text-gray-600'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'partners' && (
        <>
          {/* Search */}
          <div className="mb-4">
            <form onSubmit={(e) => { e.preventDefault(); fetchPartners(); }} className="relative max-w-md">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, code, email..."
                className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </form>
          </div>

          {/* Partners List */}
          <div className="space-y-3">
            {loading ? [...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />) :
            partners.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-500">No referral partners yet</div>
            ) : partners.map((partner) => (
              <div key={partner.id} className={`bg-white rounded-xl border p-5 ${!partner.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-sm">{partner.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${partner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {partner.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-400">{partner.commissionRate}% commission</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                      {partner.email && <span>{partner.email}</span>}
                      {partner.phone && <span>{partner.phone}</span>}
                      <span>Since {formatDate(partner.createdAt)}</span>
                    </div>
                    {/* Referral Link */}
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-xs bg-gray-50 px-2 py-1 rounded font-mono">
                        hiddenglow.pk/?ref={partner.code}
                      </code>
                      <button onClick={() => copyLink(partner.code)}
                        className="text-brand-primary hover:text-brand-primary/80">
                        {copiedCode === partner.code
                          ? <HiOutlineCheck size={14} className="text-green-600" />
                          : <HiOutlineClipboard size={14} />}
                      </button>
                    </div>
                    {/* Performance */}
                    <div className="flex gap-4 text-xs">
                      <span><span className="font-medium">{partner.totalClicks}</span> clicks</span>
                      <span><span className="font-medium">{partner.totalOrders}</span> orders</span>
                      <span className="text-green-600 font-medium">{formatPrice(partner.totalEarnings)} earned</span>
                      <span className="text-yellow-600">{formatPrice(partner.pendingEarnings)} pending</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end flex-shrink-0">
                    <button onClick={() => setSelectedPartner(partner)}
                      className="text-brand-primary hover:underline text-xs font-medium">Edit</button>
                    <button onClick={() => toggleActive(partner)}
                      className={`text-xs font-medium ${partner.isActive ? 'text-red-500' : 'text-green-600'}`}>
                      {partner.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'conversions' && stats && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Partner</th>
                <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Order</th>
                <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Amount</th>
                <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Commission</th>
                <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Status</th>
                <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentConversions.map((conv) => (
                <tr key={conv.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{conv.referral?.name || '—'}</td>
                  <td className="py-3 px-4 text-gray-500">{conv.order?.orderNumber || `#${conv.orderId}`}</td>
                  <td className="text-right py-3 px-4">{formatPrice(conv.orderAmount)}</td>
                  <td className="text-right py-3 px-4 font-medium text-green-600">{formatPrice(conv.commissionAmount)}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[conv.status] || 'bg-gray-100 text-gray-600'}`}>
                      {conv.status}
                    </span>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-500 text-xs">{formatDate(conv.createdAt)}</td>
                </tr>
              ))}
              {stats.recentConversions.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No conversions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Top Performers</h3>
          {stats.topPerformers.map((p, i) => (
            <div key={p.id} className="bg-white rounded-xl border p-4 flex items-center gap-4">
              <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-brand-primary">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">{p.code} • {p.commissionRate}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">{formatPrice(p.totalEarnings)}</p>
                <p className="text-[10px] text-gray-500">{p.totalOrders} orders • {p.totalClicks} clicks</p>
              </div>
            </div>
          ))}
          {stats.topPerformers.length === 0 && (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-500">No data yet</div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreatePartnerModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { fetchPartners(); fetchStats(); setShowCreateModal(false); }}
        />
      )}

      {/* Edit Modal */}
      {selectedPartner && (
        <EditPartnerModal
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
          onSaved={() => { fetchPartners(); fetchStats(); setSelectedPartner(null); }}
        />
      )}
    </div>
  );
}

// ─── Create Partner Modal ────────────────────────────────────────────────────
function CreatePartnerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', commissionRate: '10', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSubmitting(true);
    try {
      await api.post('/referrals/admin', {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        commissionRate: parseFloat(form.commissionRate) || 10,
        notes: form.notes || undefined,
      });
      toast.success('Partner created!');
      onCreated();
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-brand-dark mb-4">Add Referral Partner</h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Partner name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="email@example.com" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="03XX-XXXXXXX" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Commission Rate (%)</label>
            <input type="number" min="0" max="100" step="0.5" value={form.commissionRate}
              onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Internal notes..." />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full mt-4 bg-brand-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50">
          {submitting ? 'Creating...' : 'Create Partner'}
        </button>
        <button onClick={onClose} className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
      </div>
    </div>
  );
}

// ─── Edit Partner Modal ──────────────────────────────────────────────────────
function EditPartnerModal({ partner, onClose, onSaved }: { partner: ReferralPartner; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: partner.name,
    email: partner.email || '',
    phone: partner.phone || '',
    commissionRate: String(partner.commissionRate),
    notes: partner.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.put(`/referrals/admin/${partner.id}`, {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        commissionRate: parseFloat(form.commissionRate) || 10,
        notes: form.notes || null,
      });
      toast.success('Updated!');
      onSaved();
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-brand-dark mb-1">Edit Partner</h2>
        <p className="text-xs text-gray-400 mb-4">Code: {partner.code}</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Commission Rate (%)</label>
            <input type="number" min="0" max="100" step="0.5" value={form.commissionRate}
              onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full mt-4 bg-brand-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50">
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
        <button onClick={onClose} className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
      </div>
    </div>
  );
}
