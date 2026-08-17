'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  /** Unique key: variantSlug when on a variant card, otherwise product/service id */
  key: string;
  /**
   * What this row points at. Absent on rows saved before services could be
   * favourited — treat a missing value as 'product'.
   */
  kind?: 'product' | 'service';
  /** Product UUID — used when adding to cart. Empty for service rows. */
  productId: string;
  /** Optional variantId for cart line-item */
  variantId?: string;
  /** Service UUID, set only when kind is 'service' */
  serviceId?: string;
  /** Slug for /product/:slug or /services/:slug navigation */
  slug: string;
  name: string;
  image: string;
  price: number;
}

/** Rows persisted before services existed carry no `kind`. */
export function wishlistItemKind(item: WishlistItem): 'product' | 'service' {
  return item.kind ?? 'product';
}

export function wishlistItemHref(item: WishlistItem): string {
  return wishlistItemKind(item) === 'service' ? `/services/${item.slug}` : `/product/${item.slug}`;
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
