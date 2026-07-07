'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ImageOff, ShoppingCart } from 'lucide-react';
import { Product } from '@/types';
import { useState } from 'react';
import {
  formatPrice, getMainImage, getProductDisplayPrices, getProductHref,
  getFirstAvailableVariant, getProductMinPrice, pickCardHighlights, getBadgeStyle,
} from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { toast } from 'sonner';
import { Variant } from '@/types';
import WishlistButton from './WishlistButton';

interface Props {
  product: Product;
  selectedVariant?: Variant;
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
  const mainImage = getMainImage(product, firstVariant);
  const variantHighlights = selectedVariant?.selections?.length
    ? selectedVariant.selections
        .sort((a, b) => (a.optionValue.group.sortOrder ?? 0) - (b.optionValue.group.sortOrder ?? 0))
        .map((s) => ({ label: s.optionValue.group.name, value: s.optionValue.value }))
    : [];
  // Variant selections cover only their own option groups (e.g. just SSD size) —
  // fill remaining slots with product attributes so cards always show up to 4 specs.
  const usedLabels = new Set(variantHighlights.map((h) => h.label.toLowerCase()));
  const attributeHighlights = pickCardHighlights(product).filter((h) => !usedLabels.has(h.label.toLowerCase()));
  const highlights = [...variantHighlights, ...attributeHighlights].slice(0, 4);
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
            <div className="absolute inset-0 p-3">
              <div className="relative h-full w-full overflow-hidden rounded-lg">
                {/* Primary image — fades out on hover when second image exists */}
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  className={`object-cover transition-all duration-500${(product.images?.length ?? 0) > 1 ? ' group-hover/card:opacity-0' : ' group-hover/card:scale-105'}`}
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  onError={() => setImgError(true)}
                />
                {/* Second image — fades in on hover */}
                {(product.images?.length ?? 0) > 1 && (
                  <Image
                    src={product.images![1].url}
                    alt={product.name}
                    fill
                    className="object-cover opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                )}
              </div>
            </div>
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
            style={{ ...getBadgeStyle(product.badge), fontFamily: 'var(--sl-font-mono)' }}
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
          {/* Price row — price only; stock status never shares this row */}
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex flex-col overflow-hidden">
              <span
                className="truncate text-base font-semibold tracking-tight"
                style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}
              >
                {hasMultiple && (
                  <span className="mr-1 text-xs font-normal" style={{ color: 'var(--sl-text-muted)' }}>від</span>
                )}
                {formatPrice(finalPrice)}
              </span>
              {crossedPrice && (
                <span
                  className="truncate text-xs line-through"
                  style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
                >
                  {formatPrice(crossedPrice)}
                </span>
              )}
            </div>
          </div>
          {/* Status slot — full-width below price: out-of-stock label OR cart button, never price */}
          {isOutOfStock ? (
            <span
              className="flex h-8 w-full items-center justify-center text-xs font-medium"
              style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
            >
              Немає в наявності
            </span>
          ) : (
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
