import type { Metadata } from 'next';
import CmsTextPage from '@/components/CmsTextPage';

export const metadata: Metadata = {
  title: 'About Us - Our Story & Mission',
  description: 'Learn about Hidden Glow — a women\'s innerwear brand in Pakistan focused on comfort, quality fabrics, and everyday confidence. Discreet packaging & nationwide delivery.',
  alternates: { canonical: 'https://hiddenglow.pk/about' },
  openGraph: {
    title: 'About Hidden Glow',
    description: 'A women\'s innerwear brand in Pakistan focused on comfort, quality fabrics, and everyday confidence.',
    url: 'https://hiddenglow.pk/about',
  },
};

export default function AboutPage() {
  return (
    <CmsTextPage
      pageKey="about"
      eyebrow="Our Story"
      fallbackTitle="About Hidden Glow"
      fallbackDescription="We believe every woman deserves innerwear that's comfortable, beautiful, and affordable. That's why we created Hidden Glow — premium basics delivered with care across Pakistan."
    >
      <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
        {[
          ['Craft', 'Premium fabrics, expert stitching, and fits that feel like they were made for you.'],
          ['Confidence', 'Innerwear that makes you feel confident and beautiful, every single day.'],
          ['Care', 'Discreet packaging, responsive support, and delivery you can count on.'],
        ].map(([title, text]) => (
          <div key={title} className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-dark-light/70">{title}</p>
            <p className="mt-3 text-sm leading-7 text-brand-dark-light">{text}</p>
          </div>
        ))}
      </div>
    </CmsTextPage>
  );
}
