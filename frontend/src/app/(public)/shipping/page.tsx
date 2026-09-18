import type { Metadata } from 'next';
import CmsTextPage from '@/components/CmsTextPage';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Hidden Glow shipping information — delivery coverage across Pakistan, estimated timelines, shipping charges, and Cash on Delivery details.',
  alternates: { canonical: 'https://hiddenglow.pk/shipping' },
};

export default function ShippingPage() {
  return (
    <CmsTextPage
      pageKey="shipping"
      eyebrow="Delivery"
      fallbackTitle="Shipping Policy"
      fallbackDescription="Delivery coverage, estimated timelines, and shipping charges for Hidden Glow orders in Pakistan."
    />
  );
}
