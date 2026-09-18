import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about Hidden Glow — payment methods, delivery times, sizing help, exchanges, discreet packaging, and order support in Pakistan.',
  alternates: { canonical: 'https://hiddenglow.pk/faq' },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
