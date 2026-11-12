import type { Metadata } from 'next';
import CategoryPageClient, { CategoryInitial } from './CategoryPageClient';
import { SERVER_API_URL as API_URL, serverGet } from '@/lib/serverApi';

async function getCategory(slug: string) {
  try {
    const res = await fetch(`${API_URL}/categories/slug/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const cat = await getCategory(params.slug);
  if (!cat) return { title: 'Category Not Found' };
  const title = cat.seoTitle || cat.name;
  const description = cat.seoDescription || cat.description || `Shop ${cat.name} at Hidden Glow. Premium women's innerwear with Cash on Delivery across Pakistan.`;

  return {
    title,
    description,
    alternates: { canonical: `https://hiddenglow.pk/category/${cat.slug}` },
    openGraph: {
      title: `${title} | Hidden Glow`,
      description,
      url: `https://hiddenglow.pk/category/${cat.slug}`,
      ...(cat.image && { images: [{ url: `https://hiddenglow.pk${cat.image}`, alt: cat.name }] }),
    },
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const cat = await getCategory(params.slug);
  const data = cat?.id
    ? await serverGet<{ items: any[]; total: number; totalPages: number } | null>(`/products?category=${cat.id}&page=1&limit=12&sort=newest`, null, 60)
    : null;
  const initial: CategoryInitial | null = cat && data && Array.isArray(data.items)
    ? { category: cat, items: data.items, total: data.total, totalPages: data.totalPages }
    : null;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://hiddenglow.pk' },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://hiddenglow.pk/shop' },
      { '@type': 'ListItem', position: 3, name: params.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <CategoryPageClient slug={params.slug} initial={initial} />
    </>
  );
}
