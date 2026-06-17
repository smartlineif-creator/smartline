import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Product, Variant } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | string | null | undefined): string {
  if (price == null) return '—';
  const n = typeof price === 'string' ? parseFloat(price) : price;
  return Math.round(n).toLocaleString('uk-UA') + ' ₴';
}

export function getProductPrice(product: Product, variant?: Variant): number {
  if (variant) return Number(variant.price);
  if (product.basePrice) return Number(product.basePrice);
  if (product.variants && product.variants.length > 0) return Number(product.variants[0].price);
  return 0;
}

export function getProductCompareAtPrice(product: Product, variant?: Variant): number | null {
  const value = variant?.compareAtPrice ?? product.compareAtPrice;
  if (value == null) return null;
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
}

export function getProductStock(product: Product, variant?: Variant): number {
  if (variant) return variant.stock || 0;
  if (product.variants && product.variants.length > 0) {
    return product.variants.reduce((sum, item) => sum + (item.stock || 0), 0);
  }
  return product.stock || 0;
}

export function getProductDisplayPrices(product: Product, variant?: Variant) {
  const currentPrice = getProductPrice(product, variant);
  const compareAtPrice = getProductCompareAtPrice(product, variant);
  const promo = getActivePromotion(product);
  const finalPrice = promo ? getDiscountedPrice(currentPrice, promo.discountPercent) : currentPrice;
  const crossedPrice = compareAtPrice && compareAtPrice > finalPrice
    ? compareAtPrice
    : promo ? currentPrice : null;

  return {
    currentPrice,
    finalPrice,
    crossedPrice,
    promo,
  };
}

export function getProductDisplayName(product: Product, variant?: Variant): string {
  if (!variant?.name) return product.name;
  if (product.name.includes(variant.name)) return product.name;
  return `${product.name} ${variant.name}`.trim();
}

export function getFirstAvailableVariant(product: Product): Variant | undefined {
  if (!product.variants?.length) return undefined;
  return (
    product.variants.find((v) => (v.stock ?? 0) > 0) ?? product.variants[0]
  );
}

export function getProductHref(product: Product, variant?: Variant): string {
  if (variant?.slug) return `/product/${variant.slug}`;
  const first = getFirstAvailableVariant(product);
  const slug = first?.slug ?? product.slug;
  return `/product/${slug}`;
}

export function getProductMinPrice(product: Product): { price: number; hasMultiple: boolean } {
  if (!product.variants?.length) {
    return { price: Number(product.basePrice ?? 0), hasMultiple: false };
  }
  const prices = product.variants.map((v) => Number(v.price)).filter((p) => p > 0);
  if (!prices.length) return { price: 0, hasMultiple: false };
  const min = Math.min(...prices);
  return { price: min, hasMultiple: prices.some((p) => p !== min) };
}

export function getDiscountedPrice(price: number, discountPercent: number): number {
  return Math.round(price * (1 - discountPercent / 100));
}

export function getActivePromotion(product: Product) {
  const now = new Date();

  // 1. Product-level promotion (highest priority)
  const productPromo = product.promotions?.find(
    (pp) =>
      pp.promotion.isActive &&
      new Date(pp.promotion.startDate) <= now &&
      new Date(pp.promotion.endDate) >= now,
  )?.promotion ?? null;
  if (productPromo) return productPromo;

  // 2. Category-level promotion
  const categoryPromos = (product.category as any)?.promotions as
    | { id: string; discountPercent: number; isActive: boolean; startDate: string; endDate: string }[]
    | undefined;
  return (
    categoryPromos?.find(
      (p) =>
        p.isActive &&
        new Date(p.startDate) <= now &&
        new Date(p.endDate) >= now,
    ) ?? null
  );
}

export function getMainImage(product: Product): string {
  const main = product.images?.find((i) => i.isMain);
  return main?.url || product.images?.[0]?.url || '/placeholder.svg';
}

export function toSlug(name: string): string {
  const cyrillicMap: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh',
    з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
    о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'yu', я: 'ya',
  };
  return name
    .toLowerCase()
    .replace(/[а-яёіїєґ]/g, (c) => cyrillicMap[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: 'Новий',
  CONFIRMED: 'Підтверджено',
  SHIPPED: 'Відправлено',
  DELIVERED: 'Доставлено',
  CANCELLED: 'Скасовано',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-yellow-100 text-yellow-800',
  SHIPPED: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};
