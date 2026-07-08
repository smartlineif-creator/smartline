'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentProduct {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
}

interface RecentlyViewedStore {
  products: RecentProduct[];
  add: (product: RecentProduct) => void;
  getOthers: (currentId: string) => RecentProduct[];
}

const MAX_ITEMS = 8;

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      products: [],

      add: (product: RecentProduct) =>
        set((state) => {
          const filtered = state.products.filter((p) => p.id !== product.id);
          return {
            products: [product, ...filtered].slice(0, MAX_ITEMS),
          };
        }),

      // Entries cached before a product had a real photo (or from before we
      // fixed variant-photo fallback) store the placeholder as `image` — skip
      // those instead of showing a broken-looking card; they self-heal the
      // next time that product is actually revisited.
      getOthers: (currentId: string) =>
        get().products.filter((p) => p.id !== currentId && !p.image?.includes('/placeholder')),
    }),
    { name: 'smartline-recently-viewed' },
  ),
);
