'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import {
  HiOutlineTrendingUp, HiOutlineEye, HiOutlineShoppingCart, HiOutlineCash,
  HiOutlineUserGroup, HiOutlineGlobe, HiOutlineDeviceMobile,
} from 'react-icons/hi';

const periods = [
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

export default function AdvancedAnalytics() {
  const [period, setPeriod] = useState('7d');
  const [activeTab, setActiveTab] = useState<'funnel' | 'campaigns' | 'dropoff' | 'remarketing' | 'revenue'>('funnel');
  const [funnelData, setFunnelData] = useState<any>(null);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [dropoffData, setDropoffData] = useState<any>(null);
  const [remarketingData, setRemarketingData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [funnel, counts] = await Promise.all([
        api.get(`/analytics-events/funnel?period=${period}`),
        api.get(`/analytics-events/counts?period=${period}`),
      ]);
      setFunnelData(funnel);
      setEventCounts(counts);
    } catch {}
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchTabData = useCallback(async (tab: string) => {
    try {
      switch (tab) {
        case 'campaigns':
          if (!campaignData) setCampaignData(await api.get(`/analytics-events/campaigns?period=${period}`));
          break;
        case 'dropoff':
          if (!dropoffData) setDropoffData(await api.get(`/analytics-events/dropoff?period=${period}`));
          break;
        case 'remarketing':
          if (!remarketingData) setRemarketingData(await api.get(`/analytics-events/remarketing?period=${period}`));
          break;
        case 'revenue':
          if (!revenueData) setRevenueData(await api.get(`/analytics-events/revenue?period=${period}`));
          break;
      }
    } catch {}
  }, [period, campaignData, dropoffData, remarketingData, revenueData]);

  useEffect(() => { fetchTabData(activeTab); }, [activeTab, fetchTabData]);

  // Reset tab data when period changes
  useEffect(() => {
    setCampaignData(null);
    setDropoffData(null);
    setRemarketingData(null);
    setRevenueData(null);
  }, [period]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">Advanced Analytics</h1>
        <div className="flex gap-1">
          {periods.map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${period === p.value ? 'bg-brand-primary text-white' : 'bg-white border text-gray-600'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Product Views', key: 'view_product', icon: HiOutlineEye, color: 'text-blue-600' },
          { label: 'Add to Cart', key: 'add_to_cart', icon: HiOutlineShoppingCart, color: 'text-orange-600' },
          { label: 'Checkouts', key: 'begin_checkout', icon: HiOutlineCash, color: 'text-purple-600' },
          { label: 'Purchases', key: 'purchase', icon: HiOutlineTrendingUp, color: 'text-green-600' },
          { label: 'Searches', key: 'search', icon: HiOutlineGlobe, color: 'text-cyan-600' },
          { label: 'Category Views', key: 'view_category', icon: HiOutlineUserGroup, color: 'text-pink-600' },
        ].map((card) => (
          <div key={card.key} className="bg-white rounded-xl border p-4">
            <card.icon className={`w-5 h-5 ${card.color} mb-1`} />
            <p className="text-2xl font-bold text-brand-dark">{eventCounts[card.key] || 0}</p>
            <p className="text-[10px] text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {[
          { value: 'funnel', label: 'Conversion Funnel' },
          { value: 'campaigns', label: 'Campaigns & Sources' },
          { value: 'dropoff', label: 'Dropoff Analysis' },
          { value: 'remarketing', label: 'Remarketing' },
          { value: 'revenue', label: 'Revenue' },
        ].map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              activeTab === tab.value ? 'bg-brand-dark text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border p-6">
        {activeTab === 'funnel' && <FunnelTab data={funnelData} loading={loading} />}
        {activeTab === 'campaigns' && <CampaignsTab data={campaignData} />}
        {activeTab === 'dropoff' && <DropoffTab data={dropoffData} />}
        {activeTab === 'remarketing' && <RemarketingTab data={remarketingData} />}
        {activeTab === 'revenue' && <RevenueTab data={revenueData} />}
      </div>
    </div>
  );
}

// ─── Funnel Tab ──────────────────────────────────────────────────────────────
function FunnelTab({ data, loading }: { data: any; loading: boolean }) {
  if (loading || !data) return <div className="text-center py-8 text-gray-400">Loading funnel data...</div>;

  const maxCount = Math.max(...data.steps.map((s: any) => s.count), 1);

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{data.overallConversion}%</p>
          <p className="text-xs text-green-600">Overall Conversion</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{data.cartToCheckout}%</p>
          <p className="text-xs text-blue-600">Cart → Checkout</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-purple-700">{data.checkoutToPayment}%</p>
          <p className="text-xs text-purple-600">Checkout → Purchase</p>
        </div>
      </div>

      <h3 className="font-semibold text-sm mb-4">Conversion Funnel</h3>
      <div className="space-y-3">
        {data.steps.map((step: any, i: number) => {
          const width = maxCount > 0 ? Math.max(5, (step.count / maxCount) * 100) : 5;
          const colors = ['bg-blue-500', 'bg-cyan-500', 'bg-orange-500', 'bg-purple-500', 'bg-green-500'];
          return (
            <div key={step.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{step.name}</span>
                <span className="text-sm text-gray-500">{step.count.toLocaleString()} ({step.rate}%)</span>
              </div>
              <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div className={`h-full ${colors[i]} rounded-lg transition-all duration-500`}
                  style={{ width: `${width}%` }} />
              </div>
              {i < data.steps.length - 1 && (
                <div className="text-center text-xs text-gray-400 py-1">
                  ↓ {data.steps[i + 1].count > 0 && step.count > 0
                    ? ((data.steps[i + 1].count / step.count) * 100).toFixed(1)
                    : 0}% continue
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Campaigns Tab ──────────────────────────────────────────────────────────
function CampaignsTab({ data }: { data: any }) {
  if (!data) return <div className="text-center py-8 text-gray-400">Loading campaign data...</div>;

  return (
    <div className="space-y-6">
      {/* Source/Medium Breakdown */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Traffic Sources</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">Source / Medium</th>
                <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">Events</th>
                <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">Unique</th>
                <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">Purchases</th>
                <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">Revenue</th>
                <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">Conv %</th>
              </tr>
            </thead>
            <tbody>
              {data.sourceBreakdown.map((row: any, i: number) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-2">
                    <span className="font-medium">{row.source || '(direct)'}</span>
                    <span className="text-gray-400"> / {row.medium || '(none)'}</span>
                  </td>
                  <td className="text-right py-2 px-2">{parseInt(row.events).toLocaleString()}</td>
                  <td className="text-right py-2 px-2">{parseInt(row.uniqueVisitors).toLocaleString()}</td>
                  <td className="text-right py-2 px-2 font-medium">{parseInt(row.purchases)}</td>
                  <td className="text-right py-2 px-2 font-medium text-green-600">{formatPrice(parseFloat(row.revenue || 0))}</td>
                  <td className="text-right py-2 px-2">
                    {parseInt(row.uniqueVisitors) > 0
                      ? ((parseInt(row.purchases) / parseInt(row.uniqueVisitors)) * 100).toFixed(1)
                      : '0'}%
                  </td>
                </tr>
              ))}
              {data.sourceBreakdown.length === 0 && (
                <tr><td colSpan={6} className="text-center py-4 text-gray-400">No campaign data yet. UTM parameters will appear after users visit via tracked links.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Breakdown */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Campaigns</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">Campaign</th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">Source</th>
                <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">Events</th>
                <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">Purchases</th>
                <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.campaignBreakdown.map((row: any, i: number) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-2 font-medium">{row.campaign || '—'}</td>
                  <td className="py-2 px-2 text-gray-500">{row.source || '—'}</td>
                  <td className="text-right py-2 px-2">{parseInt(row.events).toLocaleString()}</td>
                  <td className="text-right py-2 px-2 font-medium">{parseInt(row.purchases)}</td>
                  <td className="text-right py-2 px-2 font-medium text-green-600">{formatPrice(parseFloat(row.revenue || 0))}</td>
                </tr>
              ))}
              {data.campaignBreakdown.length === 0 && (
                <tr><td colSpan={5} className="text-center py-4 text-gray-400">No campaigns tracked yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Dropoff Analysis Tab ────────────────────────────────────────────────────
function DropoffTab({ data }: { data: any }) {
  if (!data) return <div className="text-center py-8 text-gray-400">Loading analysis...</div>;

  return (
    <div className="space-y-6">
      {/* Key Drops */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-3xl font-bold text-red-700">{data.viewedNotCarted.toLocaleString()}</p>
          <p className="text-sm text-red-600">Viewed Products But Never Added to Cart</p>
          <p className="text-xs text-red-400 mt-1">These visitors saw products but left without adding anything</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-3xl font-bold text-orange-700">{data.cartedNotCheckedout.toLocaleString()}</p>
          <p className="text-sm text-orange-600">Added to Cart But Didn&apos;t Checkout</p>
          <p className="text-xs text-orange-400 mt-1">Cart abandoners — prime remarketing audience</p>
        </div>
      </div>

      {/* Bounce by Device */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Bounce Rate by Device</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.bounceByDevice.map((d: any) => (
            <div key={d.device} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <HiOutlineDeviceMobile className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium capitalize">{d.device || 'Unknown'}</span>
              </div>
              <p className="text-xl font-bold text-brand-dark">{d.bounceRate}%</p>
              <p className="text-[10px] text-gray-500">{parseInt(d.bounced)}/{parseInt(d.total)} bounced</p>
            </div>
          ))}
        </div>
      </div>

      {/* Most Abandoned Products */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Most Viewed Products (Not Purchased)</h3>
        <div className="space-y-2">
          {data.abandonedProducts.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-sm">{p.productName || `Product #${p.productId}`}</span>
              <span className="text-sm font-medium">{parseInt(p.views)} views</span>
            </div>
          ))}
          {data.abandonedProducts.length === 0 && (
            <p className="text-center text-gray-400 py-4">No product view data yet</p>
          )}
        </div>
      </div>

      {/* Peak Hours */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Peak Activity Hours</h3>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-1">
          {data.peakHours.map((h: any) => {
            const maxEvents = Math.max(...data.peakHours.map((x: any) => parseInt(x.events)), 1);
            const intensity = parseInt(h.events) / maxEvents;
            return (
              <div key={h.hour} className="text-center">
                <div className="h-16 flex items-end justify-center mb-1">
                  <div className="w-full rounded-t"
                    style={{
                      height: `${Math.max(4, intensity * 100)}%`,
                      backgroundColor: `rgba(232, 106, 138, ${0.2 + intensity * 0.8})`,
                    }} />
                </div>
                <span className="text-[9px] text-gray-500">{h.hour}h</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Remarketing Tab ─────────────────────────────────────────────────────────
function RemarketingTab({ data }: { data: any }) {
  if (!data) return <div className="text-center py-8 text-gray-400">Loading remarketing data...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-blue-800 mb-2">Remarketing Audiences</h3>
        <p className="text-xs text-blue-600 mb-3">Use these audience segments for Meta Pixel, Google Ads, and TikTok Pixel custom audiences</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Product Viewers', count: data.audiences.productViewers, desc: 'FB: ViewContent, GA: view_item' },
            { label: 'Add to Cart', count: data.audiences.addToCartUsers, desc: 'FB: AddToCart, GA: add_to_cart' },
            { label: 'Cart Abandoners', count: data.audiences.cartAbandoners, desc: 'High-value retarget audience' },
            { label: 'Customers', count: data.audiences.customers, desc: 'FB: Purchase, GA: purchase' },
          ].map((a) => (
            <div key={a.label} className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-2xl font-bold text-brand-dark">{a.count.toLocaleString()}</p>
              <p className="text-sm font-medium">{a.label}</p>
              <p className="text-[10px] text-gray-500 mt-1">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Event Summary for Pixel Mapping */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Event Summary (Pixel Integration)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">Event Type</th>
                <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">Count</th>
                <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">Total Value</th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">Meta Pixel</th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">Google Analytics</th>
              </tr>
            </thead>
            <tbody>
              {data.eventSummary.map((e: any) => {
                const pixelMap: Record<string, { meta: string; ga: string }> = {
                  view_product: { meta: 'ViewContent', ga: 'view_item' },
                  add_to_cart: { meta: 'AddToCart', ga: 'add_to_cart' },
                  begin_checkout: { meta: 'InitiateCheckout', ga: 'begin_checkout' },
                  purchase: { meta: 'Purchase', ga: 'purchase' },
                  search: { meta: 'Search', ga: 'search' },
                  view_category: { meta: 'ViewCategory', ga: 'view_item_list' },
                };
                const mapping = pixelMap[e.type] || { meta: e.type, ga: e.type };
                return (
                  <tr key={e.type} className="border-b border-gray-50">
                    <td className="py-2 px-2 font-medium">{e.type}</td>
                    <td className="text-right py-2 px-2">{parseInt(e.count).toLocaleString()}</td>
                    <td className="text-right py-2 px-2">{e.totalValue ? formatPrice(parseFloat(e.totalValue)) : '—'}</td>
                    <td className="py-2 px-2"><code className="text-xs bg-blue-50 px-1.5 py-0.5 rounded">{mapping.meta}</code></td>
                    <td className="py-2 px-2"><code className="text-xs bg-green-50 px-1.5 py-0.5 rounded">{mapping.ga}</code></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration Guide */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-sm mb-2">Pixel Integration Status</h3>
        <p className="text-xs text-gray-600 mb-3">Events are automatically tracked. Configure your pixel IDs in Settings to fire server-side events.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {['Meta Pixel', 'Google Analytics 4', 'TikTok Pixel'].map((platform) => (
            <div key={platform} className="bg-white rounded-lg p-3 border">
              <p className="text-sm font-medium">{platform}</p>
              <p className="text-xs text-gray-500">Events auto-mapped from visitor tracking</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Revenue Tab ─────────────────────────────────────────────────────────────
function RevenueTab({ data }: { data: any }) {
  if (!data) return <div className="text-center py-8 text-gray-400">Loading revenue data...</div>;

  return (
    <div className="space-y-6">
      {/* Daily Revenue Chart (Table-based) */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Daily Revenue</h3>
        {data.dailyRevenue.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 min-w-[300px] h-40 px-2">
              {data.dailyRevenue.map((d: any) => {
                const maxRev = Math.max(...data.dailyRevenue.map((x: any) => parseFloat(x.revenue || 0)), 1);
                const height = (parseFloat(d.revenue || 0) / maxRev) * 100;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center group relative">
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-brand-dark text-white text-[10px] whitespace-nowrap px-2 py-1 rounded z-10">
                      {d.date}: {formatPrice(parseFloat(d.revenue || 0))} ({d.orders} orders)
                    </div>
                    <div className="w-full bg-brand-primary/80 rounded-t hover:bg-brand-primary transition-colors"
                      style={{ height: `${Math.max(2, height)}%` }} />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-4">No revenue data yet</p>
        )}
      </div>

      {/* Revenue by Source */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Revenue by Source</h3>
        <div className="space-y-2">
          {data.revenueBySource.map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-sm font-medium">{s.source || '(direct)'}</span>
              <div className="text-right">
                <span className="text-sm font-bold text-green-600">{formatPrice(parseFloat(s.revenue || 0))}</span>
                <span className="text-xs text-gray-400 ml-2">{parseInt(s.conversions)} sales</span>
              </div>
            </div>
          ))}
          {data.revenueBySource.length === 0 && (
            <p className="text-center text-gray-400 py-4">No UTM-attributed revenue yet</p>
          )}
        </div>
      </div>

      {/* Revenue by Device */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Revenue by Device</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.revenueByDevice.map((d: any) => (
            <div key={d.device} className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium capitalize">{d.device || 'Unknown'}</p>
              <p className="text-xl font-bold text-green-600">{formatPrice(parseFloat(d.revenue || 0))}</p>
              <p className="text-[10px] text-gray-500">{parseInt(d.conversions)} conversions</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
