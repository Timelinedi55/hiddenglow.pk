'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { HiOutlineCash, HiOutlineCurrencyDollar, HiOutlineClipboardCheck, HiOutlineLogout, HiOutlineCreditCard } from 'react-icons/hi';

interface DashboardData {
  referral: {
    id: number;
    code: string;
    name: string;
    email: string;
    commissionRate: number;
    totalEarnings: number;
    paidEarnings: number;
    availableBalance: number;
    totalClicks: number;
    totalConversions: number;
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
  };
  conversions: Array<{
    id: number;
    orderId: number;
    orderAmount: number;
    commissionAmount: number;
    status: string;
    createdAt: string;
  }>;
  withdrawals: Array<{
    id: number;
    amount: number;
    status: string;
    bankName: string;
    accountNumber: string;
    adminNote: string;
    createdAt: string;
    processedAt: string;
  }>;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  processed: 'bg-blue-100 text-blue-700',
};

export default function PartnerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'bank' | 'withdraw'>('overview');
  const [bankForm, setBankForm] = useState({ bankName: '', accountTitle: '', accountNumber: '', iban: '' });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const partnerId = typeof window !== 'undefined' ? localStorage.getItem('partner_id') : null;
  const partnerCode = typeof window !== 'undefined' ? localStorage.getItem('partner_code') : null;

  const fetchDashboard = useCallback(async () => {
    if (!partnerId || !partnerCode) { router.push('/partner'); return; }
    try {
      const result = await api.post('/referrals/partner/dashboard', { id: parseInt(partnerId), code: partnerCode });
      setData(result);
      setBankForm({
        bankName: result.referral.bankName || '',
        accountTitle: result.referral.accountTitle || '',
        accountNumber: result.referral.accountNumber || '',
        iban: result.referral.iban || '',
      });
    } catch {
      toast.error('Session expired');
      router.push('/partner');
    }
    setLoading(false);
  }, [partnerId, partnerCode, router]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleLogout = () => {
    localStorage.removeItem('partner_id');
    localStorage.removeItem('partner_code');
    localStorage.removeItem('partner_name');
    router.push('/partner');
  };

  const handleBankSave = async () => {
    if (!partnerId || !partnerCode) return;
    setSaving(true);
    try {
      await api.post('/referrals/partner/bank-details', { id: parseInt(partnerId), code: partnerCode, ...bankForm });
      toast.success('Bank details saved');
      fetchDashboard();
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    setSaving(false);
  };

  const handleWithdraw = async () => {
    if (!partnerId || !partnerCode) return;
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      await api.post('/referrals/partner/withdraw', { id: parseInt(partnerId), code: partnerCode, amount });
      toast.success('Withdrawal request submitted');
      setWithdrawAmount('');
      fetchDashboard();
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    setSaving(false);
  };

  if (loading) return <div className="skeleton h-64 rounded-xl" />;
  if (!data) return null;

  const { referral, conversions, withdrawals } = data;
  const referralLink = `https://hiddenglow.pk/?ref=${referral.code}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Welcome, {referral.name}</h1>
          <p className="text-sm text-gray-500">Referral Code: <span className="font-mono font-semibold text-brand-primary">{referral.code}</span></p>
        </div>
        <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm">
          <HiOutlineLogout className="w-4 h-4" /> Logout
        </button>
      </div>

      {/* Referral Link */}
      <div className="bg-white rounded-xl border p-4">
        <p className="text-xs text-gray-500 mb-1">Your Referral Link</p>
        <div className="flex gap-2">
          <input type="text" readOnly value={referralLink} className="flex-1 bg-gray-50 border rounded-lg px-3 py-2 text-sm font-mono" />
          <button onClick={() => { navigator.clipboard.writeText(referralLink); toast.success('Copied!'); }}
            className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-primary/90">
            Copy
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Available Balance', value: formatPrice(referral.availableBalance || 0), icon: HiOutlineCash, color: 'bg-green-50 text-green-600' },
          { label: 'Total Earnings', value: formatPrice(referral.totalEarnings || 0), icon: HiOutlineCurrencyDollar, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Clicks', value: referral.totalClicks || 0, icon: HiOutlineClipboardCheck, color: 'bg-purple-50 text-purple-600' },
          { label: 'Conversions', value: referral.totalConversions || 0, icon: HiOutlineCreditCard, color: 'bg-pink-50 text-pink-600' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-medium text-gray-500 uppercase">{card.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon size={16} />
              </div>
            </div>
            <p className="text-xl font-bold text-brand-dark">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'overview' as const, label: 'Conversions & Withdrawals' },
          { key: 'bank' as const, label: 'Bank Details' },
          { key: 'withdraw' as const, label: 'Request Withdrawal' },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversions */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-brand-dark mb-4">Recent Conversions</h2>
            {conversions.length === 0 ? (
              <p className="text-sm text-gray-400">No conversions yet. Share your referral link!</p>
            ) : (
              <div className="space-y-2">
                {conversions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium">Order #{c.orderId}</p>
                      <p className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">+{formatPrice(c.commissionAmount)}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${statusColors[c.status] || 'bg-gray-100'}`}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Withdrawals */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-brand-dark mb-4">Withdrawal History</h2>
            {withdrawals.length === 0 ? (
              <p className="text-sm text-gray-400">No withdrawals yet.</p>
            ) : (
              <div className="space-y-2">
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium">{formatPrice(w.amount)}</p>
                      <p className="text-xs text-gray-500">{w.bankName} • {new Date(w.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${statusColors[w.status] || 'bg-gray-100'}`}>{w.status}</span>
                      {w.adminNote && <p className="text-[10px] text-gray-400 mt-0.5">{w.adminNote}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'bank' && (
        <div className="bg-white rounded-xl border p-6 max-w-lg">
          <h2 className="font-semibold text-brand-dark mb-4">Bank Account Details</h2>
          <p className="text-xs text-gray-500 mb-4">Your earnings will be transferred to this account.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <select value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                <option value="">Select Bank...</option>
                {['HBL', 'MCB', 'UBL', 'Allied Bank', 'Bank Alfalah', 'Meezan Bank', 'Faysal Bank', 'Standard Chartered', 'JazzCash', 'Easypaisa', 'SadaPay', 'NayaPay', 'Other'].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Title</label>
              <input type="text" value={bankForm.accountTitle} onChange={(e) => setBankForm({ ...bankForm, accountTitle: e.target.value })}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Full name on account" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input type="text" value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Account number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
              <input type="text" value={bankForm.iban} onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="PK00BANK0000000000000000" />
            </div>
            <button onClick={handleBankSave} disabled={saving}
              className="bg-brand-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Bank Details'}
            </button>
          </div>
        </div>
      )}

      {tab === 'withdraw' && (
        <div className="bg-white rounded-xl border p-6 max-w-lg">
          <h2 className="font-semibold text-brand-dark mb-4">Request Withdrawal</h2>
          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-700">Available Balance: <span className="font-bold text-lg">{formatPrice(referral.availableBalance || 0)}</span></p>
          </div>
          {!bankForm.bankName || !bankForm.accountNumber ? (
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-700">Please add your bank details first before requesting a withdrawal.</p>
              <button onClick={() => setTab('bank')} className="text-sm text-brand-primary hover:underline mt-2">Add Bank Details</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
                <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount" min="500"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                <p className="text-xs text-gray-400 mt-1">Minimum withdrawal: Rs. 500</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="text-gray-500">Withdrawal to:</p>
                <p className="font-medium">{bankForm.bankName} — {bankForm.accountTitle}</p>
                <p className="text-xs text-gray-400">{bankForm.accountNumber}</p>
              </div>
              <button onClick={handleWithdraw} disabled={saving || !withdrawAmount}
                className="w-full bg-brand-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50">
                {saving ? 'Submitting...' : 'Request Withdrawal'}
              </button>
              <p className="text-xs text-gray-400">Withdrawals are processed within 3-5 business days after admin approval.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
