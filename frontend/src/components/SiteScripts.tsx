'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

type SiteSettings = Record<string, string>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function appendCustomMarkup(target: HTMLElement, markup: string, key: string) {
  const container = document.createElement('div');
  container.dataset.hgScriptBlock = key;
  const template = document.createElement('template');
  template.innerHTML = markup;

  Array.from(template.content.childNodes).forEach((node, index) => {
    if (node.nodeName.toLowerCase() === 'script') {
      const source = node as HTMLScriptElement;
      const script = document.createElement('script');
      Array.from(source.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
      script.text = source.text;
      script.dataset.hgScriptNode = `${key}-${index}`;
      container.appendChild(script);
      return;
    }
    container.appendChild(node.cloneNode(true));
  });

  target.appendChild(container);
  return () => container.remove();
}

function sanitizeAnalyticsId(id: string): string {
  return id.replace(/[^a-zA-Z0-9\-_]/g, '');
}

export default function SiteScripts() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    let active = true;

    fetch(`${API_URL}/settings`)
      .then((response) => response.json())
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch(() => {
        if (active) setSettings({});
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!settings) return;

    const cleanups: Array<() => void> = [];

    if (settings.custom_scripts_head?.trim()) {
      cleanups.push(appendCustomMarkup(document.head, settings.custom_scripts_head, 'head'));
    }

    if (settings.custom_scripts_body?.trim()) {
      cleanups.push(appendCustomMarkup(document.body, settings.custom_scripts_body, 'body'));
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [settings]);

  if (!settings) return null;

  return (
    <>
      {settings.meta_pixel?.trim() && (
        <>
          <Script id="meta-pixel-base" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;\n              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;\n              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',\n              'https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${sanitizeAnalyticsId(settings.meta_pixel.trim())}');fbq('track', 'PageView');`}
          </Script>
        </>
      )}
      {settings.google_analytics?.trim() && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${sanitizeAnalyticsId(settings.google_analytics.trim())}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${sanitizeAnalyticsId(settings.google_analytics.trim())}');`}
          </Script>
        </>
      )}
      {settings.google_ads?.trim() && (
        <Script id="google-ads-config" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('config', '${sanitizeAnalyticsId(settings.google_ads.trim())}');`}
        </Script>
      )}
    </>
  );
}