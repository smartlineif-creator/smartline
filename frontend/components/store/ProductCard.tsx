'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ImageOff, ShoppingCart } from 'lucide-react';
import { Product } from '@/types';
import { useState } from 'react';
import {
  formatPrice, getMainImage, getProductDisplayPrices, getProductHref,
  getFirstAvailableVariant, getProductMinPrice,
} from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { toast } from 'sonner';
import { Variant } from '@/types';
import WishlistButton from './WishlistButton';

interface Props {
  product: Product;
  selectedVariant?: Variant;
}

const CARD_ATTRIBUTE_RULES: Array<{ label: string; pattern: RegExp }> = [
  { label: 'Екран', pattern: /екран|диспле|матриц|діагонал/i },
  { label: 'Процесор', pattern: /процесор|чіп|cpu/i },
  { label: "Пам'ять", pattern: /оперативн.*пам|ram/i },
  { label: 'Накопичувач', pattern: /ssd|hdd|накопичувач|вбудован.*пам/i },
  { label: 'Відео', pattern: /відео|граф|gpu/i },
  { label: 'Стан', pattern: /стан/i },
  { label: 'Колір', pattern: /колір/i },
];

const FALLBACK_LABEL_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'Екран', pattern: /\d{1,2}(?:[.,]\d)?\s*(?:[""]|inch|in)?\s*(?:full hd|fhd|qhd|uhd|4k|ips|oled)?/i },
  { label: 'Процесор', pattern: /(?:intel\s+core\s+i[3579][-\w]*|amd\s+ryzen\s+[3579][-\w]*|apple\s+m[1234][-\w]*|snapdragon[\w\s-]*)/i },
  { label: "Пам'ять", pattern: /\b\d{1,3}\s?(?:гб|gb)\s?(?:ram|ddr\d|lpddr\d)?/i },
  { label: 'Накопичувач', pattern: /\b\d{2,4}\s?(?:гб|gb|tb)\s?(?:ssd|hdd)?/i },
];

function pickCardHighlights(product: Product) {
  const used = new Set<string>();
  const attributes = product.attributes || [];
  const highlights: Array<{ label: string; value: string }> = [];

  for (const rule of CARD_ATTRIBUTE_RULES) {
    const match = attributes.find((attribute) => !used.has(attribute.id) && rule.pattern.test(attribute.name));
    if (!match) continue;
    used.add(match.id);
    highlights.push({
      label: rule.label,
      value: `${match.value}${match.unit ? ` ${match.unit}` : ''}`,
    });
    if (highlights.length === 4) break;
  }

  if (highlights.length < 4 && product.category?.name) {
    highlights.push({ label: 'Категорія', value: product.category.name });
  }

  if (highlights.length < 3) {
    for (const rule of FALLBACK_LABEL_PATTERNS) {
      if (highlights.some((item) => item.label === rule.label)) continue;
      const match = product.name.match(rule.pattern);
      if (!match) continue;
      const value = match[0].trim().replace(/\s+/g, ' ');
      if (value.length < 3) continue;
      highlights.push({ label: rule.label, value });
      if (highlights.length === 4) break;
    }
  }

  return highlights.slice(0, 4);
}

/** Compact star rating row for product cards */
function ProductRating({
  reviews,
  count,
}: {
  reviews?: Array<{ rating: number }>;
  count?: number;
}) {
  if (!reviews || reviews.length === 0 || count === 0) return null;

  const avg = reviews.reduce((sum: number, r) => sum + r.rating, 0) / reviews.length;
  const rounded = Math.round(avg * 2) / 2; // nearest 0.5

  return (
    <div className="mt-1 flex items-center gap-1">
      <div className="flex items-center gap-0.5" aria-label={`Рейтинг ${avg.toFixed(1)} з 5`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.floor(rounded);
          const half = !filled && star - 0.5 === rounded;
          return (
            <svg key={star} width="11" height="11" viewBox="0 0 12 12" fill="none">
              {half ? (
                <>
                  <defs>
                    <linearGradient id={`h-${star}`} x1="0" x2="1" y1="0" y2="0">
                      <stop offset="50%" stopColor="var(--sl-status-warning)" />
                      <stop offset="50%" stopColor="var(--sl-bg-elevated)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M6 1l1.3 2.6 2.9.4-2.1 2 .5 2.9L6 7.4 3.4 8.9l.5-2.9-2.1-2 2.9-.4L6 1z"
                    fill={`url(#h-${star})`}
                    stroke="var(--sl-status-warning)"
                    strokeWidth="0.5"
                  />
                </>
              ) : (
                <path
                  d="M6 1l1.3 2.6 2.9.4-2.1 2 .5 2.9L6 7.4 3.4 8.9l.5-2.9-2.1-2 2.9-.4L6 1z"
                  fill={filled ? 'var(--sl-status-warning)' : 'var(--sl-bg-elevated)'}
                  stroke={filled ? 'var(--sl-status-warning)' : 'var(--sl-border-hover)'}
                  strokeWidth="0.5"
                />
              )}
            </svg>
          );
        })}
      </div>
      <span
        className="text-[10px] leading-none"
        style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
      >
        {avg.toFixed(1)} ({count ?? reviews.length})
      </span>
    </div>
  );
}

export default function ProductCard({ product, selectedVariant }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [imgError, setImgError] = useState(false);
  const firstVariant = selectedVariant ?? getFirstAvailableVariant(product);
  const { finalPrice, crossedPrice, promo } = getProductDisplayPrices(product, firstVariant);

  const isOutOfStock = selectedVariant
    ? (selectedVariant.stock ?? 0) === 0
    : product.variants && product.variants.length > 0
      ? product.variants.every((v) => (v.stock ?? 0) === 0)
      : (product.stock ?? 0) === 0;
  const { hasMultiple } = selectedVariant ? { hasMultiple: false } : getProductMinPrice(product);
  const mainImage = getMainImage(product);
  const highlights = selectedVariant?.selections?.length
    ? selectedVariant.selections
        .sort((a, b) => (a.optionValue.group.sortOrder ?? 0) - (b.optionValue.group.sortOrder ?? 0))
        .slice(0, 3)
        .map((s) => ({ label: s.optionValue.group.name, value: s.optionValue.value }))
    : pickCardHighlights(product);
  const cardHref = selectedVariant?.slug
    ? `/product/${selectedVariant.slug}`
    : getProductHref(product, firstVariant);

  // Unique wishlist key: prefer variant slug (unique per variant), fall back to product id
  const wishlistSlug = cardHref.replace('/product/', '');
  const wishlistName = selectedVariant?.selections?.length
    ? `${product.name} ${selectedVariant.selections
        .sort((a, b) => (a.optionValue.group.sortOrder ?? 0) - (b.optionValue.group.sortOrder ?? 0))
        .map((s) => s.optionValue.value)
        .join(' / ')}`
    : product.name;
  const wishlistItem = {
    key: selectedVariant?.slug ?? selectedVariant?.id ?? product.id,
    productId: product.id,
    variantId: selectedVariant?.id,
    slug: wishlistSlug,
    name: wishlistName,
    image: mainImage,
    price: finalPrice,
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: firstVariant?.id,
      slug: selectedVariant?.slug ?? firstVariant?.slug ?? product.slug,
      quantity: 1,
    });
    toast.success(`${product.name} додано в кошик`);
  };

  return (
    <div className={`sl-product-card group/card relative flex h-full flex-col overflow-hidden${isOutOfStock ? ' opacity-60' : ''}`}>
      {/* Image area */}
      <Link
        href={cardHref}
        className="relative aspect-square overflow-hidden"
        style={{ background: 'var(--sl-bg-elevated)' }}
      >
        {imgError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color: 'var(--sl-text-muted)' }}>
            <ImageOff className="h-8 w-8 opacity-40" />
            <span className="text-xs opacity-40" style={{ fontFamily: 'var(--sl-font-mono)' }}>Немає фото</span>
          </div>
        ) : (
          <>
            {/* Primary image — fades out on hover when second image exists */}
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className={`object-contain p-3 transition-all duration-500${(product.images?.length ?? 0) > 1 ? ' group-hover/card:opacity-0' : ' group-hover/card:scale-105'}`}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              onError={() => setImgError(true)}
            />
            {/* Second image — fades in on hover */}
            {(product.images?.length ?? 0) > 1 && (
              <Image
                src={product.images![1].url}
                alt={product.name}
                fill
                className="object-contain p-3 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            )}
          </>
        )}

        {/* Wishlist button — top right */}
        <div className="absolute right-2 top-2 z-10">
          <WishlistButton item={wishlistItem} size="sm" />
        </div>

        {/* Promo badge */}
        {promo && (
          <span
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold"
            style={{
              background: 'var(--sl-accent)',
              color: '#fff',
              fontFamily: 'var(--sl-font-mono)',
            }}
          >
            -{promo.discountPercent}%
          </span>
        )}
        {!promo && product.badge && (
          <span
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold"
            style={{
              background: product.badge === 'ХІТ' ? 'var(--sl-accent-muted)' : product.badge === 'НОВИНКА' ? 'rgba(59,130,246,0.12)' : product.badge === 'Б/В' ? 'rgba(100,116,139,0.12)' : product.badge === 'ЕКСКЛЮЗИВ' ? 'rgba(147,51,234,0.12)' : 'var(--sl-bg-elevated)',
              color: product.badge === 'ХІТ' ? 'var(--sl-accent)' : product.badge === 'НОВИНКА' ? '#3b82f6' : product.badge === 'Б/В' ? '#64748b' : product.badge === 'ЕКСКЛЮЗИВ' ? '#9333ea' : 'var(--sl-text-secondary)',
              border: `1px solid ${product.badge === 'ХІТ' ? 'var(--sl-accent)' : product.badge === 'НОВИНКА' ? '#93c5fd' : product.badge === 'Б/В' ? '#cbd5e1' : product.badge === 'ЕКСКЛЮЗИВ' ? '#d8b4fe' : 'var(--sl-border)'}`,
              fontFamily: 'var(--sl-font-mono)',
            }}
          >
            {product.badge}
          </span>
        )}

        {/* Hover overlay: compact specs strip */}
        {highlights.length > 0 && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 hidden translate-y-2 opacity-0 transition-all duration-200 ease-out md:block group-hover/card:translate-y-0 group-hover/card:opacity-100">
            <div
              className="overflow-hidden rounded-xl"
              style={{
                background: 'var(--sl-bg-surface-glass)',
                border: '1px solid var(--sl-border)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
              }}
            >
              {/* 2-column grid, up to 4 specs */}
              <div className="px-3 py-2.5" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 10px' }}>
                {highlights.slice(0, 4).map((item) => (
                  <div key={`${item.label}-${item.value}`} className="flex min-w-0 flex-col gap-0.5">
                    <span
                      className="truncate text-[9px] uppercase tracking-wide"
                      style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="truncate text-xs font-semibold leading-tight"
                      style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Link>

      {/* Info area */}
      <div
        className="flex flex-1 flex-col p-3"
        style={{ background: 'var(--sl-bg-surface)' }}
      >
        <Link
          href={cardHref}
          className="line-clamp-2 min-h-[2.75rem] text-sm font-medium leading-[1.4] transition-colors"
          style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--sl-text-primary)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--sl-text-secondary)')}
        >
          {selectedVariant?.selections && selectedVariant.selections.length > 0
            ? `${product.name} ${selectedVariant.selections
                .sort((a, b) => (a.optionValue.group.sortOrder ?? 0) - (b.optionValue.group.sortOrder ?? 0))
                .map((s) => s.optionValue.value)
                .join(' / ')}`
            : product.name}
        </Link>

        {/* Star rating */}
        <ProductRating reviews={product.reviews?.map((r) => ({ rating: r.rating }))} count={product._count?.reviews} />

        <div className="mt-auto flex flex-col gap-2 pt-2">
          {/* Price row */}
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex flex-col">
              <span
                className="whitespace-nowrap text-base font-semibold tracking-tight"
                style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}
              >
                {hasMultiple && (
                  <span className="mr-1 text-xs font-normal" style={{ color: 'var(--sl-text-muted)' }}>від</span>
                )}
                {formatPrice(finalPrice)}
              </span>
              {crossedPrice && (
                <span
                  className="whitespace-nowrap text-xs line-through"
                  style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
                >
                  {formatPrice(crossedPrice)}
                </span>
              )}
            </div>
            {/* Out-of-stock label — stays inline with price on all screens */}
            {isOutOfStock && (
              <span
                className="shrink-0 pb-0.5 text-xs font-medium"
                style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
              >
                Немає в наявності
              </span>
            )}
          </div>
          {/* Cart button — full-width below price; fills on card hover */}
          {!isOutOfStock && (
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex h-8 w-full items-center justify-center gap-1 rounded-lg border text-xs font-semibold transition-all duration-200 ease-out border-[var(--sl-accent)] text-[var(--sl-accent)] bg-transparent group-hover/card:bg-[var(--sl-accent)] group-hover/card:text-white"
              style={{ fontFamily: 'var(--sl-font-mono)' }}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="group-hover/card:hidden">Купити</span>
              <span className="hidden group-hover/card:inline">В кошик</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
