'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  HiOutlineUsers, HiOutlineEye, HiOutlineUserAdd, HiOutlineRefresh,
  HiOutlineGlobe, HiOutlineDeviceMobile, HiOutlineDesktopComputer,
  HiOutlineClock, HiOutlineChevronDown, HiOutlineChevronUp,
  HiOutlineStatusOnline,
} from 'react-icons/hi';

interface DashboardData {
  overview: {
    totalVisitors: number;
    newVisitors: number;
    returningVisitors: number;
    totalPageViews: number;
    avgPagesPerVisit: number;
  };
  topPages: Array<{
    url: string;
    pageTitle: string;
    views: string;
    uniqueVisitors: string;
    avgDuration: string;
  }>;
  topReferrers: Array<{ referrer: string; count: string }>;
  deviceBreakdown: Array<{ type: string; count: string }>;
  browserBreakdown: Array<{ name: string; count: string }>;
  osBreakdown: Array<{ name: string; count: string }>;
  recentVisitors: Array<{
    id: number;
    visitorId: string;
    ip: string;
    country: string;
    city: string;
    browser: string;
    os: string;
    deviceType: string;
    screenResolution: string;
    referrer: string;
    totalVisits: number;
    totalPageViews: number;
    firstVisit: string;
    lastVisit: string;
    pages: Array<{
      url: string;
      pageTitle: string;
      duration: number;
      viewedAt: string;
    }>;
  }>;
  dailyStats: Array<{ date: string; pageViews: string; visitors: string }>;
}

interface LiveVisitor {
  id: number;
  ip: string;
  browser: string;
  os: string;
  deviceType: string;
  currentPage: string;
  pageTitle: string;
  lastSeen: string;
}

const PERIODS = [
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function DeviceIcon({ type }: { type: string }) {
  if (type === 'Mobile') return <HiOutlineDeviceMobile className="w-4 h-4" />;
  if (type === 'Tablet') return <HiOutlineDeviceMobile className="w-4 h-4 rotate-90" />;
  return <HiOutlineDesktopComputer className="w-4 h-4" />;
}

function PagePathDisplay({ url }: { url: string }) {
  const pageNames: Record<string, string> = {
    '/': 'Homepage', '/shop': 'Shop', '/about': 'About Us',
    '/contact': 'Contact', '/faq': 'FAQ', '/cart': 'Cart',
    '/checkout': 'Checkout', '/privacy-policy': 'Privacy Policy',
    '/terms': 'Terms', '/returns': 'Returns', '/shipping': 'Shipping',
    '/track-order': 'Track Order',
  };
  const name = pageNames[url];
  if (name) return <span>{name}</span>;
  if (url.startsWith('/product/')) return <span className="text-blue-600">Product: {url.replace('/product/', '')}</span>;
  if (url.startsWith('/category/')) return <span className="text-purple-600">Category: {url.replace('/category/', '')}</span>;
  return <span>{url}</span>;
}

// Simple bar chart component
function MiniChart({ data, maxVal }: { data: Array<{ label: string; value: number }>; maxVal: number }) {
  return (
    <div className="flex items-end gap-[2px] h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center group relative">
          <div
            className="w-full bg-brand-primary/80 rounded-t-sm min-h-[2px] transition-all hover:bg-brand-primary"
            style={{ height: `${maxVal > 0 ? (d.value / maxVal) * 100 : 0}%` }}
          />
          <div className="absolute -top-8 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {d.label}: {d.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [live, setLive] = useState<LiveVisitor[]>([]);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [expandedVisitor, setExpandedVisitor] = useState<number | null>(null);
  const [tab, setTab] = useState<'overview' | 'visitors' | 'pages'>('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboard, liveData] = await Promise.all([
        api.get(`/analytics/dashboard?period=${period}`),
        api.get('/analytics/live'),
      ]);
      setData(dashboard);
      setLive(liveData);
    } catch (e) {
      console.error('Failed to fetch analytics', e);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh live visitors every 30s
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const liveData = await api.get('/analytics/live');
        setLive(liveData);
      } catch {}
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const ov = data?.overview || { totalVisitors: 0, newVisitors: 0, returningVisitors: 0, totalPageViews: 0, avgPagesPerVisit: 0 };
  const dailyChartData = (data?.dailyStats || []).map((d) => ({
    label: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    value: parseInt(d.pageViews) || 0,
  }));
  const maxDailyVal = Math.max(1, ...dailyChartData.map((d) => d.value));

  const totalDevices = (data?.deviceBreakdown || []).reduce((sum, d) => sum + parseInt(d.count), 0) || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visitor tracking & site performance</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            <HiOutlineStatusOnline className="w-4 h-4 text-green-600 animate-pulse" />
            <span className="text-sm font-medium text-green-700">{live.length} live</span>
          </div>
          {/* Period selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button onClick={fetchData} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh">
            <HiOutlineRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Visitors', value: ov.totalVisitors, icon: HiOutlineUsers, color: 'blue' },
          { label: 'New Visitors', value: ov.newVisitors, icon: HiOutlineUserAdd, color: 'green' },
          { label: 'Returning', value: ov.returningVisitors, icon: HiOutlineRefresh, color: 'purple' },
          { label: 'Page Views', value: ov.totalPageViews, icon: HiOutlineEye, color: 'amber' },
          { label: 'Pages/Visit', value: ov.avgPagesPerVisit, icon: HiOutlineGlobe, color: 'pink' },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${card.color}-50`}>
                <card.icon className={`w-4 h-4 text-${card.color}-600`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['overview', 'visitors', 'pages'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'overview' ? 'Overview' : t === 'visitors' ? 'Visitors' : 'Pages'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Daily Chart */}
          {dailyChartData.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Page Views</h3>
              <MiniChart data={dailyChartData} maxVal={maxDailyVal} />
              <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                <span>{dailyChartData[0]?.label}</span>
                <span>{dailyChartData[dailyChartData.length - 1]?.label}</span>
              </div>
            </div>
          )}

          {/* Live Visitors */}
          {live.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineStatusOnline className="w-4 h-4 text-green-500 animate-pulse" />
                <h3 className="text-sm font-semibold text-gray-700">Live Visitors ({live.length})</h3>
              </div>
              <div className="space-y-2">
                {live.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 p-2 bg-green-50/50 rounded-lg text-sm">
                    <DeviceIcon type={v.deviceType} />
                    <span className="font-mono text-xs text-gray-500">{v.ip}</span>
                    <span className="text-gray-600">{v.browser}/{v.os}</span>
                    <span className="flex-1 font-medium text-gray-800 truncate"><PagePathDisplay url={v.currentPage} /></span>
                    <span className="text-xs text-gray-400">{timeAgo(v.lastSeen)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Device Breakdown */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Devices</h3>
              <div className="space-y-3">
                {(data?.deviceBreakdown || []).map((d) => {
                  const pct = Math.round((parseInt(d.count) / totalDevices) * 100);
                  return (
                    <div key={d.type}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 text-gray-600">
                          <DeviceIcon type={d.type || 'Desktop'} />
                          {d.type || 'Unknown'}
                        </span>
                        <span className="font-medium text-gray-800">{d.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-brand-primary rounded-full h-1.5 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Browser Breakdown */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Browsers</h3>
              <div className="space-y-2">
                {(data?.browserBreakdown || []).map((b) => (
                  <div key={b.name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{b.name || 'Unknown'}</span>
                    <span className="font-medium text-gray-800 bg-gray-50 px-2 py-0.5 rounded">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* OS Breakdown */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Operating Systems</h3>
              <div className="space-y-2">
                {(data?.osBreakdown || []).map((o) => (
                  <div key={o.name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{o.name || 'Unknown'}</span>
                    <span className="font-medium text-gray-800 bg-gray-50 px-2 py-0.5 rounded">{o.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Referrers */}
          {(data?.topReferrers || []).length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Referrers</h3>
              <div className="space-y-2">
                {data!.topReferrers.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-600 truncate max-w-[400px]">{r.referrer}</span>
                    <span className="font-medium text-gray-800 bg-gray-50 px-2 py-0.5 rounded">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'visitors' && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Recent Visitors ({data?.recentVisitors?.length || 0})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {(data?.recentVisitors || []).map((v) => (
              <div key={v.id}>
                <div
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 cursor-pointer transition-colors"
                  onClick={() => setExpandedVisitor(expandedVisitor === v.id ? null : v.id)}
                >
                  <DeviceIcon type={v.deviceType} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-500">{v.ip || 'Unknown IP'}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{v.browser} / {v.os}</span>
                      {v.deviceType && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          v.deviceType === 'Mobile' ? 'bg-blue-50 text-blue-600' :
                          v.deviceType === 'Tablet' ? 'bg-purple-50 text-purple-600' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {v.deviceType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      <span>{v.totalPageViews} pages</span>
                      <span>{v.totalVisits} visits</span>
                      {v.screenResolution && <span>{v.screenResolution}</span>}
                      {v.referrer && <span className="truncate max-w-[200px]">from: {v.referrer}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">{timeAgo(v.lastVisit)}</p>
                    <p className="text-[10px] text-gray-400">First: {new Date(v.firstVisit).toLocaleDateString()}</p>
                  </div>
                  {expandedVisitor === v.id ? (
                    <HiOutlineChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <HiOutlineChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                {expandedVisitor === v.id && v.pages.length > 0 && (
                  <div className="px-5 pb-3 ml-8">
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Page History</p>
                      {v.pages.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <span className="text-gray-400 w-16 flex-shrink-0">
                            {new Date(p.viewedAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex-1 text-gray-700 truncate">
                            <PagePathDisplay url={p.url} />
                            {p.pageTitle && <span className="text-gray-400 ml-1">— {p.pageTitle}</span>}
                          </span>
                          {p.duration > 0 && (
                            <span className="flex items-center gap-1 text-gray-400 flex-shrink-0">
                              <HiOutlineClock className="w-3 h-3" />
                              {formatDuration(p.duration)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {(data?.recentVisitors || []).length === 0 && (
              <div className="px-5 py-12 text-center text-gray-400 text-sm">
                No visitors tracked yet. Data will appear as visitors browse the site.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'pages' && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Top Pages</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-2.5 font-medium">Page</th>
                <th className="text-right px-5 py-2.5 font-medium">Views</th>
                <th className="text-right px-5 py-2.5 font-medium">Unique</th>
                <th className="text-right px-5 py-2.5 font-medium">Avg Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.topPages || []).map((p, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-800"><PagePathDisplay url={p.url} /></div>
                    <div className="text-xs text-gray-400">{p.url}</div>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-800">{parseInt(p.views).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{parseInt(p.uniqueVisitors).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-gray-500">{formatDuration(parseInt(p.avgDuration) || 0)}</td>
                </tr>
              ))}
              {(data?.topPages || []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                    No page view data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
