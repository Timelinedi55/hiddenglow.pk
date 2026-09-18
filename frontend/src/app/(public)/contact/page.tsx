'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { CmsSection } from '@/lib/types';
import { useSiteData } from '@/lib/SiteDataProvider';
import { HiOutlinePhone, HiOutlineMail, HiOutlineLocationMarker } from 'react-icons/hi';
import PageHero from '@/components/PageHero';

export default function ContactPage() {
  const [cms, setCms] = useState<Record<string, CmsSection>>({});
  const { settings } = useSiteData();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cms/page/contact').catch(() => ({})).then((cmsData) => {
      setCms(cmsData);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHero
        eyebrow="Customer Care"
        title={cms.main?.title || 'Contact Us'}
        description="Need help with your size, order, or exchange? We're here for you."
        actions={[{ href: '/faq', label: 'Read FAQs', variant: 'secondary' }]}
      />
      <div className="container-custom py-10 md:py-14">
        <div className="surface-card mx-auto max-w-5xl p-6 md:p-10">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-[1.5rem] border border-brand-secondary/30 bg-brand-bg/40 p-6 text-center">
                  <div className="skeleton w-8 h-8 mx-auto mb-3 rounded" />
                  <div className="skeleton h-4 w-20 mx-auto mb-2 rounded" />
                  <div className="skeleton h-4 w-32 mx-auto rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
            {cms.main?.content && (
              <div className="cms-content mb-10 text-brand-dark-light" dangerouslySetInnerHTML={{ __html: cms.main.content }} />
            )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {settings.phone && (
            <div className="rounded-[1.5rem] border border-brand-secondary/30 bg-brand-bg/40 p-6 text-center">
              <HiOutlinePhone className="w-8 h-8 mx-auto mb-3 text-brand-dark" />
              <h3 className="font-semibold mb-1">Phone</h3>
              <a href={`tel:${settings.phone}`} className="text-gray-600 hover:text-brand-dark">{settings.phone}</a>
            </div>
          )}
          {settings.email && (
            <div className="rounded-[1.5rem] border border-brand-secondary/30 bg-brand-bg/40 p-6 text-center">
              <HiOutlineMail className="w-8 h-8 mx-auto mb-3 text-brand-dark" />
              <h3 className="font-semibold mb-1">Email</h3>
              <a href={`mailto:${settings.email}`} className="text-gray-600 hover:text-brand-dark">{settings.email}</a>
            </div>
          )}
          {settings.address && (
            <div className="rounded-[1.5rem] border border-brand-secondary/30 bg-brand-bg/40 p-6 text-center">
              <HiOutlineLocationMarker className="w-8 h-8 mx-auto mb-3 text-brand-dark" />
              <h3 className="font-semibold mb-1">Address</h3>
              <p className="text-gray-600">{settings.address}</p>
            </div>
          )}
          </div>

          {settings.whatsapp && (
            <div className="mt-10 text-center">
              <a href={`https://wa.me/${settings.whatsapp?.replace(/[^0-9]/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-green-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-green-700">
                Chat on WhatsApp
              </a>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
