import type { Metadata } from 'next';
import CmsTextPage from '@/components/CmsTextPage';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Read the terms and conditions for shopping at Hidden Glow — covering purchases, delivery, returns, and platform usage across Pakistan.',
  alternates: { canonical: 'https://hiddenglow.pk/terms' },
};

export default function TermsPage() {
  return (
    <CmsTextPage
      pageKey="terms"
      eyebrow="Legal"
      fallbackTitle="Terms & Conditions"
      fallbackDescription="The purchase, delivery, and platform terms that apply when shopping with Hidden Glow."
    />
  );
}
