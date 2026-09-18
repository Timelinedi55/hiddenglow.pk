'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Product, Review, CmsSection } from '@/lib/types';
import { useSiteData } from '@/lib/SiteDataProvider';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/lib/store';
import ProductCard from '@/components/ProductCard';
import MediaImage from '@/components/MediaImage';
import HeroCarousel from '@/components/HeroCarousel';
import { HiOutlineTruck, HiOutlineShieldCheck, HiOutlineRefresh, HiStar, HiArrowRight, HiChevronLeft, HiChevronRight, HiOutlineLockClosed } from 'react-icons/hi';
import { FiScissors, FiMaximize, FiWind, FiPackage } from 'react-icons/fi';

export default function HomePage() {
  const [cms, setCms] = useState<Record<string, CmsSection>>({});
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const { categories } = useSiteData();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/cms/page/homepage').catch(() => ({})),
      api.get('/products/best-sellers').catch(() => []),
      api.get('/products/featured').catch(() => []),
      api.get('/reviews/homepage').catch(() => []),
    ]).then(([cmsData, bs, feat, revs]) => {
      setCms(cmsData);
      setBestSellers(bs);
      setFeatured(feat);
      setReviews(revs);
      setLoading(false);
    });
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    if (loading) return;
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -10px 0px' });
    reveals.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  const trustBadges = (() => {
    try { return JSON.parse(cms.trust_badges?.content || '[]'); }
    catch { return []; }
  })();

  const iconMap: Record<string, any> = {
    truck: HiOutlineTruck,
    shield: HiOutlineShieldCheck,
    refresh: HiOutlineRefresh,
    lock: HiOutlineLockClosed,
  };

  if (loading) {
    return (
      <>
        {/* Hero Skeleton */}
        <section className="bg-gradient-to-br from-[#FFF5F5] via-[#FFF0F3] to-[#FFE4EC]">
          <div className="container-custom py-6 md:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div className="order-2 lg:order-1 space-y-4">
                <div className="h-5 w-48 bg-brand-secondary/40 rounded-full shimmer" />
                <div className="h-10 w-72 bg-brand-secondary/30 rounded-lg shimmer" />
                <div className="h-10 w-56 bg-brand-secondary/30 rounded-lg shimmer" />
                <div className="h-4 w-80 bg-brand-secondary/20 rounded shimmer" />
                <div className="flex gap-3 pt-2">
                  <div className="h-12 w-44 bg-brand-primary/30 rounded-lg shimmer" />
                  <div className="h-12 w-32 bg-brand-secondary/30 rounded-lg shimmer" />
                </div>
              </div>
              <div className="order-1 lg:order-2 flex justify-center">
                <div className="w-full max-w-[280px] sm:max-w-sm aspect-square bg-brand-secondary/30 rounded-2xl shimmer" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[1,2,3].map(i => <div key={i} className="bg-white/60 rounded-2xl p-3 text-center shimmer h-16" />)}
            </div>
          </div>
        </section>
        {/* Trust + Categories Skeleton */}
        <section className="bg-white border-y border-gray-100 py-4">
          <div className="container-custom flex justify-around">
            {[1,2,3].map(i => <div key={i} className="flex flex-col items-center gap-2"><div className="w-9 h-9 bg-gray-100 rounded-full shimmer" /><div className="h-3 w-16 bg-gray-100 rounded shimmer" /></div>)}
          </div>
        </section>
        <section className="py-10 bg-white">
          <div className="container-custom">
            <div className="h-7 w-48 bg-gray-100 rounded mx-auto mb-6 shimmer" />
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-2xl shimmer" />)}
            </div>
          </div>
        </section>
        {/* Product Grid Skeleton */}
        <section className="py-10 bg-brand-bg/50">
          <div className="container-custom">
            <div className="h-7 w-40 bg-gray-100 rounded mb-6 shimmer" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="space-y-2"><div className="aspect-square bg-gray-100 rounded-2xl shimmer" /><div className="h-3 w-24 bg-gray-100 rounded shimmer" /><div className="h-4 w-20 bg-gray-100 rounded shimmer" /></div>)}
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF5F5] via-[#FFF0F3] to-[#FFE4EC]">
        {/* Soft ambient shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-brand-primary/[0.07] rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-[20%] w-[400px] h-[400px] bg-brand-accent/[0.06] rounded-full blur-[80px]" />
        </div>

        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center py-8 md:py-14 lg:py-16">
            {/* Text content — arranged with image in middle on mobile */}
            <div className="flex flex-col">
              <div className="order-1 text-center lg:text-left">
                <h1 className="text-[1.75rem] leading-[1.15] sm:text-5xl lg:text-[4.5rem] xl:text-[5.5rem] font-serif font-extrabold text-brand-dark mb-4 md:mb-6 tracking-tight drop-shadow-sm">
                  {(() => {
                    const words = (cms.hero?.title || 'Comfort You Can Feel').split(' ');
                    const last = words.pop();
                    return <>{words.join(' ')} <span className="text-brand-primary drop-shadow-sm">{last}</span></>;
                  })()}
                </h1>
              </div>

              {/* Hero image carousel — moved up on mobile */}
              <div className="order-2 lg:hidden flex justify-center py-6 sm:py-8 w-full max-w-[340px] mx-auto relative z-20">
                <HeroCarousel products={bestSellers.slice(0, 4).filter(p => p.images?.length > 0)} />
              </div>

              <div className="order-3 text-center lg:text-left mt-2 lg:mt-0">
                <p className="text-[15px] sm:text-lg md:text-xl text-brand-dark-light/90 mb-8 md:mb-10 leading-relaxed max-w-[280px] sm:max-w-md mx-auto lg:mx-0 font-medium">
                  {cms.hero?.content || 'Soft fabrics, perfect fit, private delivery across Pakistan.'}
                </p>
                <div className="flex gap-3 max-w-[280px] sm:max-w-md mx-auto lg:mx-0 relative z-30 justify-center lg:justify-start">
                  <Link href={cms.hero_cta?.content || '/shop'} className="btn-primary text-sm sm:text-base px-6 py-3 rounded-xl shadow-[0_8px_25px_rgba(232,106,138,0.35)] hover:shadow-[0_12px_30px_rgba(232,106,138,0.45)] flex items-center justify-center gap-2 font-bold transform hover:-translate-y-1 transition-all duration-300 group">
                    {cms.hero_cta?.title || 'Shop Now'}
                    <HiArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Desktop Hero image carousel */}
            <div className="hidden lg:flex justify-end relative z-20">
              <HeroCarousel products={bestSellers.slice(0, 4).filter(p => p.images?.length > 0)} />
            </div>
          </div>

          {/* Stats strip — compact inline below carousel */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 pb-6 md:pb-14 lg:pb-16 text-brand-dark/80">
            <span className="flex items-center gap-1 text-xs sm:text-sm font-semibold"><span className="font-extrabold text-brand-dark">5,000+</span> Customers</span>
            <span className="w-px h-4 bg-brand-dark/20" />
            <span className="flex items-center gap-1 text-xs sm:text-sm font-semibold"><HiStar className="w-3.5 h-3.5 text-amber-400" /><span className="font-extrabold text-brand-dark">4.8</span> Rating</span>
          </div>
        </div>
      </section>

      {/* TRUST BADGES — 2x2 grid on mobile, 4 cols on desktop */}
      <section className="bg-white border-y border-gray-100">
        <div className="container-custom py-4 md:py-6">
          <div className="reveal grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-8">
            {[
              { icon: 'truck', title: 'Free Over Rs. 3,000' },
              { icon: 'shield', title: 'Cash on Delivery' },
              { icon: 'refresh', title: '7-Day Exchange' },
              { icon: 'lock', title: 'Discreet Packaging' },
            ].map((badge, i) => {
              const Icon = iconMap[badge.icon] || HiOutlineShieldCheck;
              return (
                <div key={i} className="flex items-center gap-2.5 sm:flex-col sm:text-center py-2 sm:py-2">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-brand-bg to-brand-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                  </div>
                  <p className="font-bold text-xs sm:text-sm text-brand-dark leading-tight">{badge.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="py-8 md:py-20 bg-white">
          <div className="container-custom">
            <div className="reveal text-center mb-6 md:mb-10">
              <p className="text-brand-primary font-medium text-xs sm:text-sm uppercase tracking-wider mb-1 md:mb-2">Categories</p>
              <h2 className="heading-2 text-brand-dark text-2xl sm:text-3xl lg:text-4xl">Shop by Category</h2>
            </div>
            <div className="reveal flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible sm:pb-0 md:gap-5">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/category/${cat.slug}`}
                  className="group relative flex-shrink-0 w-[70vw] sm:w-auto aspect-square bg-brand-bg rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 snap-start">
                  {cat.image ? (
                    <MediaImage src={cat.image} alt={cat.name} sizes="(max-width: 640px) 70vw, (max-width: 768px) 33vw, 16vw" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-secondary to-brand-primary" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3 md:p-4">
                    <h3 className="text-white font-bold text-sm sm:text-sm md:text-base leading-tight">{cat.name}</h3>
                    <span className="text-white/60 text-xs sm:text-xs md:text-sm mt-0.5 group-hover:text-white transition-colors flex items-center gap-1">
                      Shop Now <HiArrowRight className="w-2.5 h-2.5 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BEST SELLERS */}
      {bestSellers.length > 0 && (
        <section className="py-8 md:py-20 bg-brand-bg/50">
          <div className="container-custom">
            <div className="reveal flex items-end justify-between mb-5 md:mb-10">
              <div>
                <p className="text-brand-primary font-bold text-[10px] sm:text-sm uppercase tracking-widest mb-1 md:mb-2 flex items-center gap-1.5"><HiStar className="w-3.5 h-3.5 text-amber-400" /> Top Picks</p>
                <h2 className="heading-2 text-brand-dark text-2xl sm:text-3xl lg:text-4xl">Best Sellers</h2>
              </div>
              <Link href="/shop" className="hidden md:flex items-center gap-2 text-brand-dark font-medium hover:text-brand-dark-light transition-colors">
                View All <HiArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="reveal grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-5 md:gap-6">
              {bestSellers.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center mt-6 md:hidden">
              <Link href="/shop" className="btn-outline w-full font-semibold border-[2px] rounded-xl hover:bg-brand-primary hover:text-white">View All Products</Link>
            </div>
          </div>
        </section>
      )}

      {/* BENEFITS */}
      <section className="py-8 md:py-20 bg-white">
        <div className="container-custom">
          <div className="reveal grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
            <div className="text-center lg:text-left">
              <p className="text-brand-primary font-bold text-[10px] sm:text-sm uppercase tracking-widest mb-2 flex items-center justify-center lg:justify-start gap-1.5">Our Promise</p>
              <h2 className="heading-2 text-2xl sm:text-3xl lg:text-4xl text-brand-dark mb-4 lg:mb-6">{cms.benefits?.title || 'Why Choose Us'}</h2>
              <div className="max-w-[280px] sm:max-w-md mx-auto lg:mx-0">
                {cms.benefits?.content ? (
                  <div className="cms-content text-brand-dark-light/90 text-[13px] sm:text-base leading-relaxed line-clamp-4 sm:line-clamp-none" dangerouslySetInnerHTML={{ __html: cms.benefits.content }} />
                ) : (
                  <p className="text-brand-dark-light/90 text-[13px] sm:text-base leading-relaxed">Soft fabrics, perfect fit, and private delivery across Pakistan.</p>
                )}
                <Link href="/about" className="inline-flex items-center justify-center gap-2 text-brand-dark font-bold mt-4 sm:mt-8 hover:text-brand-primary transition-colors hover:translate-x-1 duration-300 border-b-2 border-brand-primary pb-1 group">
                  Learn More <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 mt-4 sm:mt-6 lg:mt-0 px-2 sm:px-0">
              {[
                { icon: 'scissors', title: 'Soft Fabrics', desc: 'Cotton-rich blends & premium lace' },
                { icon: 'maximize', title: 'Perfect Fit', desc: 'Available in all sizes' },
                { icon: 'wind', title: 'Breathable', desc: 'Light & airy, all day long' },
                { icon: 'package', title: 'Private Delivery', desc: 'Your privacy matters to us' },
              ].map((item, i) => {
                const benefitIconMap: Record<string, any> = { scissors: FiScissors, maximize: FiMaximize, wind: FiWind, package: FiPackage };
                const BenefitIcon = benefitIconMap[item.icon];
                return (
                <div key={i} className="bg-brand-bg/60 border border-brand-secondary/30 rounded-[1.5rem] p-4 sm:p-5 md:p-6 text-center hover:bg-white hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-[3rem] h-[3rem] sm:w-14 sm:h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-[0_4px_15px_rgba(43,43,43,0.06)] group-hover:shadow-[0_6px_20px_rgba(232,106,138,0.15)] transition-shadow">
                    <BenefitIcon className="w-6 h-6 sm:w-7 sm:h-7 text-brand-primary" />
                  </div>
                  <h4 className="font-bold text-brand-dark mb-1 text-xs sm:text-[15px] md:text-base leading-tight drop-shadow-sm">{item.title}</h4>
                  <p className="text-[10px] sm:text-xs md:text-sm text-brand-dark-light/80 font-medium leading-snug">{item.desc}</p>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="py-8 md:py-20 bg-brand-bg/30">
          <div className="container-custom">
            <div className="reveal flex items-end justify-between mb-5 md:mb-10">
              <div>
                <p className="text-brand-primary font-bold text-[10px] sm:text-sm uppercase tracking-widest mb-1 md:mb-2 flex items-center gap-1.5">New Arrivals</p>
                <h2 className="heading-2 text-brand-dark text-2xl sm:text-3xl lg:text-4xl">You May Like</h2>
              </div>
              <Link href="/shop" className="hidden md:flex items-center gap-2 text-brand-dark font-medium hover:text-brand-dark-light transition-colors">
                View All <HiArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="reveal grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-5 md:gap-6">
              {featured.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* REVIEWS */}
      {reviews.length > 0 && (
        <section className="py-8 md:py-20 bg-white">
          <div className="container-custom">
            <div className="reveal text-center mb-5 md:mb-10">
              <p className="text-brand-primary font-bold text-[10px] sm:text-sm uppercase tracking-widest mb-1 md:mb-2">Happy Customers</p>
              <h2 className="heading-2 text-brand-dark text-2xl sm:text-3xl lg:text-4xl">Customer Reviews</h2>
              <div className="flex items-center justify-center gap-0.5 mt-2" aria-label="Average rating 4.8 out of 5">
                {[...Array(5)].map((_, i) => (<HiStar key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" aria-hidden="true" />))}
                <span className="text-xs sm:text-sm text-gray-500 ml-2 font-medium">4.8/5</span>
              </div>
            </div>
            <div className="reveal grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="bg-white border border-gray-100 p-4 sm:p-5 md:p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-accent rounded-full flex items-center justify-center font-bold text-xs text-white">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-[13px] text-brand-dark leading-none">{review.name}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5 font-medium">Verified Buyer</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (<HiStar key={i} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`} />))}
                    </div>
                  </div>
                  <p className="text-gray-600 text-[13px] sm:text-sm leading-relaxed line-clamp-3">&ldquo;{review.comment}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA BANNER */}
      <section className="relative bg-gradient-to-br from-brand-primary via-brand-accent to-brand-primary/90 text-white overflow-hidden my-6 md:my-10 mx-4 md:mx-auto md:max-w-7xl rounded-3xl shadow-xl shadow-brand-primary/20">
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-20%] right-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-white rounded-full blur-[60px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-white rounded-full blur-[60px]" />
        </div>
        <div className="relative py-10 md:py-24 text-center px-5 z-10 w-full flex flex-col items-center">
          <p className="reveal text-white/90 text-[10px] md:text-sm font-bold uppercase tracking-[0.2em] mb-2 md:mb-5">New Collection</p>
          <h2 className="text-[1.65rem] sm:text-3xl md:text-5xl font-serif font-extrabold mb-3 md:mb-6 leading-tight drop-shadow-md max-w-xl mx-auto">{cms.cta_banner?.title || 'Treat Yourself Today'}</h2>
          <p className="text-white/80 mb-6 md:mb-10 max-w-md mx-auto text-[13px] sm:text-sm md:text-lg font-medium leading-relaxed">{cms.cta_banner?.content || 'Comfort meets style. Shop now.'}</p>
          <Link href="/shop" className="bg-white text-brand-primary w-full max-w-[260px] sm:max-w-xs px-6 py-3.5 sm:py-4 rounded-xl font-bold shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.2)] hover:bg-brand-bg transition-all duration-300 inline-flex items-center justify-center gap-2 text-[15px] sm:text-base md:text-lg transform hover:-translate-y-1 group mx-auto">
            Shop the Collection <HiArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* INSTAGRAM */}
      <section className="py-6 md:py-16 bg-brand-bg">
        <div className="container-custom text-center">
          <p className="text-brand-primary font-medium text-[10px] sm:text-sm uppercase tracking-wider mb-1 md:mb-2">Follow Us</p>
          <h2 className="heading-3 text-brand-dark mb-2 text-xl sm:text-2xl">@hiddenglow.pk</h2>
          <p className="text-gray-500 mb-6 text-sm">Style tips &amp; new arrivals on Instagram</p>
          {/* Product image grid as Instagram-style preview */}
          {(() => {
            const allProducts = [...bestSellers, ...featured];
            const instaImages = allProducts
              .filter(p => p.images && p.images.length > 0)
              .slice(0, 6)
              .map(p => ({ url: (p.images.find((i: any) => i.isPrimary) || p.images[0])?.url, name: p.name, slug: p.slug }))
              .filter(img => img.url);
            if (instaImages.length === 0) return null;
            return (
              <div className="reveal grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 mb-8">
                {instaImages.map((img, i) => (
                  <Link key={i} href={`/product/${img.slug}`} className="group relative aspect-square rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300">
                    <MediaImage src={img.url} alt={img.name} sizes="(max-width: 768px) 33vw, 16vw" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                    </div>
                  </Link>
                ))}
              </div>
            );
          })()}
          <a href="https://instagram.com/hiddenglow.pk" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2 px-8 py-3">
            Follow @hiddenglow.pk
          </a>
        </div>
      </section>
    </>
  );
}
