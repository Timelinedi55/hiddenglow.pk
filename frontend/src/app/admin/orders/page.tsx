'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { FaWhatsapp } from 'react-icons/fa';
import { HiOutlineQrcode, HiOutlineDownload } from 'react-icons/hi';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [scannerInput, setScannerInput] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const scannerRef = useRef<HTMLInputElement>(null);

  const fetchOrders = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (status !== 'all') params.set('status', status);
    if (search) params.set('search', search);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    api.get(`/orders/admin/list?${params.toString()}`).then((data) => {
      setOrders(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setLoading(false);
      setSelectedIds(new Set());
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [page, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const getWhatsappLink = (phone: string) => {
    const num = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/92${num.startsWith('0') ? num.slice(1) : num}`;
  };

  const handleStatusChange = async (order: Order, newStatus: string) => {
    if (newStatus === order.status) return;
    if (newStatus === 'cancelled' && !confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)) return;
    setUpdatingStatus(order.id);
    try {
      await api.put(`/orders/${order.id}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: newStatus } : o));
      toast.success(`Order ${order.orderNumber} updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (!newStatus) return;
    const ids = Array.from(selectedIds);
    const affectedOrders = orders.filter((o) => ids.includes(o.id));
    if (newStatus === 'cancelled' && !confirm(`Cancel ${ids.length} order(s)?`)) return;
    let success = 0;
    for (const order of affectedOrders) {
      try {
        await api.put(`/orders/${order.id}/status`, { status: newStatus });
        success++;
      } catch { /* skip failed */ }
    }
    toast.success(`${success}/${ids.length} orders updated to ${newStatus}`);
    fetchOrders();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  };

  const exportSelectedCSV = () => {
    const selected = orders.filter((o) => selectedIds.has(o.id));
    if (selected.length === 0) return;
    const headers = ['Order #', 'Customer', 'Phone', 'WhatsApp', 'City', 'Address', 'Total', 'Status', 'Tracking', 'Date'];
    const rows = selected.map((o) => [
      o.orderNumber,
      o.customerName,
      o.phone,
      o.whatsapp || '',
      o.city,
      `"${(o.address || '').replace(/"/g, '""')}"`,
      o.total,
      o.status,
      o.trackingNumber || '',
      new Date(o.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleScannerSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !scannerInput.trim()) return;
    const query = scannerInput.trim();
    try {
      const data = await api.get(`/orders/admin/list?search=${encodeURIComponent(query)}&limit=1`);
      if (data.items && data.items.length > 0) {
        router.push(`/admin/orders/${data.items[0].id}`);
      } else {
        toast.error(`No order found for "${query}"`);
      }
    } catch {
      toast.error('Failed to search order');
    }
    setScannerInput('');
  };

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">Orders ({total})</h1>
      </div>

      <div className="flex items-center gap-2 mb-4 bg-white border rounded-lg px-4 py-2">
        <HiOutlineQrcode className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <input
          ref={scannerRef}
          type="text"
          value={scannerInput}
          onChange={(e) => setScannerInput(e.target.value)}
          onKeyDown={handleScannerSubmit}
          placeholder="Scan barcode or enter order number and press Enter..."
          className="flex-1 focus:outline-none text-sm"
        />
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order #, name, phone, email, whatsapp..."
              className="border rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            <button type="submit" className="btn-primary px-6">Search</button>
          </form>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm text-gray-500">Date Range:</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
          <span className="text-sm text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
          <button onClick={() => { setPage(1); fetchOrders(); }} className="text-sm text-brand-primary hover:underline">Apply</button>
          {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); setTimeout(fetchOrders, 0); }} className="text-sm text-gray-400 hover:text-gray-600">Clear</button>}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={orders.length > 0 && selectedIds.size === orders.length} onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                </th>
                <th className="text-left px-4 py-3 font-medium">Order #</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">WhatsApp</th>
                <th className="text-left px-4 py-3 font-medium">City</th>
                <th className="text-left px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Tracking</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={11} className="px-4 py-3"><div className="skeleton h-6 w-full" /></td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-500">No orders found</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className={`border-b hover:bg-gray-50 ${selectedIds.has(order.id) ? 'bg-brand-primary/5' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleSelect(order.id)}
                        className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                    </td>
                    <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3">{order.customerName}</td>
                    <td className="px-4 py-3">{order.phone}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {(order.whatsapp || order.phone) && (
                        <a href={getWhatsappLink(order.whatsapp || order.phone)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-green-600 hover:text-green-700">
                          <FaWhatsapp className="w-4 h-4" /> <span className="text-xs">Chat</span>
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">{order.city}</td>
                    <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order, e.target.value)}
                        disabled={updatingStatus === order.id}
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize border-0 cursor-pointer focus:ring-2 focus:ring-brand-primary ${statusColors[order.status] || 'bg-gray-100'} ${updatingStatus === order.id ? 'opacity-50' : ''}`}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s} className="bg-white text-gray-900">{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {order.trackingNumber ? (
                        <span className="text-xs text-gray-600">{order.courierName && `${order.courierName}: `}{order.trackingNumber}</span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="text-brand-primary hover:underline">View</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-lg font-medium ${page === i + 1 ? 'bg-brand-primary text-white' : 'bg-white border hover:bg-gray-50'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-gray-700">{selectedIds.size} order(s) selected</span>
            <div className="flex items-center gap-3">
              <select
                defaultValue=""
                onChange={(e) => { handleBulkStatusChange(e.target.value); e.target.value = ''; }}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="" disabled>Bulk Update Status...</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
              <button onClick={exportSelectedCSV} className="btn-outline inline-flex items-center gap-2 px-4 py-2 text-sm">
                <HiOutlineDownload className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
