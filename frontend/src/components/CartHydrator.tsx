'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/lib/store';

export default function CartHydrator() {
  const hydrateFromStorage = useCartStore((state) => state.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return null;
}