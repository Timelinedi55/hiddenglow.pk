'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PartnerLogin() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const data = await api.post('/referrals/partner/login', { code, password });
      // Store partner session
      if (typeof window !== 'undefined') {
        localStorage.setItem('partner_id', String(data.id));
        localStorage.setItem('partner_code', data.code);
        localStorage.setItem('partner_name', data.name);
      }
      toast.success('Welcome back!');
      router.push('/partner/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-2xl border shadow-sm p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-dark font-playfair">Partner Login</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your referral dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
              placeholder="Your referral code"
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-brand-primary text-white py-3 rounded-lg font-medium hover:bg-brand-primary/90 disabled:opacity-50 transition-colors">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Contact us if you need help accessing your account.
        </p>
      </div>
    </div>
  );
}
