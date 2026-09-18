'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant } from '@/lib/types';
import { formatPrice, getDiscount } from '@/lib/utils';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { HiStar, HiOutlineShoppingBag, HiOutlineLightningBolt } from 'react-icons/hi';
import { FiImage } from 'react-icons/fi';
import MediaImage from '@/components/MediaImage';

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}

export default function ProductCard({ product }: { product: Product }) {
  const images = (product.images || []).sort((a, b) => a.sortOrder - b.sortOrder);
  const primaryImage = images.find((i) => i.isPrimary) || images[0];
  const discount = getDiscount(product.price, product.discountPrice);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  // Media carousel state (images + optional video)
  const hasVideo = !!product.videoUrl;
  const totalSlides = images.length + (hasVideo ? 1 : 0);
  const [currentSlide, setCurrentSlide] = useState(hasVideo ? 0 : 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-slide every 3s (only when multiple slides, not hovered)
  useEffect(() => {
    if (totalSlides <= 1) return;
    if (isHovered) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [totalSlides, isHovered]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 25) {
      setCurrentSlide((prev) => diff > 0 ? Math.min(prev + 1, totalSlides - 1) : Math.max(prev - 1, 0));
    }
  }, [totalSlides]);

  // Extract unique colors from variants
  const colors = (product.variants || [])
    .filter((v: ProductVariant) => v.colorCode && v.isActive)
    .reduce((acc: { color: string; code: string }[], v: ProductVariant) => {
      if (!acc.some((c) => c.code === v.colorCode)) {
        acc.push({ color: v.color, code: v.colorCode! });
      }
      return acc;
    }, [])
    .slice(0, 4);

  // Extract unique sizes from variants
  const sizes = Array.from(
    new Set(
      (product.variants || [])
        .filter((v: ProductVariant) => v.size && v.isActive)
        .map((v: ProductVariant) => v.size)
    )
  ).slice(0, 4);

  // Check low stock
  const totalStock = (product.variants || [])
    .filter((v: ProductVariant) => v.isActive)
    .reduce((sum: number, v: ProductVariant) => sum + (v.stock || 0), 0);
  const isLowStock = totalStock > 0 && totalStock <= 10;

  // Review stats
  const reviewCount = product.reviews?.length || 0;
  const avgRating = reviewCount > 0
    ? product.reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;

  const getVideoId = (url: string): string | null => {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]+)/);
    return m ? m[1] : null;
  };

  const cartItem = {
    productId: product.id,
    variantId: product.variants?.[0]?.id,
    name: product.name,
    price: product.discountPrice || product.price,
    size: product.variants?.[0]?.size,
    color: product.variants?.[0]?.color,
    quantity: 1,
    image: primaryImage?.url || '',
    slug: product.slug,
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(cartItem);
    toast.success(`${product.name} added to cart!`, { icon: '🛍️' });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(cartItem);
    router.push('/checkout');
  };

  // Determine which slide index is a video (video shows first if present)
  const videoSlideIndex = hasVideo ? 0 : -1;
  const getImageIndex = (slideIndex: number) => hasVideo ? slideIndex - 1 : slideIndex;

  return (
    <div className="group block">
      <Link href={`/product/${product.slug}`} className="block">
        <div
          className="relative mb-2 aspect-square overflow-hidden rounded-2xl bg-brand-bg shadow-[0_8px_30px_rgba(43,43,43,0.06)] transition-shadow duration-300 group-hover:shadow-[0_16px_40px_rgba(43,43,43,0.12)]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'pan-y' }}
        >
          {/* Slides container */}
          <div className="relative w-full h-full">
            {totalSlides > 0 ? (
              <>
                {/* Video slide (first if exists) */}
                {hasVideo && (
                  <div className={`absolute inset-0 transition-opacity duration-500 ${currentSlide === videoSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    {product.videoUrl && (() => {
                      const videoId = getVideoId(product.videoUrl!);
                      if (videoId) {
                        return (
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=${currentSlide === videoSlideIndex ? 1 : 0}&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
                            className="w-full h-full object-cover"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            title={product.name}
                          />
                        );
                      }
                      // Direct video URL
                      return (
                        <video
                          ref={videoRef}
                          src={product.videoUrl!}
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      );
                    })()}
                  </div>
                )}

                {/* Image slides */}
                {images.map((img, i) => {
                  const slideIdx = hasVideo ? i + 1 : i;
                  return (
                    <div key={img.id} className={`absolute inset-0 transition-opacity duration-500 ${currentSlide === slideIdx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                      <MediaImage
                        src={img.url}
                        alt={product.name}
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-brand-secondary/30 to-brand-bg">
                <FiImage className="w-10 h-10 text-brand-dark-light/30" />
              </div>
            )}
          </div>

          {/* Dot indicators */}
          {totalSlides > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentSlide(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-brand-primary w-5 shadow-sm' : 'w-1.5 bg-white/60'}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Badges — top row */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between pointer-events-none z-20">
            <div className="flex flex-col gap-1.5">
              {discount > 0 && (
                <span className="bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                  {discount}% Off
                </span>
              )}
              {isLowStock && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm uppercase tracking-wide">
                  Low Stock
                </span>
              )}
            </div>
            {product.isBestSeller && (
              <span className="bg-brand-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                Best Seller
              </span>
            )}
            {!product.isBestSeller && product.isFeatured && (
              <span className="bg-brand-accent text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                New
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Product info */}
      <div className="px-0.5">
        {/* Ratings */}
        {avgRating > 0 && (
          <div className="flex items-center gap-1 mb-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <HiStar
                  key={star}
                  className={`w-3.5 h-3.5 ${star <= Math.round(avgRating) ? 'text-amber-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-[11px] text-brand-dark-light/60">({reviewCount})</span>
          </div>
        )}

        <Link href={`/product/${product.slug}`}>
          <h3 className="font-medium text-[13px] md:text-sm text-brand-dark group-hover:text-brand-accent transition-colors line-clamp-2 leading-snug mb-1">
            {product.name}
          </h3>
        </Link>

        {/* Size & Color Swatches */}
        {colors.length > 1 && (
          <div className="flex items-center gap-1 mb-1.5">
            {colors.map((c, i) => (
              <span
                key={i}
                title={c.color}
                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                  isLightColor(c.code) ? 'border-gray-300' : 'border-white'
                } shadow-sm`}
                style={{ backgroundColor: c.code }}
              />
            ))}
            {(product.variants || []).filter((v: ProductVariant) => v.colorCode && v.isActive).length > 5 && (
              <span className="text-[10px] text-brand-dark-light/50">+more</span>
            )}
          </div>
        )}
        {colors.length <= 1 && sizes.length > 0 && (
          <div className="flex items-center gap-1 mb-1.5 flex-wrap">
            {sizes.map((s, i) => (
              <span
                key={i}
                className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Price + Discount */}
        <div className="flex items-center gap-2 mb-2">
          {product.discountPrice ? (
            <>
              <span className="font-bold text-sm md:text-[15px] text-brand-accent">{formatPrice(product.discountPrice)}</span>
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                Save {formatPrice(product.price - product.discountPrice)}
              </span>
            </>
          ) : (
            <span className="font-bold text-sm md:text-[15px] text-brand-dark">{formatPrice(product.price)}</span>
          )}
        </div>

        {/* Dual buttons: Add to Cart + Buy Now */}
        <div className="flex gap-2">
          <button
            onClick={handleQuickAdd}
            className="flex-1 flex items-center justify-center gap-1.5 bg-brand-dark text-white text-xs font-semibold py-2 rounded-xl
                       hover:bg-brand-primary active:scale-[0.98] transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label={`Add ${product.name} to cart`}
          >
            <HiOutlineShoppingBag className="w-3.5 h-3.5" />
            Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            className="flex-1 flex items-center justify-center gap-1.5 bg-brand-primary text-white text-xs font-semibold py-2 rounded-xl
                       hover:bg-brand-accent active:scale-[0.98] transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
            aria-label={`Buy ${product.name} now`}
          >
            <HiOutlineLightningBolt className="w-3.5 h-3.5" />
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
