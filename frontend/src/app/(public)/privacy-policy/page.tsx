import type { Metadata } from 'next';
import CmsTextPage from '@/components/CmsTextPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Hidden Glow collects, uses, and protects your personal information when you shop for women\'s innerwear online in Pakistan.',
  alternates: { canonical: 'https://hiddenglow.pk/privacy-policy' },
};

export default function PrivacyPolicyPage() {
  return (
    <CmsTextPage
      pageKey="privacy"
      eyebrow="Legal"
      fallbackTitle="Privacy Policy"
      fallbackDescription="How Hidden Glow collects, uses, and protects customer information across the site and checkout experience."
    />
  );
}
