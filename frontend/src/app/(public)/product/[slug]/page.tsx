import type { Metadata } from 'next';
import ProductPageClient from './ProductPageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.startsWith('http')
  ? process.env.NEXT_PUBLIC_API_URL
  : 'http://localhost:4001/api';

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/products/slug/${slug}/full`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getProduct(params.slug);
  if (!data?.product) {
    return { title: 'Product Not Found' };
  }
  const p = data.product;
  const title = p.seoTitle || p.name;
  const description = p.seoDescription || p.shortDescription || `Buy ${p.name} online at Hidden Glow. Premium women's innerwear with Cash on Delivery across Pakistan.`;
  const primaryImage = p.images?.find((i: any) => i.isPrimary) || p.images?.[0];
  const imageUrl = primaryImage ? `https://hiddenglow.pk${primaryImage.url}` : undefined;

  return {
    title,
    description,
    alternates: { canonical: `https://hiddenglow.pk/product/${p.slug}` },
    openGraph: {
      title: `${title} | Hidden Glow`,
      description,
      url: `https://hiddenglow.pk/product/${p.slug}`,
      type: 'website',
      ...(imageUrl && { images: [{ url: imageUrl, width: 1200, height: 1200, alt: p.name }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Hidden Glow`,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const data = await getProduct(params.slug);
  const p = data?.product;
  const approvedReviews = p?.reviews?.filter((r: any) => r.isApproved) || [];
  const avgRating = approvedReviews.length > 0
    ? approvedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / approvedReviews.length
    : 0;
  const primaryImage = p?.images?.find((i: any) => i.isPrimary) || p?.images?.[0];

  const productJsonLd = p ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.shortDescription || p.description?.replace(/<[^>]*>/g, '').slice(0, 200),
    image: primaryImage ? `https://hiddenglow.pk${primaryImage.url}` : undefined,
    brand: { '@type': 'Brand', name: 'Hidden Glow' },
    url: `https://hiddenglow.pk/product/${p.slug}`,
    ...(approvedReviews.length > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        reviewCount: approvedReviews.length,
      },
    }),
    offers: {
      '@type': 'Offer',
      price: String(p.discountPrice || p.price),
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
      url: `https://hiddenglow.pk/product/${p.slug}`,
    },
  } : null;

  const breadcrumbJsonLd = p ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://hiddenglow.pk' },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://hiddenglow.pk/shop' },
      ...(p.category ? [{ '@type': 'ListItem', position: 3, name: p.category.name, item: `https://hiddenglow.pk/category/${p.category.slug}` }] : []),
      { '@type': 'ListItem', position: p.category ? 4 : 3, name: p.name },
    ],
  } : null;

  return (
    <>
      {productJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      )}
      {breadcrumbJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      )}
      <ProductPageClient slug={params.slug} />
    </>
  );
}
