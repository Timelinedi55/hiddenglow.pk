import ShopClient, { ShopInitial, shopQuery } from './ShopClient';
import { serverGet } from '@/lib/serverApi';

export default async function ShopPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';
  const key = shopQuery(1, one(searchParams.category), one(searchParams.sort) || 'newest', one(searchParams.search));
  const data = await serverGet<{ items: any[]; total: number; totalPages: number } | null>(`/products?${key}`, null, 60);
  const initial: ShopInitial | null = data && Array.isArray(data.items)
    ? { key, items: data.items, total: data.total, totalPages: data.totalPages }
    : null;
  return <ShopClient initial={initial} />;
}
