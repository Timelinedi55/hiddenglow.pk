import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Hidden Glow for order help, sizing questions, or exchange requests. Reach us via phone, email, or WhatsApp for fast support across Pakistan.',
  alternates: { canonical: 'https://hiddenglow.pk/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
