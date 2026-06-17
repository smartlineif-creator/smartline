'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  /** Unique key: variantSlug when on a variant card, otherwise productId */
  key: string;
  /** Always the real product UUID — used when adding to cart */
  productId: string;
  /** Optional variantId for cart line-item */
  variantId?: string;
  /** Slug for /product/:slug navigation */
  slug: string;
  name: string;
  image: string;
  price: number;
}

interface WishlistStore {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  has: (key: string) => boolean;
  count: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (item: WishlistItem) =>
        set((state) => {
          const exists = state.items.some((i) => i.key === item.key);
          return {
            items: exists
              ? state.items.filter((i) => i.key !== item.key)
              : [item, ...state.items],
          };
        }),

      has: (key: string) => get().items.some((i) => i.key === key),

      count: () => get().items.length,
    }),
    { name: 'smartline-wishlist' },
  ),
);
