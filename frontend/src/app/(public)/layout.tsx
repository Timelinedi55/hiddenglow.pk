import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { SiteDataProvider } from '@/lib/SiteDataProvider';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteDataProvider>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-brand-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium">
        Skip to main content
      </a>
      <Header />
      <CartDrawer />
      <main id="main-content" className="min-h-screen pt-[5.5rem] lg:pt-[6.5rem] relative bg-white">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </SiteDataProvider>
  );
}
