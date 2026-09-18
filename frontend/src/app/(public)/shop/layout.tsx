import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop Women\'s Innerwear Online in Pakistan',
  description: 'Browse our full collection of premium women\'s innerwear — bras, panties, nightwear, bralettes & more. Cash on Delivery across Pakistan. Sizes S to XXL. Free delivery over Rs. 3,000.',
  keywords: ['buy bra online Pakistan', 'women innerwear shop', 'panties online', 'nightwear Pakistan', 'Hidden Glow shop', 'ladies undergarments'],
  alternates: { canonical: 'https://hiddenglow.pk/shop' },
  openGraph: {
    title: 'Shop Women\'s Innerwear | Hidden Glow Pakistan',
    description: 'Browse premium bras, panties, nightwear & more. Cash on Delivery across Pakistan.',
    url: 'https://hiddenglow.pk/shop',
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
