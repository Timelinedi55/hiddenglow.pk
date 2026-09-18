'use client';

import { usePathname } from 'next/navigation';
import { useSiteData } from '@/lib/SiteDataProvider';
import { FaWhatsapp } from 'react-icons/fa';

export default function WhatsAppFloat() {
  const pathname = usePathname();
  const { settings } = useSiteData();
  const whatsapp = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';

  // Hide on cart, product, and checkout pages
  if (!whatsapp || pathname === '/cart' || pathname === '/checkout' || pathname.startsWith('/product/')) return null;

  return (
    <a
      href={`https://wa.me/${whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:bg-green-600 hover:scale-110 transition-all duration-200 group"
    >
      <FaWhatsapp className="w-7 h-7 text-white" />
      <span className="absolute right-full mr-3 bg-white text-gray-800 text-sm font-medium px-3 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Chat with us
      </span>
    </a>
  );
}
