'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { useSiteData } from '@/lib/SiteDataProvider';
import ProductCard from '@/components/ProductCard';
import { HiChevronRight, HiOutlineSearch, HiOutlineAdjustments, HiX } from 'react-icons/hi';

function ShopPageContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const { categories } = useSiteData();
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>(searchParams.get('category') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [onSale, setOnSale] = useState(false);
  const [priceRange, setPriceRange] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '12');
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    if (debouncedSearch) params.set('search', debouncedSearch);
    api.get(`/products?${params.toString()}`).then((data) => {
      let filtered = data.items as Product[];
      // Client-side filtering for on sale and price range
      if (onSale) {
        filtered = filtered.filter((p) => p.discountPrice && p.discountPrice < p.price);
      }
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        filtered = filtered.filter((p) => {
          const price = p.discountPrice || p.price;
          if (max) return price >= min && price <= max;
          return price >= min;
        });
      }
      setProducts(filtered);
      setTotal(onSale || priceRange ? filtered.length : data.total);
      setTotalPages(onSale || priceRange ? 1 : data.totalPages);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, category, sort, debouncedSearch, onSale, priceRange]);

  const activeCategory = categories.find((c) => String(c.id) === category);
  const activeFilterCount = [onSale, priceRange, category].filter(Boolean).length;

  const clearAllFilters = () => {
    setCategory('');
    setOnSale(false);
    setPriceRange('');
    setSearch('');
    setPage(1);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-bg/50 py-10 md:py-14">
        <div className="container-custom">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-brand-dark">Home</Link>
            <HiChevronRight className="w-3 h-3" />
            <span className="text-brand-dark font-medium">{activeCategory ? activeCategory.name : 'All Products'}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark">
            {activeCategory ? activeCategory.name : 'Shop All Products'}
          </h1>
          <p className="text-gray-500 mt-2">{total} product{total !== 1 ? 's' : ''}</p>
        </div>
      </section>

      <div className="container-custom py-8 md:py-12">
        {/* Search + Filter Toggle */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <label htmlFor="shop-search" className="sr-only">Search products</label>
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
            <input
              id="shop-search"
              type="search" placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-brand-secondary/40 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-white transition-all duration-200 hover:border-brand-secondary text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${showFilters || activeFilterCount > 0 ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white border-brand-secondary/40 text-brand-dark hover:border-brand-secondary'}`}
          >
            <HiOutlineAdjustments className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-white text-brand-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Expandable Filters Panel */}
        {showFilters && (
          <div className="bg-white border border-brand-secondary/30 rounded-2xl p-4 mb-6 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-brand-dark">Filters</h3>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="text-xs text-brand-primary font-medium hover:underline">Clear All</button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Category */}
              <div>
                <label htmlFor="filter-category" className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Category</label>
                <select id="filter-category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white cursor-pointer">
                  <option value="">All</option>
                  {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>
              {/* Sort */}
              <div>
                <label htmlFor="filter-sort" className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Sort By</label>
                <select id="filter-sort" value={sort} onChange={(e) => setSort(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white cursor-pointer">
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>
              </div>
              {/* Price Range */}
              <div>
                <label htmlFor="filter-price" className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Price</label>
                <select id="filter-price" value={priceRange} onChange={(e) => { setPriceRange(e.target.value); setPage(1); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white cursor-pointer">
                  <option value="">Any Price</option>
                  <option value="0-500">Under Rs. 500</option>
                  <option value="500-1000">Rs. 500 – 1,000</option>
                  <option value="1000-2000">Rs. 1,000 – 2,000</option>
                  <option value="2000-">Rs. 2,000+</option>
                </select>
              </div>
              {/* On Sale Toggle */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Sale</label>
                <button
                  onClick={() => { setOnSale(!onSale); setPage(1); }}
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${onSale ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {onSale ? '🔥 On Sale' : 'On Sale'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active filter pills (shown when filters panel is closed) */}
        {!showFilters && activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {category && (
              <span className="inline-flex items-center gap-1 bg-brand-bg text-brand-dark text-xs font-medium px-3 py-1.5 rounded-full">
                {activeCategory?.name}
                <button onClick={() => { setCategory(''); setPage(1); }}><HiX className="w-3 h-3" /></button>
              </span>
            )}
            {priceRange && (
              <span className="inline-flex items-center gap-1 bg-brand-bg text-brand-dark text-xs font-medium px-3 py-1.5 rounded-full">
                {priceRange.endsWith('-') ? `Rs. ${priceRange.replace('-', '')}+` : `Rs. ${priceRange.replace('-', ' – ')}`}
                <button onClick={() => { setPriceRange(''); setPage(1); }}><HiX className="w-3 h-3" /></button>
              </span>
            )}
            {onSale && (
              <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs font-medium px-3 py-1.5 rounded-full">
                On Sale
                <button onClick={() => { setOnSale(false); setPage(1); }}><HiX className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Category Pills */}
        <div className="relative mb-6">
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            <button onClick={() => { setCategory(''); setPage(1); }}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${!category ? 'bg-brand-primary text-white' : 'bg-gray-100 text-brand-dark hover:bg-gray-200'}`}>
              All
            </button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => { setCategory(String(cat.id)); setPage(1); }}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${category === String(cat.id) ? 'bg-brand-primary text-white' : 'bg-gray-100 text-brand-dark hover:bg-gray-200'}`}>
                {cat.name}
              </button>
            ))}
          </div>
          <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-5 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i}><div className="skeleton aspect-square rounded-xl mb-3" /><div className="skeleton h-4 w-3/4 mb-2 rounded" /><div className="skeleton h-4 w-1/2 rounded" /></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <HiOutlineSearch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg mb-2">No products found</p>
            <p className="text-gray-400 text-sm mb-6">Try adjusting your search or filters</p>
            <button onClick={clearAllFilters} className="btn-outline">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-5 md:gap-6">
              {products.map((product) => (<ProductCard key={product.id} product={product} />))}
            </div>
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center gap-2 mt-12">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium bg-white border border-brand-secondary/40 hover:bg-brand-bg hover:border-brand-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200">
                  Prev
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  if (totalPages > 5 && !(p === 1 || p === totalPages || Math.abs(p - page) <= 1)) return null;
                  return (
                    <button key={i} onClick={() => setPage(p)}
                      aria-label={`Page ${p}`}
                      aria-current={page === p ? 'page' : undefined}
                      className={`min-w-[40px] min-h-[40px] rounded-xl text-sm font-medium transition-all duration-200 ${page === p ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/30' : 'bg-white border border-brand-secondary/40 hover:bg-brand-bg hover:border-brand-secondary text-brand-dark'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium bg-white border border-brand-secondary/40 hover:bg-brand-bg hover:border-brand-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200">
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-custom py-20"><div className="skeleton h-72 rounded-3xl" /></div>}>
      <ShopPageContent />
    </Suspense>
  );
}
