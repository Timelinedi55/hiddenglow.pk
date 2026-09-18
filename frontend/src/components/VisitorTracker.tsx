'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { captureReferralCode } from '@/lib/trackEvent';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getVisitorId(): string {
  const key = 'hg_vid';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, '').substring(0, 32) +
         Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
}

function detectBrowser(ua: string): string {
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera';
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('MSIE') || ua.includes('Trident/')) return 'IE';
  return 'Other';
}

function detectOS(ua: string): string {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS X') || ua.includes('Macintosh')) return 'macOS';
  if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('CrOS')) return 'Chrome OS';
  return 'Other';
}

function detectDevice(ua: string): string {
  if (/Mobi|Android.*Mobile|iPhone|iPod/.test(ua)) return 'Mobile';
  if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) return 'Tablet';
  return 'Desktop';
}

function getUTMParams(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
  };
}

export default function VisitorTracker() {
  const pathname = usePathname();
  const pageStartRef = useRef(Date.now());
  const lastPathRef = useRef('');

  useEffect(() => {
    // Skip tracking for admin pages
    if (pathname.startsWith('/admin')) return;

    // Capture referral code and UTM params on first load
    captureReferralCode();

    const ua = navigator.userAgent;
    const visitorId = getVisitorId();

    // Send duration for previous page
    if (lastPathRef.current && lastPathRef.current !== pathname) {
      const duration = Math.round((Date.now() - pageStartRef.current) / 1000);
      if (duration > 0 && duration < 3600) {
        const blob = new Blob([JSON.stringify({
          visitorId,
          url: lastPathRef.current,
          duration,
        })], { type: 'application/json' });
        navigator.sendBeacon(`${API_URL}/analytics/duration`, blob);
      }
    }

    pageStartRef.current = Date.now();
    lastPathRef.current = pathname;

    const utms = getUTMParams();

    // Track page view
    fetch(`${API_URL}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        userAgent: ua,
        browser: detectBrowser(ua),
        os: detectOS(ua),
        deviceType: detectDevice(ua),
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language?.substring(0, 10) || '',
        referrer: document.referrer || '',
        url: pathname,
        pageTitle: document.title || '',
        ...utms,
      }),
      keepalive: true,
    }).catch(() => {});

    // Send duration on page hide
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const duration = Math.round((Date.now() - pageStartRef.current) / 1000);
        if (duration > 0 && duration < 3600) {
          const blob = new Blob([JSON.stringify({
            visitorId,
            url: pathname,
            duration,
          })], { type: 'application/json' });
          navigator.sendBeacon(`${API_URL}/analytics/duration`, blob);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  return null;
}
