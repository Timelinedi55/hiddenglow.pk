'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { FaWhatsapp } from 'react-icons/fa';
import { HiOutlinePhone, HiOutlineMail } from 'react-icons/hi';

interface Customer {
  name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  city: string;
  orderCount: number;
  totalSpent: number;
  updatedAt: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = () => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get(`/orders/admin/customers${params}`).then((data) => {
      setCustomers(data.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const getWhatsappLink = (phone: string) => {
    const num = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/92${num.startsWith('0') ? num.slice(1) : num}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">Customers ({customers.length})</h1>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-lg">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, email, city..."
          className="border rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        <button type="submit" className="btn-primary px-6">Search</button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">WhatsApp</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium">City</th>
                <th className="text-left px-4 py-3 font-medium text-center">Orders</th>
                <th className="text-left px-4 py-3 font-medium">Total Spent</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Last Order</th>
                <th className="text-left px-4 py-3 font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={9} className="px-4 py-3"><div className="skeleton h-6 w-full" /></td></tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No customers found</td></tr>
              ) : (
                customers.map((c, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-brand-primary">
                        <HiOutlinePhone className="w-3.5 h-3.5" /> {c.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {c.whatsapp ? (
                        <a href={getWhatsappLink(c.whatsapp)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-green-600 hover:text-green-700">
                          <FaWhatsapp className="w-4 h-4" /> {c.whatsapp}
                        </a>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-brand-primary">
                          <HiOutlineMail className="w-3.5 h-3.5" /> {c.email}
                        </a>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">{c.city}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full text-xs font-bold">{c.orderCount}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatPrice(c.totalSpent)}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500">{new Date(c.updatedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <a href={getWhatsappLink(c.whatsapp || c.phone)} target="_blank" rel="noopener noreferrer"
                        className="bg-green-500 text-white px-3 py-1 rounded-full text-xs hover:bg-green-600 inline-flex items-center gap-1">
                        <FaWhatsapp className="w-3 h-3" /> Chat
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
