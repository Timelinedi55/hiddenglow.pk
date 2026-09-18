'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import {
  HiOutlineShoppingCart,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineTrendingUp,
  HiOutlineChartBar,
  HiOutlineCash,
  HiOutlineCalculator,
  HiOutlineEye,
  HiOutlineExclamation,
  HiOutlineUserGroup,
} from 'react-icons/hi';

interface DailyOrder {
  date: string;
  count: string;
  revenue: string;
}

interface TopProduct {
  name: string;
  totalSold: string;
  totalRevenue: string;
}

interface TopCity {
  city: string;
  count: string;
  revenue: string;
}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  weeklyOrders: number;
  weeklyRevenue: number;
  avgOrderValue: number;
  dailyOrders: DailyOrder[];
  topProducts: TopProduct[];
  topCities: TopCity[];
}

interface RecentOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  city: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/orders/admin/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
    api
      .get('/orders/admin/list?limit=8')
      .then((data) => setRecentOrders(data.items || []))
      .catch(() => {});
  }, []);

  const cards = stats
    ? [
        {
          label: 'Total Orders',
          value: stats.totalOrders,
          icon: HiOutlineShoppingCart,
          color: 'bg-blue-50 text-blue-600',
          ring: '',
        },
        {
          label: 'Pending Orders',
          value: stats.pendingOrders,
          icon: HiOutlineClock,
          color: 'bg-yellow-50 text-yellow-600',
          ring: 'ring-2 ring-yellow-300',
        },
        {
          label: 'Today Orders',
          value: stats.todayOrders,
          icon: HiOutlineCalendar,
          color: 'bg-purple-50 text-purple-600',
          ring: '',
        },
        {
          label: 'Today Revenue',
          value: formatPrice(stats.todayRevenue),
          icon: HiOutlineCurrencyDollar,
          color: 'bg-pink-50 text-pink-600',
          ring: '',
        },
        {
          label: 'Weekly Orders',
          value: stats.weeklyOrders,
          icon: HiOutlineTrendingUp,
          color: 'bg-indigo-50 text-indigo-600',
          ring: '',
        },
        {
          label: 'Weekly Revenue',
          value: formatPrice(stats.weeklyRevenue),
          icon: HiOutlineChartBar,
          color: 'bg-teal-50 text-teal-600',
          ring: '',
        },
        {
          label: 'Total Revenue',
          value: formatPrice(stats.totalRevenue),
          icon: HiOutlineCash,
          color: 'bg-green-50 text-green-600',
          ring: '',
        },
        {
          label: 'Avg Order Value',
          value: formatPrice(stats.avgOrderValue),
          icon: HiOutlineCalculator,
          color: 'bg-orange-50 text-orange-600',
          ring: '',
        },
      ]
    : [];

  // Chart helpers
  const dailyOrders = stats?.dailyOrders ?? [];
  const maxCount = Math.max(...dailyOrders.map((d) => Number(d.count)), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Dashboard</h1>

      {/* ── Stats Cards ────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`bg-white rounded-xl p-5 shadow-sm border ${card.ring}`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {card.label}
                </p>
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}
                >
                  <card.icon size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-brand-dark">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Orders Chart (last 30 days) ────────────────────── */}
      {stats && dailyOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="text-lg font-semibold text-brand-dark mb-4">
            Daily Orders — Last 30 Days
          </h2>
          <div className="flex items-end gap-[3px] h-[200px]">
            {dailyOrders.map((day) => {
              const count = Number(day.count);
              const heightPct = (count / maxCount) * 100;
              const dateObj = new Date(day.date);
              const label = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
                    <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      <div>{label}</div>
                      <div>{count} orders</div>
                      <div>{formatPrice(Number(day.revenue))}</div>
                    </div>
                    <div className="w-2 h-2 bg-gray-800 rotate-45 -mt-1" />
                  </div>
                  <div
                    className="w-full bg-brand-primary/70 hover:bg-brand-primary rounded-t transition-colors min-h-[2px]"
                    style={{ height: `${Math.max(heightPct, 1)}%` }}
                  />
                </div>
              );
            })}
          </div>
          {/* X-axis labels — show every 5th date */}
          <div className="flex gap-[3px] mt-1">
            {dailyOrders.map((day, i) => {
              const dateObj = new Date(day.date);
              const label = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
              return (
                <div
                  key={day.date}
                  className="flex-1 text-center text-[10px] text-gray-400"
                >
                  {i % 5 === 0 ? label : ''}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Top Products & Top Cities ──────────────────────── */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-lg font-semibold text-brand-dark mb-4">
              Top Products
            </h2>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-gray-400">No data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 pr-2 font-medium">#</th>
                      <th className="pb-2 pr-2 font-medium">Product</th>
                      <th className="pb-2 pr-2 font-medium text-right">Sold</th>
                      <th className="pb-2 font-medium text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topProducts.map((p: TopProduct, i: number) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-2 text-gray-400">{i + 1}</td>
                        <td className="py-2 pr-2 font-medium text-brand-dark max-w-[200px] truncate">
                          {p.name}
                        </td>
                        <td className="py-2 pr-2 text-right">{p.totalSold}</td>
                        <td className="py-2 text-right">
                          {formatPrice(Number(p.totalRevenue))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Cities */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-lg font-semibold text-brand-dark mb-4">
              Top Cities
            </h2>
            {stats.topCities.length === 0 ? (
              <p className="text-sm text-gray-400">No data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 pr-2 font-medium">City</th>
                      <th className="pb-2 pr-2 font-medium text-right">Orders</th>
                      <th className="pb-2 font-medium text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topCities.map((c: TopCity, i: number) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-2 font-medium text-brand-dark">
                          {c.city}
                        </td>
                        <td className="py-2 pr-2 text-right">{c.count}</td>
                        <td className="py-2 text-right">
                          {formatPrice(Number(c.revenue))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Order Status Distribution + Recent Orders ──── */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-lg font-semibold text-brand-dark mb-4">Order Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Pending', count: stats.pendingOrders, color: 'bg-yellow-400', pct: stats.totalOrders > 0 ? (stats.pendingOrders / stats.totalOrders) * 100 : 0 },
                { label: 'Confirmed', count: stats.confirmedOrders, color: 'bg-blue-400', pct: stats.totalOrders > 0 ? (stats.confirmedOrders / stats.totalOrders) * 100 : 0 },
                { label: 'Shipped', count: stats.shippedOrders, color: 'bg-purple-400', pct: stats.totalOrders > 0 ? (stats.shippedOrders / stats.totalOrders) * 100 : 0 },
                { label: 'Delivered', count: stats.deliveredOrders, color: 'bg-green-400', pct: stats.totalOrders > 0 ? (stats.deliveredOrders / stats.totalOrders) * 100 : 0 },
                { label: 'Cancelled', count: stats.cancelledOrders, color: 'bg-red-400', pct: stats.totalOrders > 0 ? (stats.cancelledOrders / stats.totalOrders) * 100 : 0 },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{s.label}</span>
                    <span className="font-medium">{s.count} ({s.pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${Math.max(s.pct, 0.5)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-dark">Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs text-brand-primary hover:underline">View All</Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400">No orders yet.</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((o) => (
                  <Link key={o.id} href={`/admin/orders/${o.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-gray-700">{o.orderNumber}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusColors[o.status] || 'bg-gray-100'}`}>{o.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{o.customerName} • {o.city}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold">{formatPrice(o.total)}</p>
                      <p className="text-[10px] text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Quick Actions ──────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="text-lg font-semibold text-brand-dark mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/orders?status=pending"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors text-sm font-medium"
          >
            <HiOutlineEye size={18} />
            View Pending Orders
          </Link>
          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <HiOutlineExclamation size={18} />
            View Low Stock
          </Link>
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <HiOutlineUserGroup size={18} />
            View Customers
          </Link>
        </div>
      </div>
    </div>
  );
}
