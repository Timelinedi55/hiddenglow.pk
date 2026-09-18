'use client';

import Link from 'next/link';
import { useSiteData } from '@/lib/SiteDataProvider';
import { HiOutlineMail, HiOutlinePhone } from 'react-icons/hi';
import { FiInstagram, FiFacebook, FiTwitter } from 'react-icons/fi';
import { FaWhatsapp, FaTiktok } from 'react-icons/fa';

export default function Footer() {
  const { settings, categories } = useSiteData();

  return (
    <footer className="bg-gradient-to-b from-[#FFF5F5] to-[#FFE8EE] text-brand-dark" role="contentinfo">
      <div className="border-b border-brand-primary/10">
        <div className="container-custom grid gap-4 py-4 text-sm text-brand-dark-light md:grid-cols-3">
          <p>Soft fabrics that actually feel good to wear.</p>
          <p>Private packaging on every order, across Pakistan.</p>
          <p className="md:text-right">Cash on delivery and easy exchanges.</p>
        </div>
      </div>
      <div className="container-custom py-8 md:py-16 lg:py-20">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand + Contact */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="font-serif text-2xl font-bold mb-4 text-brand-dark">{settings.site_name || 'Hidden Glow'}</h3>
            <p className="text-brand-dark-light text-sm leading-relaxed mb-4 max-w-md">
              {settings.footer_about || "Comfortable innerwear for women across Pakistan. Simple, soft, and delivered to your door."}
            </p>
            <ul className="space-y-2 text-sm text-brand-dark-light mb-4">
              {settings.phone && (
                <li className="flex items-center gap-2">
                  <HiOutlinePhone size={16} className="flex-shrink-0 text-brand-primary" />
                  <a href={`tel:${settings.phone}`} className="hover:text-brand-primary transition-colors">{settings.phone}</a>
                </li>
              )}
              {settings.email && (
                <li className="flex items-center gap-2">
                  <HiOutlineMail size={16} className="flex-shrink-0 text-brand-primary" />
                  <a href={`mailto:${settings.email}`} className="hover:text-brand-primary transition-colors">{settings.email}</a>
                </li>
              )}
            </ul>
            <div className="flex items-center gap-3 flex-wrap">
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-brand-primary/10 hover:bg-brand-primary hover:text-white flex items-center justify-center transition-all duration-200 text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary" aria-label="Instagram">
                  <FiInstagram className="w-4 h-4" />
                </a>
              )}
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-brand-primary/10 hover:bg-brand-primary hover:text-white flex items-center justify-center transition-all duration-200 text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary" aria-label="Facebook">
                  <FiFacebook className="w-4 h-4" />
                </a>
              )}
              {settings.tiktok && (
                <a href={settings.tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-brand-primary/10 hover:bg-brand-primary hover:text-white flex items-center justify-center transition-all duration-200 text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary" aria-label="TikTok">
                  <FaTiktok className="w-4 h-4" />
                </a>
              )}
              {settings.twitter && (
                <a href={settings.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-brand-primary/10 hover:bg-brand-primary hover:text-white flex items-center justify-center transition-all duration-200 text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary" aria-label="Twitter / X">
                  <FiTwitter className="w-4 h-4" />
                </a>
              )}
              {settings.whatsapp && (
                <a href={`https://wa.me/${settings.whatsapp?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-green-700 transition-colors">
                  <FaWhatsapp className="w-4 h-4" /> WhatsApp Us
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-brand-dark">Quick Links</h4>
            <ul className="space-y-3 text-sm text-brand-dark-light">
              <li><Link href="/shop" className="hover:text-brand-primary transition-colors py-1 inline-block">Shop All</Link></li>
              <li><Link href="/about" className="hover:text-brand-primary transition-colors py-1 inline-block">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-brand-primary transition-colors py-1 inline-block">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-brand-primary transition-colors py-1 inline-block">FAQ</Link></li>
              <li><Link href="/track-order" className="hover:text-brand-primary transition-colors py-1 inline-block">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-brand-dark">Categories</h4>
            <ul className="space-y-3 text-sm text-brand-dark-light">
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link href={`/category/${category.slug}`} className="hover:text-brand-primary transition-colors py-1 inline-block">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-semibold mb-4 text-brand-dark">Policies</h4>
            <ul className="space-y-3 text-sm text-brand-dark-light">
              <li><Link href="/privacy-policy" className="hover:text-brand-primary transition-colors py-1 inline-block">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-primary transition-colors py-1 inline-block">Terms & Conditions</Link></li>
              <li><Link href="/returns" className="hover:text-brand-primary transition-colors py-1 inline-block">Return & Exchange</Link></li>
              <li><Link href="/shipping" className="hover:text-brand-primary transition-colors py-1 inline-block">Shipping Policy</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-brand-primary/15 mt-10 pt-6 pb-16 lg:pb-0 text-center text-sm text-brand-dark-light">
          {settings.footer_text || `© ${new Date().getFullYear()} Hidden Glow. All rights reserved.`}
        </div>
      </div>
    </footer>
  );
}
