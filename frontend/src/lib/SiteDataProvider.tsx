'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { Category } from '@/lib/types';

interface SiteData {
  settings: Record<string, any>;
  categories: Category[];
  loaded: boolean;
}

const SiteDataContext = createContext<SiteData>({
  settings: {},
  categories: [],
  loaded: false,
});

export function SiteDataProvider({
  children,
  initialSettings,
  initialCategories,
}: {
  children: ReactNode;
  initialSettings?: Record<string, any> | null;
  initialCategories?: Category[] | null;
}) {
  // Server-rendered data (from the public layout) lets the header, footer and category
  // sections render in the first HTML instead of popping in after a client fetch.
  const hasInitial = !!initialSettings && !!initialCategories;
  const [data, setData] = useState<SiteData>(
    hasInitial
      ? { settings: initialSettings!, categories: initialCategories!, loaded: true }
      : { settings: {}, categories: [], loaded: false },
  );

  useEffect(() => {
    if (hasInitial) return;
    Promise.all([
      api.get('/settings').catch(() => ({})),
      api.get('/categories').catch(() => []),
    ]).then(([settings, categories]) => {
      setData({ settings, categories, loaded: true });
    });
  }, [hasInitial]);

  return (
    <SiteDataContext.Provider value={data}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
