import HomeClient from './HomeClient';
import { serverGet } from '@/lib/serverApi';
import { CmsSection, Product, Review } from '@/lib/types';

// Re-generate the cached home page at most once a minute (ISR) instead of fetching on every visit.
export const revalidate = 60;

export default async function HomePage() {
  const [cms, bestSellers, featured, reviews] = await Promise.all([
    serverGet<Record<string, CmsSection> | null>('/cms/page/homepage', null),
    serverGet<Product[] | null>('/products/best-sellers', null),
    serverGet<Product[] | null>('/products/featured', null),
    serverGet<Review[] | null>('/reviews/homepage', null),
  ]);
  return <HomeClient initial={{ cms, bestSellers, featured, reviews }} />;
}
