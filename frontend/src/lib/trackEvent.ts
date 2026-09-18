// E-commerce event tracking utility for Hidden Glow
// Sends events to /analytics-events/track for funnel, campaign, and remarketing analytics

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'hg_vid';
  return localStorage.getItem(key) || '';
}

function getUTMParams(): Record<string, string | undefined> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source') || localStorage.getItem('hg_utm_source') || undefined,
    utmMedium: params.get('utm_medium') || localStorage.getItem('hg_utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || localStorage.getItem('hg_utm_campaign') || undefined,
    utmContent: params.get('utm_content') || localStorage.getItem('hg_utm_content') || undefined,
    utmTerm: params.get('utm_term') || localStorage.getItem('hg_utm_term') || undefined,
  };
}

function getReferralCode(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('hg_ref') || undefined;
}

function detectDevice(): string {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent;
  if (/Mobi|Android.*Mobile|iPhone|iPod/.test(ua)) return 'Mobile';
  if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) return 'Tablet';
  return 'Desktop';
}

function sendEvent(eventType: string, eventData?: any, value?: number) {
  if (typeof window === 'undefined') return;

  const utms = getUTMParams();
  const payload = {
    visitorFingerprint: getVisitorId(),
    eventType,
    eventData,
    url: window.location.pathname,
    ...utms,
    deviceType: detectDevice(),
    referralCode: getReferralCode(),
    value,
    currency: 'PKR',
  };

  // Use sendBeacon for reliability but fall back to fetch
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${API_URL}/analytics-events/track`, blob);
    } else {
      fetch(`${API_URL}/analytics-events/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}

// ── Public tracking API ──────────────────────────────────────────────────────

export const trackEvent = {
  viewProduct: (product: { id: number; name: string; price: number; category?: string }) => {
    sendEvent('view_product', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      category: product.category,
    }, product.price);
  },

  addToCart: (product: { id: number; name: string; price: number; quantity: number; variant?: string }) => {
    sendEvent('add_to_cart', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: product.quantity,
      variant: product.variant,
    }, product.price * product.quantity);
  },

  removeFromCart: (product: { id: number; name: string }) => {
    sendEvent('remove_from_cart', {
      productId: product.id,
      productName: product.name,
    });
  },

  beginCheckout: (cartTotal: number, itemCount: number) => {
    sendEvent('begin_checkout', {
      cartTotal,
      itemCount,
    }, cartTotal);
  },

  purchase: (order: { orderNumber: string; total: number; itemCount: number }) => {
    sendEvent('purchase', {
      orderNumber: order.orderNumber,
      total: order.total,
      itemCount: order.itemCount,
    }, order.total);
  },

  search: (query: string, resultCount?: number) => {
    sendEvent('search', {
      query,
      resultCount,
    });
  },

  viewCategory: (category: { id: number; name: string; slug: string }) => {
    sendEvent('view_category', {
      categoryId: category.id,
      categoryName: category.name,
      categorySlug: category.slug,
    });
  },
};

// ── Referral helpers ─────────────────────────────────────────────────────────

export function captureReferralCode() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    localStorage.setItem('hg_ref', ref);
    // Track the click
    fetch(`${API_URL}/referrals/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: ref,
        landingPage: window.location.pathname,
        visitorFingerprint: getVisitorId(),
      }),
    }).catch(() => {});
  }

  // Persist UTM params
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  utmKeys.forEach((key) => {
    const val = params.get(key);
    if (val) localStorage.setItem(`hg_${key}`, val);
  });
}
