'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Faq } from '@/lib/types';
import { HiChevronDown } from 'react-icons/hi';
import PageHero from '@/components/PageHero';

export default function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/faqs').then((data) => { setFaqs(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // Inject FAQ structured data for SEO/AEO
  useEffect(() => {
    if (faqs.length === 0) return;
    const faqJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(faqJsonLd);
    script.id = 'faq-jsonld';
    document.head.appendChild(script);
    return () => { document.getElementById('faq-jsonld')?.remove(); };
  }, [faqs]);

  return (
    <div>
      <PageHero
        eyebrow="Support"
        title="Frequently Asked Questions"
        description="Quick answers around payment, delivery, sizing, exchanges, packaging, and order support."
        align="center"
      />
      <div className="container-custom py-10 md:py-14">
        <div className="mx-auto max-w-4xl space-y-3">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="surface-card p-5">
                <div className="skeleton h-4 w-20 mb-2 rounded" />
                <div className="skeleton h-5 w-3/4 rounded" />
              </div>
            ))
          ) : faqs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-2">No FAQs available yet</p>
              <p className="text-gray-400 text-sm">Check back soon or contact us directly for help.</p>
            </div>
          ) : (
            faqs.map((faq) => (
              <div key={faq.id} className="surface-card overflow-hidden">
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="flex w-full items-center justify-between p-5 text-left font-medium transition-colors hover:bg-brand-bg/40"
                  aria-expanded={openId === faq.id}
                  aria-controls={`faq-answer-${faq.id}`}
                >
                  <div>
                    <span className="block text-sm uppercase tracking-[0.18em] text-brand-dark-light/60">{faq.category || 'General'}</span>
                    <span className="mt-2 block text-base text-brand-dark md:text-lg">{faq.question}</span>
                  </div>
                  <HiChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${openId === faq.id ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                <div
                  id={`faq-answer-${faq.id}`}
                  role="region"
                  className={`transition-all duration-200 ease-in-out overflow-hidden ${openId === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="border-t border-brand-secondary/60 px-5 pb-5 pt-4 text-brand-dark-light leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
