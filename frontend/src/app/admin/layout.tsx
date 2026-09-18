'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Toaster } from 'react-hot-toast';
import 'react-quill/dist/quill.snow.css';
import {
  HiOutlineHome, HiOutlineShoppingCart, HiOutlineCube, HiOutlineTag,
  HiOutlineDocumentText, HiOutlineCog, HiOutlineStar, HiOutlineQuestionMarkCircle,
  HiOutlineLogout, HiOutlineMenu, HiOutlineX, HiOutlineGlobe, HiOutlinePhotograph,
  HiOutlineUsers, HiOutlineArchive, HiOutlineCurrencyDollar, HiOutlineReceiptRefund,
  HiOutlineChartBar, HiOutlineReply, HiOutlinePresentationChartBar, HiOutlineShare,
  HiOutlineBeaker,
} from 'react-icons/hi';

const navGroups = [
  {
    label: 'Main',
    items: [
      { href: '/admin', label: 'Dashboard', icon: HiOutlineHome },
      { href: '/admin/orders', label: 'Orders', icon: HiOutlineShoppingCart },
      { href: '/admin/returns', label: 'Returns', icon: HiOutlineReply },
      { href: '/admin/customers', label: 'Customers', icon: HiOutlineUsers },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/admin/products', label: 'Products', icon: HiOutlineCube },
      { href: '/admin/inventory', label: 'Inventory', icon: HiOutlineArchive },
      { href: '/admin/media', label: 'Media Gallery', icon: HiOutlinePhotograph },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/cms', label: 'CMS Content', icon: HiOutlineDocumentText },
      { href: '/admin/reviews', label: 'Reviews', icon: HiOutlineStar },
      { href: '/admin/faqs', label: 'FAQs', icon: HiOutlineQuestionMarkCircle },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/admin/refunds', label: 'Refunds', icon: HiOutlineReceiptRefund },
      { href: '/admin/finance', label: 'Expenses', icon: HiOutlineCurrencyDollar },
      { href: '/admin/referrals', label: 'Referrals', icon: HiOutlineShare },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: HiOutlineChartBar },
      { href: '/admin/advanced-analytics', label: 'Advanced Analytics', icon: HiOutlinePresentationChartBar },
      { href: '/admin/ml-insights', label: 'ML Insights', icon: HiOutlineBeaker },
      { href: '/admin/settings', label: 'Settings', icon: HiOutlineCog },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') { setChecking(false); return; }
    if (authenticated) return;
    const token = localStorage.getItem('admin_token');
    if (!token) { router.replace('/admin/login'); return; }
    api.post('/auth/verify').then(() => { setAuthenticated(true); setChecking(false); }).catch(() => {
      localStorage.removeItem('admin_token');
      router.replace('/admin/login');
    });
  }, [pathname, router, authenticated]);

  if (pathname === '/admin/login') return <>{children}</>;
  if (checking) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/admin/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 w-60 bg-brand-dark text-white z-50 transform transition-transform lg:transform-none ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } flex flex-col`}>
        <div className="p-5 border-b border-white/10">
          <h1 className="font-serif text-lg font-bold">Hidden Glow</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold px-3 mb-1">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                      isActive(item.href) ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}>
                    <item.icon size={17} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-400 hover:bg-white/5 hover:text-white w-full">
            <HiOutlineLogout size={17} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between lg:justify-end">
          <button className="lg:hidden p-2 -ml-2" onClick={() => setSidebarOpen(true)}>
            <HiOutlineMenu size={24} />
          </button>
          <Link href="/" target="_blank" className="text-sm text-brand-primary hover:underline">
            View Website →
          </Link>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
