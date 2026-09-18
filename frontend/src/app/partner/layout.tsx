export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-cream/30">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="font-playfair text-xl font-bold text-brand-dark">Hidden Glow</a>
          <span className="text-xs font-medium text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">Partner Portal</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
