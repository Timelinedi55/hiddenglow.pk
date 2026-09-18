'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Product, ProductVariant } from '@/lib/types';
import { useCartStore } from '@/lib/store';
import { formatPrice, getDiscount } from '@/lib/utils';
import { trackEvent } from '@/lib/trackEvent';
import ProductCard from '@/components/ProductCard';
import { useSiteData } from '@/lib/SiteDataProvider';
import toast from 'react-hot-toast';
import { HiStar, HiOutlineTruck, HiOutlineShieldCheck, HiOutlineRefresh, HiChevronRight, HiChevronLeft, HiMinus, HiPlus, HiOutlineSearch, HiOutlineLockClosed, HiPlay } from 'react-icons/hi';
import { FiShare2, FiCheck, FiMessageCircle } from 'react-icons/fi';
import MediaImage from '@/components/MediaImage';

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

function getVideoEmbedUrl(url: string): { type: 'youtube' | 'vimeo' | 'direct'; embedUrl: string } | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  if (ytMatch) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0` };
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1` };
  return { type: 'direct', embedUrl: url };
}

export default function ProductPageClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { settings } = useSiteData();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [imageZoom, setImageZoom] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const galleryRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setSelectedImage(0);
    setSelectedVariant(null);
    setQuantity(1);
    setAddedToCart(false);

    api.get(`/products/slug/${slug}/full`).then(({ product: p, related: rel }) => {
      setProduct(p);
      setRelated(rel || []);
      if (p.variants?.length) setSelectedVariant(p.variants[0]);
      setLoading(false);
      trackEvent.viewProduct({ id: p.id, name: p.name, price: p.discountPrice || p.price, category: p.category?.name });
    }).catch(() => setLoading(false));
  }, [slug]);

  // Auto-set initial color when product has color variants
  useEffect(() => {
    if (!product) return;
    const variantColors = (product.variants || [])
      .filter((v: ProductVariant) => v.color)
      .map((v: ProductVariant) => v.color);
    if (variantColors.length > 0 && !selectedColor) {
      setSelectedColor(variantColors[0]);
    }
  }, [product]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Sticky mobile CTA: show when main CTA scrolls out of view */
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShowStickyCta(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [product]);

  const scrollToImage = useCallback((idx: number) => {
    setSelectedImage(idx);
    if (galleryRef.current) {
      galleryRef.current.scrollTo({ left: idx * galleryRef.current.clientWidth, behavior: 'smooth' });
    }
  }, []);

  const buildCartItem = () => {
    if (!product) return;
    if (product.variants?.length && !selectedVariant) {
      toast.error('Please select a size');
      return null;
    }
    const primaryImage = product.images?.find((i: any) => i.isPrimary) || product.images?.[0];
    // Use variant image if available, otherwise primary product image
    const cartImage = selectedVariant?.image || primaryImage?.url || '';
    return {
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      price: selectedVariant?.variantPrice || product.discountPrice || product.price,
      size: selectedVariant?.size,
      color: selectedVariant?.color,
      quantity,
      image: cartImage,
      slug: product.slug,
    };
  };

  const handleAddToCart = () => {
    const cartItem = buildCartItem();
    if (!cartItem) return;
    addItem(cartItem);
    trackEvent.addToCart({ id: cartItem.productId, name: cartItem.name, price: cartItem.price, quantity: cartItem.quantity, variant: cartItem.size });
    setAddedToCart(true);
    toast.success('Added to cart!');
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    const cartItem = buildCartItem();
    if (!cartItem) return;
    addItem(cartItem);
    router.push('/checkout');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="bg-white">
        <div className="container-custom py-3">
          <div className="skeleton h-4 w-48 rounded mb-4" />
        </div>
        <div className="container-custom pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
            <div className="lg:col-span-7">
              <div className="flex gap-3">
                <div className="hidden lg:flex flex-col gap-2 w-20">
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton aspect-square rounded-xl" />)}
                </div>
                <div className="flex-1"><div className="skeleton aspect-square rounded-2xl" /></div>
              </div>
            </div>
            <div className="lg:col-span-5 py-2">
              <div className="skeleton h-4 w-24 mb-4 rounded" />
              <div className="skeleton h-10 w-4/5 mb-3 rounded" />
              <div className="skeleton h-5 w-32 mb-4 rounded" />
              <div className="skeleton h-8 w-48 mb-6 rounded" />
              <div className="skeleton h-4 w-full mb-2 rounded" />
              <div className="skeleton h-4 w-3/4 mb-8 rounded" />
              <div className="skeleton h-12 w-full mb-3 rounded-xl" />
              <div className="skeleton h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!product) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-6">
            <HiOutlineSearch className="w-8 h-8 text-brand-dark-light" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-brand-dark mb-3">Product Not Found</h1>
          <p className="text-gray-500 mb-8">This product may have been removed or the link is incorrect.</p>
          <Link href="/shop" className="btn-primary px-8 py-3">Browse All Products</Link>
        </div>
      </div>
    );
  }

  const discount = getDiscount(product.price, product.discountPrice);
  const approvedReviews = product.reviews?.filter((r: any) => r.isApproved) || [];
  const avgRating = approvedReviews.length > 0 ? approvedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / approvedReviews.length : 0;
  const baseImages = product.images || [];
  const maxQuantity = selectedVariant ? selectedVariant.stock : 99;

  // Color & size logic: extract unique colors and sizes
  const colors = Array.from(
    new Map(
      (product.variants || [])
        .filter((v: ProductVariant) => v.color)
        .map((v: ProductVariant) => [v.color, { color: v.color, colorCode: v.colorCode }])
    ).values()
  ) as { color: string; colorCode: string | null }[];

  // Filter variants by selected color (or all if no colors)
  const filteredVariants = colors.length > 0
    ? (product.variants || []).filter((v: ProductVariant) => v.color === selectedColor)
    : (product.variants || []);

  const sizes = Array.from(new Set(filteredVariants.map((v: ProductVariant) => v.size)));

  // Build gallery: if selected variant has an image, show it first, then product images
  const images = (() => {
    if (selectedVariant?.image) {
      const variantImg = { id: -1, url: selectedVariant.image, sortOrder: -1, isPrimary: false };
      return [variantImg, ...baseImages];
    }
    return baseImages;
  })();

  // When color changes, auto-select the first available variant for that color
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const firstVariant = (product.variants || []).find(
      (v: ProductVariant) => v.color === color && v.stock > 0
    ) || (product.variants || []).find((v: ProductVariant) => v.color === color);
    if (firstVariant) {
      setSelectedVariant(firstVariant);
      // If variant has its own image, jump to it (index 0 since it's prepended)
      if (firstVariant.image) {
        setSelectedImage(0);
      }
    }
  };

  // When size changes, find matching variant for color+size
  const handleSizeChange = (size: string) => {
    const variant = colors.length > 0
      ? (product.variants || []).find((v: ProductVariant) => v.size === size && v.color === selectedColor)
      : (product.variants || []).find((v: ProductVariant) => v.size === size);
    if (variant) {
      setSelectedVariant(variant);
      if (variant.image) setSelectedImage(0);
    }
  };

  const whatsappNumber = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : '';

  return (
    <div className="bg-white relative z-0 isolate pb-20 lg:pb-0">
      {/* Breadcrumb */}
      <div className="container-custom py-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-gray-400 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href="/" className="hover:text-brand-dark transition-colors">Home</Link>
          <HiChevronRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          <Link href="/shop" className="hover:text-brand-dark transition-colors">Shop</Link>
          {product.category && (
            <>
              <HiChevronRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              <Link href={`/category/${product.category.slug}`} className="hover:text-brand-dark transition-colors">{product.category.name}</Link>
            </>
          )}
          <HiChevronRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          <span className="text-brand-dark font-medium truncate max-w-[120px] sm:max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* ───── MAIN PRODUCT SECTION ───── */}
      <div className="container-custom pb-8 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-10">

          {/* ───── IMAGE GALLERY ───── */}
          <div className="lg:col-span-7">

            {/* MOBILE: Full-width swipe carousel */}
            <div className="lg:hidden relative -mx-4 sm:-mx-6 overflow-hidden">
              <div
                ref={galleryRef}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const idx = Math.round(el.scrollLeft / el.clientWidth);
                  if (idx !== selectedImage) setSelectedImage(idx);
                }}
              >
                {images.length > 0 ? images.map((img: any, i: number) => (
                  <div key={img.id} className="flex-shrink-0 w-full snap-center">
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      <MediaImage
                        src={img.url}
                        alt={`${product.name} - Image ${i + 1}`}
                        sizes="100vw"
                        priority={i === 0}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )) : (
                  <div className="w-full aspect-square bg-gray-50 flex items-center justify-center text-gray-300">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
                {/* Video slide in mobile carousel */}
                {product.videoUrl && (() => {
                  const vData = getVideoEmbedUrl(product.videoUrl);
                  if (!vData) return null;
                  return (
                    <div className="flex-shrink-0 w-full snap-center">
                      <div className="aspect-square bg-black relative overflow-hidden flex items-center justify-center">
                        {showVideo ? (
                          vData.type === 'direct' ? (
                            <video src={vData.embedUrl} controls autoPlay playsInline className="w-full h-full object-contain" />
                          ) : (
                            <iframe src={vData.embedUrl} className="w-full h-full" allowFullScreen allow="autoplay" title="Product video" />
                          )
                        ) : (
                          <button onClick={() => setShowVideo(true)} className="absolute inset-0 flex items-center justify-center bg-brand-dark/30 group">
                            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <HiPlay className="w-8 h-8 text-brand-primary ml-1" />
                            </div>
                            <span className="absolute bottom-4 text-white text-sm font-semibold">Watch Video</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Badges */}
              {discount > 0 && (
                <span className="absolute top-3 left-4 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full z-10 shadow-sm">
                  -{discount}%
                </span>
              )}
              {product.isBestSeller && (
                <span className="absolute top-3 right-4 bg-brand-dark text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider z-10 shadow-sm">
                  Best Seller
                </span>
              )}

              {/* Image counter pill */}
              {(images.length + (product.videoUrl ? 1 : 0)) > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full z-10">
                  {selectedImage + 1} / {images.length + (product.videoUrl ? 1 : 0)}
                </div>
              )}

              {/* Share now in product info section */}
            </div>

            {/* Mobile dots */}
            {(images.length + (product.videoUrl ? 1 : 0)) > 1 && (
              <div className="flex justify-center gap-1.5 mt-3 lg:hidden" role="tablist" aria-label="Product images">
                {[...images, ...(product.videoUrl ? [{ id: 'video' }] : [])].map((_: any, i: number) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={selectedImage === i}
                    aria-label={i === images.length && product.videoUrl ? 'Watch video' : `View image ${i + 1}`}
                    onClick={() => scrollToImage(i)}
                    className={`rounded-full transition-all duration-300 ${selectedImage === i ? 'bg-brand-primary w-6 h-2' : 'bg-gray-200 w-2 h-2 hover:bg-gray-300'}`}
                  />
                ))}
              </div>
            )}

            {/* DESKTOP: Vertical thumbnails + Main image */}
            <div className="hidden lg:flex gap-3">
              {/* Vertical Thumbnails */}
              {(images.length > 1 || product.videoUrl) && (
                <div className="flex flex-col gap-2 w-[72px] flex-shrink-0 max-h-[600px] overflow-y-auto scrollbar-hide">
                  {images.map((img: any, i: number) => (
                    <button
                      key={img.id}
                      onClick={() => { setSelectedImage(i); setShowVideo(false); }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                        selectedImage === i && !showVideo
                          ? 'border-brand-primary ring-1 ring-brand-primary/30 opacity-100'
                          : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-200'
                      }`}
                    >
                      <MediaImage src={img.url} alt={`View ${i + 1}`} sizes="72px" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {product.videoUrl && (
                    <button
                      onClick={() => setShowVideo(true)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 bg-brand-dark/10 flex items-center justify-center ${
                        showVideo
                          ? 'border-brand-primary ring-1 ring-brand-primary/30 opacity-100'
                          : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-200'
                      }`}
                    >
                      <HiPlay className="w-7 h-7 text-brand-primary" />
                    </button>
                  )}
                </div>
              )}

              {/* Main Image / Video */}
              <div className="flex-1 relative">
                {showVideo && product.videoUrl ? (
                  <div className="aspect-square bg-black rounded-2xl overflow-hidden relative">
                    {(() => {
                      const vData = getVideoEmbedUrl(product.videoUrl);
                      if (!vData) return null;
                      return vData.type === 'direct' ? (
                        <video src={vData.embedUrl} controls autoPlay playsInline className="w-full h-full object-contain" />
                      ) : (
                        <iframe src={vData.embedUrl} className="w-full h-full" allowFullScreen allow="autoplay" title="Product video" />
                      );
                    })()}
                  </div>
                ) : (
                <div
                  className={`aspect-square bg-gray-50 rounded-2xl overflow-hidden relative cursor-zoom-in group ${imageZoom ? 'cursor-zoom-out' : ''}`}
                  onClick={() => setImageZoom(!imageZoom)}
                >
                  {images.length > 0 ? (
                    <MediaImage
                      src={images[selectedImage]?.url}
                      alt={product.name}
                      sizes="(max-width:1024px) 100vw, 55vw"
                      priority
                      className={`w-full h-full object-cover transition-transform duration-500 ${imageZoom ? 'scale-150' : 'group-hover:scale-[1.03]'}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}

                  {/* Nav arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(Math.max(0, selectedImage - 1)); }}
                        aria-label="Previous image"
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all ${selectedImage === 0 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <HiChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(Math.min(images.length - 1, selectedImage + 1)); }}
                        aria-label="Next image"
                        className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all ${selectedImage === images.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <HiChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Badges */}
                  {discount > 0 && (
                    <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                      -{discount}%
                    </span>
                  )}
                  {product.isBestSeller && (
                    <span className="absolute top-4 right-4 bg-brand-dark text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                      Best Seller
                    </span>
                  )}
                </div>
                )}
              </div>
            </div>
          </div>

          {/* ───── PRODUCT INFO ───── */}
          <div className="lg:col-span-5 lg:py-1">
            <div className="lg:sticky lg:top-24 bg-white rounded-2xl lg:p-0">
              {/* Category */}
              <div className="flex items-center justify-between mb-2">
                {product.category ? (
                  <Link href={`/category/${product.category.slug}`} className="text-xs font-semibold text-brand-primary uppercase tracking-wider hover:text-brand-accent transition-colors">
                    {product.category.name}
                  </Link>
                ) : <span />}
              </div>

              {/* Product Title + Share */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-xl sm:text-2xl lg:text-[28px] font-serif font-bold text-brand-dark leading-tight">
                  {product.name}
                </h1>
                <button onClick={handleShare} className="flex-shrink-0 p-2 text-gray-400 hover:text-brand-dark rounded-full hover:bg-gray-50 transition-all mt-0.5" aria-label="Share product">
                  <FiShare2 className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* Rating */}
              <div className="flex items-center mb-4">
                {approvedReviews.length > 0 ? (
                  <button onClick={() => setActiveTab('reviews')} className="flex items-center gap-2 group">
                    <div className="flex gap-0.5" aria-label={`${avgRating.toFixed(1)} out of 5 stars`}>
                      {[...Array(5)].map((_, i) => (
                        <HiStar key={i} aria-hidden="true" className={`w-4 h-4 ${i < Math.round(avgRating) ? 'text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 group-hover:text-brand-dark transition-colors">
                      {avgRating.toFixed(1)} ({approvedReviews.length} review{approvedReviews.length > 1 ? 's' : ''})
                    </span>
                  </button>
                ) : <span />}
              </div>

              {/* Price */}
              <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-5">
                {(() => {
                  const effectivePrice = selectedVariant?.variantPrice || product.discountPrice || product.price;
                  const originalPrice = selectedVariant?.variantPrice ? product.price : (product.discountPrice ? product.price : null);
                  const effectiveDiscount = originalPrice ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) : 0;
                  return (
                    <>
                      <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-dark">{formatPrice(effectivePrice)}</span>
                      {originalPrice && originalPrice > effectivePrice && (
                        <>
                          <span className="text-sm sm:text-base text-gray-400 line-through">{formatPrice(originalPrice)}</span>
                          <span className="inline-flex items-center bg-red-50 text-red-600 text-[11px] sm:text-xs font-bold px-2 py-1 rounded-md">
                            SAVE {effectiveDiscount}%
                          </span>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Stock warning */}
              {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock < 10 && (
                <div className="flex items-center gap-2 mb-4 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium">Only {selectedVariant.stock} left &mdash; order soon</span>
                </div>
              )}

              {/* Short Description */}
              {product.shortDescription && (
                <p className="text-gray-600 text-sm leading-relaxed mb-5">{product.shortDescription}</p>
              )}

              <div className="h-px bg-gray-100 mb-5" />

              {/* Color Selector */}
              {colors.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-brand-dark">Select Color</h3>
                    {selectedColor && (
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{selectedColor}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {colors.map(({ color, colorCode }) => {
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={color}
                          onClick={() => handleColorChange(color)}
                          title={color}
                          className={`relative rounded-full transition-all duration-200 ${
                            isSelected
                              ? 'ring-2 ring-brand-primary ring-offset-2'
                              : 'ring-1 ring-gray-200 hover:ring-gray-400'
                          }`}
                        >
                          {colorCode ? (
                            <span
                              className="block w-8 h-8 rounded-full border border-gray-100"
                              style={{ backgroundColor: colorCode }}
                            />
                          ) : (
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
                              {color.charAt(0).toUpperCase()}
                            </span>
                          )}
                          {isSelected && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <FiCheck className={`w-4 h-4 ${colorCode && isLightColor(colorCode) ? 'text-gray-800' : 'text-white'}`} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {sizes.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-brand-dark">Select Size</h3>
                    {selectedVariant && (
                      <div className="flex items-center gap-2">
                        {selectedVariant.weight && <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{selectedVariant.weight}</span>}
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{selectedVariant.size}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size: string) => {
                      const variant = filteredVariants.find((v: any) => v.size === size);
                      const isSelected = selectedVariant?.size === size && (colors.length === 0 || selectedVariant?.color === selectedColor);
                      const outOfStock = variant && variant.stock <= 0;
                      return (
                        <button
                          key={size}
                          onClick={() => !outOfStock && handleSizeChange(size)}
                          disabled={outOfStock}
                          className={`min-w-[48px] h-10 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isSelected
                              ? 'bg-brand-dark text-white shadow-md ring-2 ring-brand-dark/20'
                              : outOfStock
                              ? 'bg-gray-50 text-gray-300 cursor-not-allowed line-through border border-gray-100'
                              : 'bg-white text-brand-dark border border-gray-200 hover:border-brand-dark hover:shadow-sm'
                          }`}
                        >
                          {size}
                          {variant?.variantPrice && !outOfStock && (
                            <span className="block text-[10px] font-normal opacity-70">{formatPrice(variant.variantPrice)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedVariant?.sku && (
                    <p className="text-[11px] text-gray-400 mt-2">SKU: {selectedVariant.sku}</p>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-brand-dark mb-3">Quantity</h3>
                <div className="inline-flex items-center bg-gray-50 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-brand-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-l-lg hover:bg-gray-100"
                  >
                    <HiMinus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center font-semibold text-sm text-brand-dark select-none">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                    aria-label="Increase quantity"
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-brand-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded-r-lg hover:bg-gray-100"
                  >
                    <HiPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div ref={ctaRef} className="flex flex-col gap-3 mb-4">
                <button
                  onClick={handleAddToCart}
                  className={`w-full py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-300 flex items-center justify-center gap-2 ${
                    addedToCart
                      ? 'bg-green-500 text-white'
                      : 'bg-brand-primary text-white hover:bg-brand-primary/90 active:scale-[0.98] shadow-lg shadow-brand-primary/20'
                  }`}
                >
                  {addedToCart ? (
                    <><FiCheck className="w-5 h-5" /> Added to Cart</>
                  ) : (
                    'Add to Cart'
                  )}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="w-full py-3.5 rounded-xl font-semibold text-[15px] border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300 active:scale-[0.98]"
                >
                  Buy Now
                </button>
              </div>

              {/* WhatsApp Order */}
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi! I'm interested in ${product.name}${selectedVariant ? ` (Size: ${selectedVariant.size})` : ''} - ${window?.location?.href || ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors mb-6"
              >
                <FiMessageCircle className="w-4 h-4" />
                Order via WhatsApp
              </a>

              {/* Trust Badges */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                      <HiOutlineTruck className="w-4 h-4 text-brand-dark" />
                    </div>
                    <span className="text-[11px] text-gray-600 leading-tight">{(selectedVariant?.variantPrice || product.discountPrice || product.price) >= 3000 ? 'Free Delivery' : 'Free delivery over Rs. 3,000'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                      <HiOutlineShieldCheck className="w-4 h-4 text-brand-dark" />
                    </div>
                    <span className="text-[11px] text-gray-600 leading-tight">Cash on<br/>Delivery</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                      <HiOutlineRefresh className="w-4 h-4 text-brand-dark" />
                    </div>
                    <span className="text-[11px] text-gray-600 leading-tight">7-day easy<br/>exchange</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                      <HiOutlineLockClosed className="w-4 h-4 text-brand-dark" />
                    </div>
                    <span className="text-[11px] text-gray-600 leading-tight">Discreet<br/>packaging</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-2 text-[12px] text-gray-500">
                    <HiOutlineTruck className="w-3.5 h-3.5" />
                    <span>Delivery in <strong className="text-brand-dark">2-3 days</strong> (major cities) &middot; 3-5 days (other areas)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───── TABS: Description & Reviews ───── */}
      <div className="border-t border-gray-100 bg-white">
        <div className="container-custom py-8 md:py-12">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-md mb-8">
            <button
              onClick={() => setActiveTab('description')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'description' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'reviews' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Reviews {approvedReviews.length > 0 && `(${approvedReviews.length})`}
            </button>
          </div>

          {activeTab === 'description' && product.description && (
            <div className="max-w-3xl">
              <div className="cms-content text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>
          )}
          {activeTab === 'description' && !product.description && (
            <p className="text-gray-400 text-sm">No additional details available for this product.</p>
          )}

          {activeTab === 'reviews' && approvedReviews.length > 0 && (
            <div>
              {/* Review summary bar */}
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                <div className="text-center">
                  <div className="text-4xl font-bold text-brand-dark mb-1">{avgRating.toFixed(1)}</div>
                  <div className="flex gap-0.5 justify-center mb-1">
                    {[...Array(5)].map((_, i) => (
                      <HiStar key={i} aria-hidden="true" className={`w-4 h-4 ${i < Math.round(avgRating) ? 'text-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{approvedReviews.length} review{approvedReviews.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex-1 max-w-xs">
                  {[5,4,3,2,1].map((star) => {
                    const count = approvedReviews.filter((r: any) => r.rating === star).length;
                    const pct = approvedReviews.length > 0 ? (count / approvedReviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 w-3">{star}</span>
                        <HiStar className="w-3 h-3 text-amber-400 flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-6">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                {approvedReviews.map((review: any) => (
                  <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white text-xs font-bold">
                          {review.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-brand-dark block leading-none">{review.name}</span>
                          <span className="text-[10px] text-gray-400">Verified Buyer</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <HiStar key={i} aria-hidden="true" className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'reviews' && approvedReviews.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-1">No reviews yet</p>
              <p className="text-gray-300 text-xs">Be the first to review this product</p>
            </div>
          )}
        </div>
      </div>

      {/* ───── RELATED PRODUCTS ───── */}
      {related.length > 0 && (
        <section className="border-t border-gray-100 py-10 md:py-14 bg-gray-50 overflow-hidden">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-serif font-bold text-brand-dark">You May Also Like</h2>
              <Link href={product.category ? `/category/${product.category.slug}` : '/shop'} className="text-sm text-brand-primary hover:text-brand-accent font-medium transition-colors hidden sm:block">
                View All &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-5 md:gap-6">
              {related.filter((r: any) => r.id !== product.id).slice(0, 4).map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky Mobile CTA */}
      <div
        className={`fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-4 py-3 transition-transform duration-300 lg:hidden ${
          showStickyCta ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-brand-dark truncate">{product.name}</p>
            <p className="text-sm font-bold text-brand-primary">{formatPrice(selectedVariant?.variantPrice || product.discountPrice || product.price)}</p>
          </div>
          <button
            onClick={handleAddToCart}
            className={`flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              addedToCart
                ? 'bg-green-500 text-white'
                : 'bg-brand-primary text-white active:scale-[0.98] shadow-lg shadow-brand-primary/20'
            }`}
          >
            {addedToCart ? 'Added!' : 'Add to Cart'}
          </button>
        </div>
      </div>

    </div>
  );
}
