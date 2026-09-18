import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Your Order',
  description: 'Track your Hidden Glow order status in real time. Enter your order number to check delivery progress for your women\'s innerwear order in Pakistan.',
  alternates: { canonical: 'https://hiddenglow.pk/track-order' },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
