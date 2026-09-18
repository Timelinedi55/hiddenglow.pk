import type { Metadata } from 'next';
import CmsTextPage from '@/components/CmsTextPage';

export const metadata: Metadata = {
  title: 'Return & Exchange Policy',
  description: 'Understand Hidden Glow\'s return and exchange policy — eligibility, timelines, and how to request support after your innerwear delivery in Pakistan.',
  alternates: { canonical: 'https://hiddenglow.pk/returns' },
};

export default function ReturnsPage() {
  return (
    <CmsTextPage
      pageKey="returns"
      eyebrow="Support"
      fallbackTitle="Return & Exchange Policy"
      fallbackDescription="Guidance on exchange eligibility, timelines, and how to request support after delivery."
    />
  );
}
