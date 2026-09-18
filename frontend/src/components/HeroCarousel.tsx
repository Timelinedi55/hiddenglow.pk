'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import MediaImage from './MediaImage';
import { Product } from '@/lib/types';

interface HeroCarouselProps {
  products: Product[];
}

export default function HeroCarousel({ products }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((idx: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(idx);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);

  useEffect(() => {
    if (products.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [products.length]);

  if (!products.length) return null;

  const getImg = (p: Product) => (p.images.find((i: any) => i.isPrimary) || p.images[0])?.url;

  return (
    <div className="relative w-full max-w-[280px] sm:max-w-xs md:max-w-md lg:max-w-lg mx-auto lg:mx-0">
      <div className="relative">
        {/* Decorative glow */}
        <div className="absolute -inset-4 bg-gradient-to-br from-brand-primary/20 via-brand-accent/10 to-brand-secondary/20 rounded-[2rem] blur-2xl opacity-70 animate-pulse" aria-hidden="true" />

        {/* Image frame */}
        <div className="relative aspect-square rounded-2xl lg:rounded-3xl overflow-hidden ring-1 ring-white/20 shadow-[0_20px_60px_rgba(232,106,138,0.15)]">
          {products.map((product, i) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                i === current
                  ? 'opacity-100 scale-100 z-10'
                  : 'opacity-0 scale-105 z-0 pointer-events-none'
              }`}
            >
              <MediaImage
                src={getImg(product)}
                alt={product.name}
                sizes="(max-width: 640px) 340px, (max-width: 768px) 384px, (max-width: 1024px) 448px, 512px"
                priority={i === 0}
                className="w-full h-full object-cover"
              />
              {/* Product name overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent p-4 z-20">
                <p className="text-white text-sm font-medium truncate">{product.name}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Floating badge — Best Sellers */}
        <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-brand-primary text-white rounded-xl shadow-xl px-3 py-2 sm:px-4 sm:py-2.5 z-30">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest">Best Sellers</p>
        </div>
      </div>

      {/* Dots navigation */}
      {products.length > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`View product ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'bg-brand-primary w-7 h-2'
                  : 'bg-brand-secondary/50 w-2 h-2 hover:bg-brand-primary/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
