'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartLocalItem } from '@/types';

function itemKey(item: CartLocalItem): string {
  if (item.itemType === 'service') return `service:${item.serviceId}:${item.tierId ?? ''}`;
  return `product:${item.productId}:${item.variantId ?? ''}`;
}

/** Same key `itemKey` builds for products — exported so callers can address a line without owning an item object. */
export function cartProductKey(productId: string, variantId?: string): string {
  return `product:${productId}:${variantId ?? ''}`;
}

/**
 * `maxQuantity` is the stock we knew about when the line was written. It is a
 * UX guard only — stock can change under us, so the order endpoint re-checks it
 * against the DB and is the real gate. A missing or non-positive limit means
 * "unknown", never "zero allowed": services carry no stock, and a product whose
 * stock reads 0 can still be ordered on request.
 */
function clampToStock(quantity: number, maxQuantity?: number): number {
  if (!maxQuantity || maxQuantity <= 0) return quantity;
  return Math.min(quantity, maxQuantity);
}

interface CartStore {
  items: CartLocalItem[];
  addItem: (item: CartLocalItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  removeServiceItem: (serviceId: string, tierId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  updateServiceQuantity: (serviceId: string, tierId: string | undefined, quantity: number) => void;
  /** Refresh the per-line stock ceiling from freshly fetched products, trimming any line that now exceeds it. */
  syncStockLimits: (limits: Record<string, number>) => void;
  clearCart: () => void;
  totalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          // Migrate legacy items that predate itemType field
          const migratedItems = state.items.map((i) =>
            i.itemType ? i : { ...i, itemType: 'product' as const },
          );

          const key = itemKey(item);
          const existing = migratedItems.find((i) => itemKey(i) === key);
          if (existing) {
            // The incoming limit is the fresher one — the page that dispatched
            // this add just read the product.
            const max = item.maxQuantity ?? existing.maxQuantity;
            return {
              items: migratedItems.map((i) =>
                itemKey(i) === key
                  ? { ...i, maxQuantity: max, quantity: clampToStock(i.quantity + item.quantity, max) }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...migratedItems,
              { ...item, quantity: clampToStock(item.quantity, item.maxQuantity) },
            ],
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId),
          ),
        }));
      },

      removeServiceItem: (serviceId, tierId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.serviceId === serviceId && i.tierId === tierId),
          ),
        }));
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity: clampToStock(quantity, i.maxQuantity) }
              : i,
          ),
        }));
      },

      updateServiceQuantity: (serviceId, tierId, quantity) => {
        if (quantity <= 0) {
          get().removeServiceItem(serviceId, tierId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.serviceId === serviceId && i.tierId === tierId ? { ...i, quantity } : i,
          ),
        }));
      },

      syncStockLimits: (limits) => {
        set((state) => {
          let changed = false;
          const items = state.items.map((i) => {
            if (i.itemType === 'service' || !i.productId) return i;
            const max = limits[cartProductKey(i.productId, i.variantId)];
            if (max === undefined) return i;
            const quantity = clampToStock(i.quantity, max);
            if (i.maxQuantity === max && i.quantity === quantity) return i;
            changed = true;
            return { ...i, maxQuantity: max, quantity };
          });
          // Bail on a no-op so this cannot feed back into the effect that calls it.
          return changed ? { items } : state;
        });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'smartline-cart' },
  ),
);
