'use client';

import { useState, useEffect } from 'react';
import { HiBadgeCheck, HiTrendingUp, HiTrendingDown, HiUsers, HiShoppingCart, HiEye, HiLightningBolt, HiClock, HiExclamation } from 'react-icons/hi';
import { formatPrice } from '@/lib/utils';

const ML_BASE = '/api/ml';

async function mlGet(path: string) {
  const res = await fetch(`/ml${path}`);
  if (!res.ok) throw new Error('ML service unavailable');
  return res.json();
}

export default function MLInsightsPage() {
  const [tab, setTab] = useState<'dropoff' | 'demand' | 'segments' | 'trending'>('dropoff');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    setLoading(true);
    setError('');
    const path =
      tab === 'dropoff' ? `/analysis/traffic-dropoff?days=${days}` :
      tab === 'demand'  ? `/predictions/demand?days_ahead=${days}` :
      tab === 'segments' ? '/analysis/customer-segments' :
      `/trending?days=${days}`;

    mlGet(path).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [tab, days]);

  const tabs = [
    { key: 'dropoff', label: 'Traffic Dropoff', icon: HiExclamation },
    { key: 'demand', label: 'Demand Forecast', icon: HiTrendingUp },
    { key: 'segments', label: 'Customer Segments', icon: HiUsers },
    { key: 'trending', label: 'Trending Products', icon: HiLightningBolt },
  ] as const;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ML Insights</h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered analytics &amp; predictions</p>
        </div>
        {tab !== 'segments' && (
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        )}
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl p-6 animate-pulse"><div className="h-6 bg-gray-200 rounded w-1/3 mb-4" /><div className="h-24 bg-gray-100 rounded" /></div>)}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <HiExclamation className="mx-auto text-red-400 mb-2" size={32} />
          <p className="text-red-700 font-medium">{error}</p>
          <p className="text-red-500 text-sm mt-1">Make sure the ML service is running on port 4002</p>
        </div>
      ) : (
        <>
          {tab === 'dropoff' && <DropoffView data={data} />}
          {tab === 'demand' && <DemandView data={data} />}
          {tab === 'segments' && <SegmentsView data={data} />}
          {tab === 'trending' && <TrendingView data={data} />}
        </>
      )}
    </div>
  );
}

function DropoffView({ data }: { data: any }) {
  if (!data) return null;
  const overview = data.overview || {};
  const { productDropoff, topPages, deviceBreakdown, hourlyAnalysis, insights } = data;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Total Visitors</p>
          <p className="text-2xl font-bold mt-1">{(overview.totalVisitors || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold mt-1">{(overview.totalOrders || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className={`text-2xl font-bold mt-1 ${(overview.conversionRate || 0) < 2 ? 'text-red-600' : 'text-green-600'}`}>
            {overview.conversionRate || 0}%
          </p>
        </div>
      </div>

      {/* AI Insights */}
      {insights?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
            <HiLightningBolt size={18} /> AI Insights
          </h3>
          <ul className="space-y-2">
            {insights.map((insight: string, i: number) => (
              <li key={i} className="text-sm text-amber-700 flex gap-2">
                <span className="text-amber-400 mt-0.5">•</span> {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Product Dropoff Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold">Product Funnel Analysis</h3>
          <p className="text-sm text-gray-500 mt-0.5">Products with high views but low conversions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Product</th>
                <th className="px-5 py-3 text-right font-medium">Views</th>
                <th className="px-5 py-3 text-right font-medium">Cart Adds</th>
                <th className="px-5 py-3 text-right font-medium">Purchases</th>
                <th className="px-5 py-3 text-right font-medium">View→Cart</th>
                <th className="px-5 py-3 text-right font-medium">Cart→Buy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(productDropoff || []).map((p: any) => (
                <tr key={p.productId} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium">{p.productName}</td>
                  <td className="px-5 py-3 text-right">{p.views}</td>
                  <td className="px-5 py-3 text-right">{p.cart_adds}</td>
                  <td className="px-5 py-3 text-right">{p.purchases}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={p.viewToCartRate < 10 ? 'text-red-600' : 'text-green-600'}>
                      {p.viewToCartRate}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={p.cartToPurchaseRate < 30 ? 'text-red-600' : 'text-green-600'}>
                      {p.cartToPurchaseRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold mb-4">Device Performance</h3>
          <div className="space-y-3">
            {(deviceBreakdown || []).map((d: any) => (
              <div key={d.device || 'unknown'} className="flex items-center justify-between">
                <span className="text-sm capitalize">{d.device || 'Unknown'}</span>
                <div className="text-right">
                  <span className="text-sm font-medium">{d.visitors} visitors</span>
                  <span className="text-xs text-gray-400 ml-2">→ {d.orders} orders</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold mb-4">Hourly Conversion</h3>
          <div className="space-y-1">
            {(hourlyAnalysis || []).filter((_: any, i: number) => i % 2 === 0).map((h: any) => (
              <div key={h.hour} className="flex items-center gap-3 text-sm">
                <span className="w-12 text-gray-500">{h.hour}:00</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="h-full bg-brand-primary/60 rounded-full" style={{ width: `${Math.min(100, h.visits / 10)}%` }} />
                </div>
                <span className="w-12 text-right text-xs">{h.conversionRate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DemandView({ data }: { data: any }) {
  if (!data?.predictions) return <p className="text-gray-500">No demand data available</p>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">Predicted demand for the next {data.daysAhead} days based on sales trends</p>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Product</th>
              <th className="px-5 py-3 text-right font-medium">Predicted Units</th>
              <th className="px-5 py-3 text-center font-medium">Trend</th>
              <th className="px-5 py-3 text-right font-medium">Weekly History</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.predictions.map((p: any) => (
              <tr key={p.productId} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium">{p.productName}</td>
                <td className="px-5 py-3 text-right font-bold">{p.predictedDemand}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.trend === 'rising' ? 'bg-green-100 text-green-700' :
                    p.trend === 'declining' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {p.trend === 'rising' ? <HiTrendingUp size={14} /> : p.trend === 'declining' ? <HiTrendingDown size={14} /> : null}
                    {p.trend}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-end gap-1 justify-end h-6">
                    {(p.weeklyHistory || []).map((v: number, i: number) => {
                      const max = Math.max(...(p.weeklyHistory || [1]));
                      return <div key={i} className="w-3 bg-brand-primary/40 rounded-sm" style={{ height: `${max > 0 ? (v / max) * 100 : 0}%`, minHeight: '2px' }} />;
                    })}
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

function SegmentsView({ data }: { data: any }) {
  if (!data?.segments?.length) return <p className="text-gray-500">{data?.message || 'No segment data'}</p>;

  const colors = ['bg-purple-50 border-purple-200', 'bg-blue-50 border-blue-200', 'bg-green-50 border-green-200', 'bg-amber-50 border-amber-200'];
  const textColors = ['text-purple-700', 'text-blue-700', 'text-green-700', 'text-amber-700'];

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">Customer segments identified by AI clustering</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.segments.map((seg: any, i: number) => (
          <div key={i} className={`rounded-xl border p-5 ${colors[i % colors.length]}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold text-lg ${textColors[i % textColors.length]}`}>{seg.segment}</h3>
              <span className="text-xs bg-white/60 px-2 py-1 rounded-full font-medium">{seg.customerCount} customers</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">{seg.description}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-gray-500">Avg Orders</p>
                <p className="font-bold">{seg.avgOrders}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Spend</p>
                <p className="font-bold">{formatPrice(seg.avgSpend)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="font-bold">{formatPrice(seg.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Recency</p>
                <p className="font-bold">{seg.avgRecencyDays}d</p>
              </div>
            </div>
            {seg.customers?.length > 0 && (
              <div className="border-t border-black/10 pt-3 mt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Top Customers</p>
                <div className="space-y-1.5">
                  {seg.customers.slice(0, 5).map((c: any, j: number) => (
                    <div key={j} className="flex items-center justify-between text-sm">
                      <span>{c.name}</span>
                      <span className="font-medium">{formatPrice(c.totalSpend)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendingView({ data }: { data: any }) {
  if (!data?.products?.length) return <p className="text-gray-500">No trending data available</p>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">Products ranked by sales velocity vs previous period</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.products.map((p: any, i: number) => (
          <div key={p.productId} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl font-bold text-gray-200">#{i + 1}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                p.trendLabel === 'Hot' ? 'bg-red-100 text-red-700' :
                p.trendLabel === 'Rising' ? 'bg-green-100 text-green-700' :
                p.trendLabel === 'Declining' ? 'bg-gray-100 text-gray-500' :
                'bg-blue-100 text-blue-700'
              }`}>
                {p.trendLabel}
              </span>
            </div>
            <h4 className="font-semibold text-sm mb-2 line-clamp-2">{p.productName}</h4>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{p.recent_sales} sold</span>
              <span className={`font-bold ${p.growthRate > 0 ? 'text-green-600' : p.growthRate < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {p.growthRate > 0 ? '+' : ''}{p.growthRate}%
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{formatPrice(p.discountPrice || p.price)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
