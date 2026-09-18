'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Product, Category } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { HiChevronRight } from 'react-icons/hi';
import MediaImage from '@/components/MediaImage';

export default function CategoryPageClient({ slug }: { slug: string }) {
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    setLoading(true);
    api.get(`/categories/slug/${slug}`).then((cat) => {
      setCategory(cat);
      return api.get(`/products?category=${cat.id}&page=${page}&limit=12&sort=${sort}`);
    }).then((data) => {
      setProducts(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug, page, sort]);

  if (loading && !category) {
    return (
      <div>
        <div className="bg-brand-bg/50 py-16"><div className="container-custom"><div className="skeleton h-10 w-48 mb-3 rounded" /><div className="skeleton h-5 w-96 rounded" /></div></div>
        <div className="container-custom py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-5 md:gap-6">
            {[...Array(8)].map((_, i) => (<div key={i}><div className="skeleton aspect-square rounded-xl mb-3" /><div className="skeleton h-4 w-3/4 mb-2 rounded" /><div className="skeleton h-4 w-1/2 rounded" /></div>))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container-custom section-padding text-center">
        <h1 className="heading-2">Category Not Found</h1>
        <Link href="/shop" className="btn-primary mt-4 inline-block">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Category Hero */}
      <section className="relative bg-brand-bg/50 overflow-hidden">
        {category.image && (
          <div className="absolute inset-0 opacity-10">
            <MediaImage src={category.image} alt={category.name} sizes="100vw" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="container-custom relative py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-brand-dark">Home</Link>
            <HiChevronRight className="w-3 h-3" />
            <Link href="/shop" className="hover:text-brand-dark">Shop</Link>
            <HiChevronRight className="w-3 h-3" />
            <span className="text-brand-dark font-medium">{category.name}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark mb-3">{category.name}</h1>
          {category.description && <p className="text-gray-500 max-w-2xl text-lg">{category.description}</p>}
        </div>
      </section>

      <div className="container-custom py-8 md:py-12">
        {/* Filter bar */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-gray-500">{total} product{total !== 1 ? 's' : ''}</p>
          <div>
            <label htmlFor="category-sort" className="sr-only">Sort products</label>
            <select id="category-sort" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white">
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No products in this category yet</p>
            <Link href="/shop" className="btn-primary">Browse All Products</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-5 md:gap-6">
              {products.map((product) => (<ProductCard key={product.id} product={product} />))}
            </div>
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center gap-2 mt-10">
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  if (totalPages > 5 && !(p === 1 || p === totalPages || Math.abs(p - page) <= 1)) return null;
                  return (
                    <button key={i} onClick={() => setPage(p)}
                      aria-label={`Page ${p}`}
                      aria-current={page === p ? 'page' : undefined}
                      className={`min-w-[40px] min-h-[40px] rounded-xl text-sm font-medium transition-all duration-200 ${page === p ? 'bg-brand-primary text-white shadow-md' : 'bg-white border border-brand-secondary/40 hover:bg-brand-bg text-brand-dark'}`}>
                      {p}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
