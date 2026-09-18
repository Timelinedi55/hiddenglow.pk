'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import { useSiteData } from '@/lib/SiteDataProvider';
import { HiChevronDown, HiOutlineShoppingBag, HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import MediaImage from '@/components/MediaImage';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { settings, categories } = useSiteData();
  const cartCount = useCartStore((s) => s.getCount());
  const toggleCart = useCartStore((s) => s.toggleCart);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [menuOpen, closeMenu]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-brand-secondary/30 bg-white/95 shadow-sm backdrop-blur-md' : 'bg-white/90 backdrop-blur-sm'}`}>
      <div className="container-custom">
        <div className="flex items-center justify-between gap-4 h-16 md:h-20">
          <button
            className="lg:hidden p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <HiOutlineX size={24} /> : <HiOutlineMenu size={24} />}
          </button>

          <Link href="/" className="flex items-center gap-3 text-brand-dark">
            {settings.logo ? (
              <div className="relative h-10 w-32 overflow-hidden rounded-lg md:h-11 md:w-36">
                <MediaImage src={settings.logo} alt={settings.site_name || 'Hidden Glow'} sizes="144px" className="object-contain object-left" />
              </div>
            ) : (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-brand-primary" aria-hidden="true" />
                <span className="font-serif text-lg font-bold tracking-wide md:text-2xl">{settings.site_name || 'Hidden Glow'}</span>
              </>
            )}
          </Link>

          <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
            <Link href="/" className="text-sm font-medium hover:text-brand-primary transition-colors focus-visible:outline-none focus-visible:text-brand-primary">Home</Link>
            <Link href="/shop" className="text-sm font-medium hover:text-brand-primary transition-colors focus-visible:outline-none focus-visible:text-brand-primary">Shop</Link>
            <div className="group relative">
              <button
                className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-brand-primary focus-visible:outline-none focus-visible:text-brand-primary"
                aria-haspopup="true"
                aria-expanded={false}
              >
                Categories <HiChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="invisible absolute left-1/2 top-full z-20 mt-4 w-[min(540px,calc(100vw-2rem))] -translate-x-1/2 rounded-[1.5rem] border border-brand-secondary/30 bg-white p-5 opacity-0 shadow-[0_25px_60px_rgba(43,43,43,0.12)] transition-all duration-300 ease-out translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-dark-light/70">Collections</p>
                    <p className="mt-1 font-serif text-2xl font-semibold text-brand-dark">Shop by category</p>
                  </div>
                  <Link href="/shop" className="text-sm font-medium text-brand-dark-light hover:text-brand-dark">View all</Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      className="rounded-2xl border border-brand-secondary/30 bg-brand-bg/50 px-4 py-3 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    >
                      <span className="block">{category.name}</span>
                      {category.description && (
                        <span className="mt-1 block line-clamp-2 text-xs font-normal text-brand-dark-light">
                          {category.description}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/about" className="text-sm font-medium hover:text-brand-primary transition-colors focus-visible:outline-none focus-visible:text-brand-primary">About</Link>
            <Link href="/faq" className="text-sm font-medium hover:text-brand-primary transition-colors focus-visible:outline-none focus-visible:text-brand-primary">FAQ</Link>
            <Link href="/contact" className="text-sm font-medium hover:text-brand-primary transition-colors focus-visible:outline-none focus-visible:text-brand-primary">Contact</Link>
            <Link href="/track-order" className="text-sm font-medium hover:text-brand-primary transition-colors focus-visible:outline-none focus-visible:text-brand-primary">Track Order</Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/shop?sort=newest" className="hidden lg:inline-flex rounded-full border border-brand-secondary/30 bg-brand-bg/70 px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
              New Arrivals
            </Link>
            <button onClick={toggleCart} className="relative rounded-full border border-brand-secondary/30 bg-white p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors hover:bg-brand-bg/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary" aria-label={`Cart, ${cartCount} items`}>
              <HiOutlineShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-xs text-white" aria-hidden="true">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`border-t border-brand-secondary/30 bg-white lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${menuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'}`}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <nav className="container-custom py-5">
          <div className="grid gap-1 rounded-[1.5rem] border border-brand-secondary/30 bg-brand-bg/40 p-3">
            <Link href="/" onClick={closeMenu} className="rounded-xl px-3 py-2.5 text-base font-medium text-brand-dark hover:bg-white transition-colors">Home</Link>
            <Link href="/shop" onClick={closeMenu} className="rounded-xl px-3 py-2.5 text-base font-medium text-brand-dark hover:bg-white transition-colors">Shop</Link>
            <Link href="/about" onClick={closeMenu} className="rounded-xl px-3 py-2.5 text-base font-medium text-brand-dark hover:bg-white transition-colors">About</Link>
            <Link href="/contact" onClick={closeMenu} className="rounded-xl px-3 py-2.5 text-base font-medium text-brand-dark hover:bg-white transition-colors">Contact</Link>
            <Link href="/faq" onClick={closeMenu} className="rounded-xl px-3 py-2.5 text-base font-medium text-brand-dark hover:bg-white transition-colors">FAQ</Link>
            <Link href="/track-order" onClick={closeMenu} className="rounded-xl px-3 py-2.5 text-base font-medium text-brand-dark hover:bg-white transition-colors">Track Order</Link>
            <Link href="/shop?sort=newest" onClick={closeMenu} className="rounded-xl px-3 py-2.5 text-base font-medium text-brand-primary hover:bg-white transition-colors">New Arrivals ✨</Link>
          </div>
          {categories.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-dark-light/70">Collections</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    onClick={closeMenu}
                    className="rounded-2xl border border-brand-secondary/30 bg-white px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-brand-bg hover:border-brand-primary/30 transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
