'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, HeartOff, ShoppingCart, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlist';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export default function WishlistPage() {
  const { items, toggle } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items],
  );

  const handleAddAll = () => {
    items.forEach((item) => addItem({ productId: item.productId, variantId: item.variantId, slug: item.slug, quantity: 1 }));
    toast.success(`${items.length} товарів додано до кошика`);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--sl-bg-primary)' }}>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-8 h-12 w-52 animate-pulse rounded-xl" style={{ background: 'var(--sl-bg-elevated)' }} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl" style={{ background: 'var(--sl-bg-surface)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center" style={{ background: 'var(--sl-bg-primary)' }}>
        <div
          className="relative mb-8 flex h-28 w-28 items-center justify-center rounded-3xl"
          style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
        >
          <HeartOff className="h-12 w-12" style={{ color: 'var(--sl-text-muted)' }} />
          <div
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full"
            style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
          >
            <span className="text-sm">0</span>
          </div>
        </div>
        <h1
          className="mb-3 text-2xl font-semibold"
          style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
        >
          Список вибраного порожній
        </h1>
        <p className="mb-8 max-w-xs text-sm leading-relaxed" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
          Натискайте ♡ на товарах щоб зберігати їх тут і повертатися пізніше
        </p>
        <Link
          href="/catalog"
          className="flex h-12 items-center gap-2 rounded-xl px-6 text-sm font-semibold"
          style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
        >
          <Sparkles className="h-4 w-4" />
          Перейти до каталогу
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  /* ── Main layout ── */
  return (
    <div className="min-h-screen" style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">

        {/* ── Page header ── */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: 'color-mix(in srgb, var(--sl-status-error) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--sl-status-error) 30%, transparent)',
              }}
            >
              <Heart
                className="h-5 w-5"
                style={{ color: 'var(--sl-status-error)', fill: 'var(--sl-status-error)' }}
              />
            </div>
            <h1
              className="text-3xl sm:text-4xl"
              style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
            >
              ВИБРАНЕ
            </h1>
            <span
              className="rounded-full px-2.5 py-0.5 text-sm font-semibold"
              style={{ background: 'var(--sl-bg-elevated)', color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
            >
              {items.length}
            </span>
          </div>

          {/* Desktop: add-all button */}
          <button
            type="button"
            onClick={handleAddAll}
            className="hidden h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold sm:flex"
            style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-hover)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)')}
          >
            <ShoppingCart className="h-4 w-4" />
            Додати все до кошика
          </button>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* ── Items grid ── */}
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.key}
                className="group/wish relative flex flex-col overflow-hidden rounded-2xl transition-all duration-200"
                style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--sl-border-hover)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--sl-border)')}
              >
                {/* Remove button — top right */}
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  aria-label="Видалити з вибраного"
                  className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full opacity-0 transition-all group-hover/wish:opacity-100"
                  style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--sl-status-error) 10%, transparent)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'color-mix(in srgb, var(--sl-status-error) 40%, transparent)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-bg-surface)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sl-border)';
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--sl-status-error)' }} />
                </button>

                {/* Image */}
                <Link
                  href={`/product/${item.slug}`}
                  className="relative aspect-square overflow-hidden"
                  style={{ background: 'var(--sl-bg-elevated)' }}
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-3 transition-transform duration-300 group-hover/wish:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </Link>

                {/* Info */}
                <div className="flex flex-1 flex-col p-3">
                  <Link
                    href={`/product/${item.slug}`}
                    className="mb-2 line-clamp-2 text-sm font-medium leading-snug transition-colors"
                    style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--sl-text-primary)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--sl-text-secondary)')}
                  >
                    {item.name}
                  </Link>
                  <p
                    className="mb-3 text-base font-semibold tracking-tight"
                    style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}
                  >
                    {formatPrice(item.price)}
                  </p>

                  {/* Buy button */}
                  <button
                    type="button"
                    onClick={() => {
                      addItem({ productId: item.productId, variantId: item.variantId, slug: item.slug, quantity: 1 });
                      toast.success(`${item.name} додано в кошик`);
                    }}
                    className="mt-auto flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-hover)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)')}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Купити
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Sidebar summary ── */}
          <div
            className="w-full rounded-2xl p-5 lg:sticky lg:top-[68px] lg:w-72 lg:shrink-0"
            style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
          >
            <p
              className="mb-4 text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
            >
              Підсумок
            </p>

            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>Товарів</span>
                <span style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}>{items.length} шт.</span>
              </div>
              <div
                className="flex justify-between border-t pt-2 text-base font-bold"
                style={{ borderColor: 'var(--sl-border)' }}
              >
                <span style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}>Разом</span>
                <span style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}>{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddAll}
              className="mb-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-hover)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)')}
            >
              <ShoppingCart className="h-4 w-4" />
              Додати все до кошика
            </button>

            <Link
              href="/catalog"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                border: '1px solid var(--sl-border)',
                color: 'var(--sl-text-secondary)',
                background: 'transparent',
                fontFamily: 'var(--sl-font-mono)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--sl-border-hover)';
                (e.currentTarget as HTMLElement).style.color = 'var(--sl-text-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--sl-border)';
                (e.currentTarget as HTMLElement).style.color = 'var(--sl-text-secondary)';
              }}
            >
              Продовжити покупки
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
