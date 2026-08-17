'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShoppingCart, Tag, Wrench } from 'lucide-react';
import { cartProductKey, useCartStore } from '@/store/cart';
import { getProducts, getService } from '@/lib/api';
import { CartLocalItem, Product, Service } from '@/types';
import { formatPrice, getProductDisplayPrices, getMainImage, getProductHref } from '@/lib/utils';

export default function CartPage() {
  const { items, updateQuantity, removeItem, updateServiceQuantity, removeServiceItem, syncStockLimits, clearCart } = useCartStore();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [services, setServices] = useState<Record<string, Service>>({});
  const [loading, setLoading] = useState(true);

  // Which products the page needs, as a plain string. Changing a quantity
  // rewrites the `items` array, so an effect keyed on `items` refetched — and
  // flashed every row's skeleton — on every +/- click. The signature only
  // changes when a line is actually added or removed.
  const fetchSignature = useMemo(() => {
    const seen = new Set<string>();
    return items
      .filter((i) => i.itemType !== 'service' && !!i.productId)
      .filter((i) => { if (seen.has(i.productId!)) return false; seen.add(i.productId!); return true; })
      // Backend route is GET /products/:slug — fall back to the id for legacy lines.
      .map((i) => i.slug ?? i.productId!)
      .join('|');
  }, [items]);

  useEffect(() => {
    const keys = fetchSignature ? fetchSignature.split('|') : [];
    if (keys.length === 0) { setProducts({}); setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    Promise.all(
      keys.map((key) =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${key}`, { credentials: 'include' })
          .then((r) => r.ok ? r.json() : null)
          .catch(() => null),
      ),
    ).then((data: (Product | null)[]) => {
      if (cancelled) return;
      const map: Record<string, Product> = {};
      data.forEach((p) => { if (p && p.id) map[p.id] = p; });
      setProducts(map);
      setLoading(false);

      // Live stock wins over whatever the line was written with — it may have
      // been added before this cap existed, or sold down since.
      const limits: Record<string, number> = {};
      // Mirror exactly what the order endpoint decrements: a line without a
      // variant is checked against `product.stock`, never the variant sum.
      for (const product of Object.values(map)) {
        limits[cartProductKey(product.id, undefined)] = product.stock ?? 0;
        for (const variant of product.variants ?? []) {
          limits[cartProductKey(product.id, variant.id)] = variant.stock ?? 0;
        }
      }
      syncStockLimits(limits);
    });

    return () => { cancelled = true; };
  }, [fetchSignature, syncStockLimits]);

  // Services the page needs — same idea as fetchSignature above.
  const serviceSignature = useMemo(() => {
    const seen = new Set<string>();
    return items
      .filter((i) => i.itemType === 'service' && !!i.serviceId)
      .filter((i) => { if (seen.has(i.serviceId!)) return false; seen.add(i.serviceId!); return true; })
      .map((i) => i.serviceSlug ?? i.serviceId!)
      .join('|');
  }, [items]);

  useEffect(() => {
    const slugs = serviceSignature ? serviceSignature.split('|') : [];
    if (slugs.length === 0) { setServices({}); return; }

    let cancelled = false;
    Promise.all(slugs.map((slug) => getService(slug).catch(() => null))).then((data) => {
      if (cancelled) return;
      const map: Record<string, Service> = {};
      data.forEach((s) => { if (s && s.id) map[s.id] = s; });
      setServices(map);
    });

    return () => { cancelled = true; };
  }, [serviceSignature]);

  // Live price wins over the snapshot stored when the line was added — the
  // order endpoint prices from the DB, so the cart must show the same number.
  const getServiceLinePrice = (item: CartLocalItem): number => {
    const service = item.serviceId ? services[item.serviceId] : undefined;
    if (!service) return item.servicePrice ?? 0;
    const tier = item.tierId ? service.tiers?.find((t) => t.id === item.tierId) : undefined;
    return Number(tier?.price ?? service.price);
  };

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((sum, item) => {
    if (item.itemType === 'service') {
      return sum + getServiceLinePrice(item) * item.quantity;
    }
    const product = item.productId ? products[item.productId] : undefined;
    if (!product) return sum;
    const variant = product.variants?.find((v) => v.id === item.variantId);
    return sum + getProductDisplayPrices(product, variant).finalPrice * item.quantity;
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

        {/* Banner for legacy product items without slug (added before this update) */}
        {items.some((i) => i.itemType !== 'service' && !i.slug) && !loading && Object.keys(products).length < items.filter((i) => i.itemType !== 'service').length && (
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
              /* ── Service item ── */
              if (item.itemType === 'service') {
                const servicePrice = getServiceLinePrice(item);
                return (
                  <div
                    key={`service-${item.serviceId}-${item.tierId ?? ''}`}
                    className="group/row flex gap-4 rounded-2xl p-4 transition-all"
                    style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--sl-border-hover)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--sl-border)')}
                  >
                    {/* Service icon placeholder */}
                    <Link
                      href={item.serviceSlug ? `/services/${item.serviceSlug}` : '/services'}
                      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28 flex items-center justify-center"
                      style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
                    >
                      <Wrench className="h-10 w-10" style={{ color: 'var(--sl-accent)' }} />
                    </Link>

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                      <div>
                        <span
                          className="mb-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{ background: 'color-mix(in srgb, var(--sl-accent) 12%, transparent)', color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
                        >
                          Послуга
                        </span>
                        <Link
                          href={item.serviceSlug ? `/services/${item.serviceSlug}` : '/services'}
                          className="block line-clamp-2 text-sm font-medium leading-snug transition-colors sm:text-base"
                          style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--sl-accent)')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--sl-text-primary)')}
                        >
                          {item.serviceName ?? '—'}
                        </Link>
                        {item.tierLabel && (
                          <p
                            className="mt-0.5 text-xs"
                            style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
                          >
                            {item.tierLabel}
                          </p>
                        )}
                      </div>

                      {/* Price + controls row */}
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p
                            className="text-base font-bold sm:text-lg"
                            style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}
                          >
                            {formatPrice(servicePrice * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                              {formatPrice(servicePrice)} × {item.quantity}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div
                            className="flex items-center gap-1 rounded-xl p-1"
                            style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
                          >
                            <button
                              onClick={() => updateServiceQuantity(item.serviceId!, item.tierId, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                              style={{ color: 'var(--sl-text-secondary)' }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-bg-surface)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-primary)'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-secondary)'; }}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateServiceQuantity(item.serviceId!, item.tierId, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                              style={{ color: 'var(--sl-text-secondary)' }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-bg-surface)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-primary)'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-secondary)'; }}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeServiceItem(item.serviceId!, item.tierId)}
                            aria-label="Видалити товар"
                            className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                            style={{ border: '1px solid var(--sl-border)', color: 'var(--sl-text-muted)', background: 'transparent' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'color-mix(in srgb, var(--sl-status-error) 40%, transparent)'; (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--sl-status-error) 8%, transparent)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-status-error)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sl-border)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-muted)'; }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              /* ── Product item ── */
              const product = item.productId ? products[item.productId] : undefined;
              const variant = product?.variants?.find((v) => v.id === item.variantId);
              const price = product ? getProductDisplayPrices(product, variant).finalPrice : 0;
              const productHref = product ? getProductHref(product, variant) : '#';
              const inStock = variant
                ? (variant.stock ?? 0) > 0
                : (product?.stock ?? 0) > 0;
              // 0 / undefined means "stock unknown" — never a hard zero ceiling.
              const maxQty = item.maxQuantity ?? 0;
              const atMax = maxQty > 0 && item.quantity >= maxQty;

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
                    {product ? (
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
                      {!product ? (
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
                      {atMax && (
                        <p className="mt-1 text-xs" style={{ color: 'var(--sl-status-warning)', fontFamily: 'var(--sl-font-mono)' }}>
                          Це вся доступна кількість — {maxQty} шт.
                        </p>
                      )}
                    </div>

                    {/* Price + controls row */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Price */}
                      <div>
                        {!product ? (
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
                            onClick={() => updateQuantity(item.productId!, item.variantId, item.quantity - 1)}
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
                            onClick={() => updateQuantity(item.productId!, item.variantId, item.quantity + 1)}
                            disabled={atMax}
                            aria-label={atMax ? `Доступно лише ${maxQty} шт.` : 'Збільшити кількість'}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
                            style={{
                              color: atMax ? 'var(--sl-text-muted)' : 'var(--sl-text-secondary)',
                              cursor: atMax ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              if (atMax) return;
                              (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-bg-surface)';
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-primary)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                              (e.currentTarget as HTMLButtonElement).style.color = atMax ? 'var(--sl-text-muted)' : 'var(--sl-text-secondary)';
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.productId!, item.variantId)}
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
