'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CmsSection } from '@/lib/types';
import PageHero from '@/components/PageHero';

interface CmsTextPageProps {
  pageKey: string;
  eyebrow: string;
  fallbackTitle: string;
  fallbackDescription: string;
  children?: React.ReactNode;
}

export default function CmsTextPage({
  pageKey,
  eyebrow,
  fallbackTitle,
  fallbackDescription,
  children,
}: CmsTextPageProps) {
  const [cms, setCms] = useState<Record<string, CmsSection>>({});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/cms/page/${pageKey}`).then((data) => { setCms(data); setLoading(false); }).catch(() => setLoading(false));
  }, [pageKey]);

  return (
    <div>
      <PageHero
        eyebrow={eyebrow}
        title={cms.main?.title || fallbackTitle}
        description={fallbackDescription}
      />
      <div className="container-custom py-10 md:py-14">
        <div className="surface-card mx-auto max-w-4xl p-6 md:p-10">
          {loading ? (
            <div className="space-y-4">
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-5/6 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-4/6 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
            </div>
          ) : (
            <div
              className="cms-content text-base leading-8 text-brand-dark-light"
              dangerouslySetInnerHTML={{ __html: cms.main?.content || '<p>No content available yet.</p>' }}
            />
          )}
        </div>
        {children}
      </div>
    </div>
  );
}