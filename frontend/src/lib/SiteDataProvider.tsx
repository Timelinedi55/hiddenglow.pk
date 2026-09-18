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

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData>({ settings: {}, categories: [], loaded: false });

  useEffect(() => {
    Promise.all([
      api.get('/settings').catch(() => ({})),
      api.get('/categories').catch(() => []),
    ]).then(([settings, categories]) => {
      setData({ settings, categories, loaded: true });
    });
  }, []);

  return (
    <SiteDataContext.Provider value={data}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
