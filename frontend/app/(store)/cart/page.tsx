'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShoppingCart, Tag } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { getProducts } from '@/lib/api';
import { Product } from '@/types';
import { formatPrice, getProductPrice, getMainImage, getProductHref } from '@/lib/utils';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) { setLoading(false); return; }
    setLoading(true);

    // Deduplicate by productId; fetch using slug when available (backend route is GET /products/:slug)
    const seen = new Set<string>();
    const fetchTargets = items
      .filter((i) => { if (seen.has(i.productId)) return false; seen.add(i.productId); return true; })
      .map((i) => ({ productId: i.productId, key: i.slug ?? i.productId }));

    Promise.all(
      fetchTargets.map(({ key }) =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${key}`, { credentials: 'include' })
          .then((r) => r.ok ? r.json() : null)
          .catch(() => null),
      ),
    ).then((data) => {
      const map: Record<string, Product> = {};
      data.forEach((p) => { if (p && p.id) map[p.id] = p; });
      setProducts(map);
      setLoading(false);
    });
  }, [items]);

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((sum, item) => {
    const product = products[item.productId];
    if (!product) return sum;
    const variant = product.variants?.find((v) => v.id === item.variantId);
    return sum + getProductPrice(product, variant) * item.quantity;
  }, 0);

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <div
        className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center"
        style={{ background: 'var(--sl-bg-primary)' }}
      >
        <div
          className="mb-8 flex h-28 w-28 items-center justify-center rounded-3xl"
          style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
        >
          <ShoppingBag className="h-12 w-12" style={{ color: 'var(--sl-text-muted)' }} />
        </div>
        <h1
          className="mb-3 text-3xl sm:text-4xl"
          style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
        >
          КОШИК ПОРОЖНІЙ
        </h1>
        <p className="mb-8 max-w-xs text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
          Додайте товари щоб оформити замовлення
        </p>
        <Link
          href="/catalog"
          className="flex h-12 items-center gap-2 rounded-xl px-6 text-sm font-semibold"
          style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--sl-accent-hover)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--sl-accent)')}
        >
          <ShoppingCart className="h-4 w-4" />
          Перейти до каталогу
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'var(--sl-accent-muted)', border: '1px solid var(--sl-accent)' }}
          >
            <ShoppingCart className="h-5 w-5" style={{ color: 'var(--sl-accent)' }} />
          </div>
          <h1
            className="text-3xl sm:text-4xl"
            style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
          >
            КОШИК
          </h1>
          <span
            className="rounded-full px-2.5 py-0.5 text-sm font-semibold"
            style={{ background: 'var(--sl-bg-elevated)', color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
          >
            {items.length}
          </span>
        </div>

        {/* Banner for legacy items without slug (added before this update) */}
        {items.some((i) => !i.slug) && !loading && Object.keys(products).length < items.length && (
          <div
            className="mb-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'color-mix(in srgb, var(--sl-status-warning) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--sl-status-warning) 30%, transparent)',
              color: 'var(--sl-status-warning)',
              fontFamily: 'var(--sl-font-mono)',
            }}
          >
            <span>Деякі товари додані до оновлення — видаліть їх і додайте знову</span>
            <button
              type="button"
              onClick={() => clearCart()}
              className="shrink-0 text-xs underline"
            >
              Очистити кошик
            </button>
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* ── Items list ── */}
          <div className="flex-1 space-y-3">
            {items.map((item) => {
              const product = products[item.productId];
              const variant = product?.variants?.find((v) => v.id === item.variantId);
              const price = product ? getProductPrice(product, variant) : 0;
              const productHref = product ? getProductHref(product, variant) : '#';
              const inStock = variant
                ? (variant.stock ?? 0) > 0
                : (product?.stock ?? 0) > 0;

              return (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="group/row flex gap-4 rounded-2xl p-4 transition-all"
                  style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--sl-border-hover)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--sl-border)')}
                >
                  {/* Image */}
                  <Link
                    href={productHref}
                    className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28"
                    style={{ background: 'var(--sl-bg-elevated)' }}
                  >
                    {loading ? (
                      <div className="h-full w-full animate-pulse" style={{ background: 'var(--sl-bg-elevated)' }} />
                    ) : product ? (
                      <Image
                        src={getMainImage(product, variant)}
                        alt={product.name}
                        fill
                        className="object-contain p-2 transition-transform duration-300 group-hover/row:scale-105"
                        sizes="112px"
                      />
                    ) : (
                      <div className="h-full w-full animate-pulse" style={{ background: 'var(--sl-bg-elevated)' }} />
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                    <div>
                      {loading ? (
                        <div className="h-4 w-3/4 animate-pulse rounded" style={{ background: 'var(--sl-bg-elevated)' }} />
                      ) : (
                        <Link
                          href={productHref}
                          className="line-clamp-2 text-sm font-medium leading-snug transition-colors sm:text-base"
                          style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--sl-accent)')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--sl-text-primary)')}
                        >
                          {product?.name ?? '—'}
                          {variant?.name && (
                            <span className="ml-1 font-normal" style={{ color: 'var(--sl-text-muted)' }}>
                              · {variant.name}
                            </span>
                          )}
                        </Link>
                      )}

                      {/* Stock status */}
                      {product && (
                        <p className="mt-1 text-xs" style={{
                          color: inStock ? 'var(--sl-status-success)' : 'var(--sl-status-warning)',
                          fontFamily: 'var(--sl-font-mono)',
                        }}>
                          {inStock ? '● В наявності' : '● Наявність уточнюється'}
                        </p>
                      )}
                    </div>

                    {/* Price + controls row */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Price */}
                      <div>
                        {loading ? (
                          <div className="h-5 w-20 animate-pulse rounded" style={{ background: 'var(--sl-bg-elevated)' }} />
                        ) : (
                          <>
                            <p
                              className="text-base font-bold sm:text-lg"
                              style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}
                            >
                              {formatPrice(price * item.quantity)}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-xs" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                                {formatPrice(price)} × {item.quantity}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      {/* Qty controls + delete */}
                      <div className="flex items-center gap-2">
                        <div
                          className="flex items-center gap-1 rounded-xl p-1"
                          style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
                        >
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                            style={{ color: 'var(--sl-text-secondary)' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-bg-surface)';
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-primary)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-secondary)';
                            }}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span
                            className="w-8 text-center text-sm font-semibold"
                            style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                            style={{ color: 'var(--sl-text-secondary)' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-bg-surface)';
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-primary)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-secondary)';
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          aria-label="Видалити товар"
                          className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                          style={{ border: '1px solid var(--sl-border)', color: 'var(--sl-text-muted)', background: 'transparent' }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'color-mix(in srgb, var(--sl-status-error) 40%, transparent)';
                            (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--sl-status-error) 8%, transparent)';
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-status-error)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sl-border)';
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-muted)';
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Sidebar ── */}
          <div className="w-full lg:sticky lg:top-[68px] lg:w-80 lg:shrink-0">
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
            >
              <p
                className="mb-4 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
              >
                Підсумок замовлення
              </p>

              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                    Товари ({totalQty} шт.)
                  </span>
                  <span style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}>
                    {formatPrice(total)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>Доставка</span>
                  <span style={{ color: 'var(--sl-status-success)', fontFamily: 'var(--sl-font-mono)', fontSize: '0.75rem' }}>
                    Уточнюється
                  </span>
                </div>
              </div>

              <div
                className="mb-5 flex justify-between border-t pt-4"
                style={{ borderColor: 'var(--sl-border)' }}
              >
                <span
                  className="text-base font-bold"
                  style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
                >
                  Разом
                </span>
                <span
                  className="text-xl font-bold tracking-tight"
                  style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
                >
                  {formatPrice(total)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: 'var(--sl-accent)',
                  color: '#fff',
                  fontFamily: 'var(--sl-font-mono)',
                  boxShadow: '0 0 24px var(--sl-accent-glow-strong)',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--sl-accent-hover)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--sl-accent)')}
              >
                Оформити замовлення
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/catalog"
                className="mb-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all"
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
              </Link>

              {/* Trust badges */}
              <div
                className="space-y-2 rounded-xl p-3"
                style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
              >
                {[
                  { icon: '🔒', text: 'Безпечна оплата' },
                  { icon: '🚚', text: 'Доставка 1–2 дні' },
                  { icon: '✅', text: 'Гарантія' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                    <span>{icon}</span>
                    {text}
                  </div>
                ))}
              </div>

              {/* Clear cart */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Очистити кошик? Це видалить усі товари.')) clearCart();
                }}
                className="mt-3 w-full text-center text-xs transition-colors"
                style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-status-error)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-muted)')}
              >
                Очистити кошик
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
