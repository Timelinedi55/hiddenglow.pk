'use client';

import { useState, useEffect, useCallback } from 'react';
import MediaImage from './MediaImage';

interface HeroSlide {
  image: string;
  alt?: string;
}

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((idx: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(idx);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);

  // Auto-advance every 4s
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto lg:mx-0">
      {/* Main image container with decorative frame */}
      <div className="relative">
        {/* Decorative glow behind image */}
        <div className="absolute -inset-4 bg-gradient-to-br from-brand-primary/30 via-brand-accent/20 to-brand-secondary/30 rounded-[2rem] blur-2xl opacity-60" aria-hidden="true" />

        {/* Image frame */}
        <div className="relative aspect-square rounded-2xl lg:rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                i === current
                  ? 'opacity-100 scale-100 z-10'
                  : 'opacity-0 scale-105 z-0'
              }`}
            >
              <MediaImage
                src={slide.image}
                alt={slide.alt || `Hidden Glow Collection ${i + 1}`}
                sizes="(max-width: 640px) 340px, (max-width: 768px) 384px, (max-width: 1024px) 448px, 512px"
                priority={i === 0}
                className="w-full h-full object-cover"
              />
            </div>
          ))}

          {/* Subtle bottom gradient for dots readability */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent z-20 pointer-events-none" />
        </div>

        {/* Floating badge — bottom left */}
        <div className="absolute -bottom-3 -left-2 sm:-bottom-4 sm:-left-3 bg-white rounded-xl shadow-xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 z-30 border border-gray-100/50">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-brand-bg rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <div>
            <p className="font-semibold text-[11px] sm:text-xs text-brand-dark leading-tight">Private Packaging</p>
            <p className="text-[10px] sm:text-[11px] text-gray-400 leading-tight">Discreet delivery</p>
          </div>
        </div>

        {/* Floating badge — top right */}
        <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-brand-primary text-white rounded-xl shadow-xl px-3 py-2 sm:px-4 sm:py-2.5 z-30">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest">New Collection</p>
        </div>
      </div>

      {/* Dots navigation */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`View slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'bg-brand-primary w-7 h-2'
                  : 'bg-white/25 w-2 h-2 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
