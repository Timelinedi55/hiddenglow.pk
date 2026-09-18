import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import CartHydrator from '@/components/CartHydrator';
import SiteScripts from '@/components/SiteScripts';
import VisitorTracker from '@/components/VisitorTracker';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function getSettings(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_URL}/settings`, { next: { revalidate: 300 } });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();

  const title = s.seo_site_title || 'Hidden Glow | Premium Women\'s Innerwear in Pakistan';
  const description = s.seo_site_description || 'Shop premium women\'s innerwear at Hidden Glow Pakistan. Comfortable bras, panties, nightwear & more with Cash on Delivery, free shipping over Rs. 3,000, and discreet packaging.';
  const canonical = s.seo_canonical_url || 'https://hiddenglow.pk';
  const ogTitle = s.seo_og_title || title;
  const ogDescription = s.seo_og_description || description;
  const ogSiteName = s.seo_og_site_name || 'Hidden Glow';
  const ogImage = s.seo_og_image || undefined;
  const twitterCard = (s.seo_twitter_card || 'summary_large_image') as 'summary' | 'summary_large_image';
  const keywords = s.seo_keywords
    ? s.seo_keywords.split(',').map((k: string) => k.trim())
    : [
        'Hidden Glow', 'hidden glow pakistan', 'hiddenglow.pk',
        'women innerwear Pakistan', 'ladies undergarments online Pakistan',
        'buy bra online Pakistan', 'panties online Pakistan',
        'women nightwear Pakistan', 'comfortable bras Pakistan',
        'lingerie delivery Pakistan', 'cotton bra Pakistan',
        'padded bra online', 'bralette Pakistan',
        'women underwear cash on delivery', 'innerwear shop Pakistan',
        'best bra brands Pakistan', 'women lingerie Lahore Karachi Islamabad',
        'discreet packaging innerwear', 'affordable lingerie Pakistan',
        'plus size bra Pakistan',
      ];

  const faviconUrl = s.favicon ? `${API_URL.replace('/api', '')}${s.favicon}` : undefined;

  const icons: Metadata['icons'] = faviconUrl
    ? { icon: [{ url: faviconUrl }] }
    : { icon: [{ url: '/favicon.ico', sizes: '48x48' }, { url: '/favicon.svg', type: 'image/svg+xml' }] };

  const verification: Metadata['verification'] = {};
  if (s.seo_google_verification) verification.google = s.seo_google_verification;
  if (s.seo_bing_verification) verification.other = { 'msvalidate.01': s.seo_bing_verification };

  return {
    metadataBase: new URL(canonical),
    title: { default: title, template: '%s | Hidden Glow' },
    description,
    keywords,
    authors: [{ name: 'Hidden Glow' }],
    creator: 'Hidden Glow',
    publisher: 'Hidden Glow',
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
    alternates: { canonical },
    openGraph: {
      type: 'website', locale: 'en_PK', url: canonical, siteName: ogSiteName,
      title: ogTitle, description: ogDescription,
      ...(ogImage ? { images: [{ url: ogImage.startsWith('http') ? ogImage : `${API_URL.replace('/api', '')}${ogImage}` }] } : {}),
    },
    twitter: { card: twitterCard, title: ogTitle, description: ogDescription },
    icons,
    verification,
  };
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Hidden Glow',
  url: 'https://hiddenglow.pk',
  logo: 'https://hiddenglow.pk/logo.png',
  description: 'Premium women\'s innerwear brand in Pakistan offering bras, panties, nightwear and more. Comfortable, affordable, discreet packaging with Cash on Delivery.',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['English', 'Urdu'],
  },
  sameAs: [
    'https://instagram.com/hiddenglow.pk',
    'https://facebook.com/hiddenglow.pk',
    'https://tiktok.com/@hiddenglow.pk',
  ],
  areaServed: {
    '@type': 'Country',
    name: 'Pakistan',
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Hidden Glow',
  url: 'https://hiddenglow.pk',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://hiddenglow.pk/shop?search={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <SiteScripts />
        <VisitorTracker />
        <CartHydrator />
        {children}
        <Toaster position="bottom-center" toastOptions={{ duration: 3000, style: { background: '#2B2B2B', color: '#fff' } }} />
      </body>
    </html>
  );
}
