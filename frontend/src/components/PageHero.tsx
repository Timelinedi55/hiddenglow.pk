import Link from 'next/link';

interface HeroAction {
  href: string;
  label: string;
  variant?: 'primary' | 'secondary';
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: HeroAction[];
  align?: 'left' | 'center';
}

export default function PageHero({
  eyebrow,
  title,
  description,
  actions = [],
  align = 'left',
}: PageHeroProps) {
  const centered = align === 'center';
  const showEyebrow = eyebrow && eyebrow.trim().toLowerCase() !== title.trim().toLowerCase();

  return (
    <section className="relative overflow-hidden border-b border-brand-secondary/30 bg-gradient-to-br from-brand-bg via-white to-brand-secondary/30">
      <div className="container-custom relative py-8 md:py-12">
        <div className={`max-w-3xl ${centered ? 'mx-auto text-center' : ''}`}>
          {showEyebrow && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-brand-dark-light/80">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-serif font-bold leading-tight text-brand-dark sm:text-4xl md:text-5xl break-words">
            {title}
          </h1>
          {description && (
            <p className={`mt-4 max-w-2xl text-base leading-7 text-brand-dark-light md:text-lg md:leading-8 ${centered ? 'mx-auto' : ''}`}>
              {description}
            </p>
          )}
          {actions.length > 0 && (
            <div className={`mt-8 flex flex-wrap gap-3 ${centered ? 'justify-center' : ''}`}>
              {actions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={action.variant === 'secondary' ? 'btn-outline' : 'btn-primary'}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}