'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Package,
  ReceiptText,
  Truck,
} from 'lucide-react';
import { getOrder } from '@/lib/api';
import { Order } from '@/types';
import { formatPrice, ORDER_STATUS_LABELS } from '@/lib/utils';

const STATUS_STEPS: Order['status'][] = ['NEW', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

function formatOrderDate(value: string) {
  return new Date(value).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getStatusTone(status: Order['status']) {
  if (status === 'DELIVERED') return { bg: 'rgba(16, 185, 129, 0.12)', color: 'var(--sl-status-success)', border: 'rgba(16, 185, 129, 0.28)' };
  if (status === 'CANCELLED') return { bg: 'rgba(239, 68, 68, 0.12)', color: 'var(--sl-status-error)', border: 'rgba(239, 68, 68, 0.28)' };
  if (status === 'SHIPPED') return { bg: 'rgba(245, 158, 11, 0.12)', color: 'var(--sl-status-warning)', border: 'rgba(245, 158, 11, 0.28)' };
  return { bg: 'var(--sl-accent-muted)', color: 'var(--sl-accent)', border: 'var(--sl-border-hover)' };
}

function getDeliverySummary(order: Order) {
  const delivery = order.delivery || {};
  return (
    delivery.address ||
    delivery.city ||
    delivery.warehouse ||
    delivery.method ||
    'Деталі доставки уточнюються менеджером'
  );
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrder(orderId)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return (
    <div
      className="flex min-h-screen items-center justify-center text-sm"
      style={{ background: 'var(--sl-bg-primary)', color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
    >
      Завантаження...
    </div>
  );

  if (!order) return (
    <div
      className="flex min-h-screen items-center justify-center text-sm"
      style={{ background: 'var(--sl-bg-primary)', color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
    >
      Замовлення не знайдено
    </div>
  );

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const tone = getStatusTone(order.status);
  const itemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <Link
          href="/account/orders"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-75"
          style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Усі замовлення
        </Link>

        <section
          className="mb-5 rounded-2xl p-5 sm:p-6"
          style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1
                  className="text-3xl leading-tight sm:text-4xl"
                  style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
                >
                  Замовлення #{order.orderNumber}
                </h1>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: tone.bg, color: tone.color, border: `1px solid ${tone.border}`, fontFamily: 'var(--sl-font-mono)' }}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" style={{ color: 'var(--sl-text-muted)' }}>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {formatOrderDate(order.createdAt)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {itemsCount} товарів
                </span>
              </div>
            </div>

            <div
              className="rounded-2xl px-5 py-4 lg:text-right"
              style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
            >
              <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                Сума замовлення
              </p>
              <p className="mt-1 text-3xl font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}>
                {formatPrice(order.totalAmount)}
              </p>
            </div>
          </div>

          {order.status !== 'CANCELLED' && currentStep >= 0 && (
            <div className="mt-7">
              <div className="grid gap-3 sm:grid-cols-4">
                {STATUS_STEPS.map((status, index) => {
                  const isDone = index <= currentStep;
                  return (
                    <div
                      key={status}
                      className="rounded-2xl p-4"
                      style={{
                        background: isDone ? 'var(--sl-accent-muted)' : 'var(--sl-bg-elevated)',
                        border: `1px solid ${isDone ? 'var(--sl-border-hover)' : 'var(--sl-border)'}`,
                      }}
                    >
                      <div
                        className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{
                          background: isDone ? 'var(--sl-accent)' : 'var(--sl-bg-surface)',
                          color: isDone ? '#fff' : 'var(--sl-text-muted)',
                        }}
                      >
                        {isDone ? <CheckCircle2 className="h-5 w-5" /> : <span style={{ fontFamily: 'var(--sl-font-mono)' }}>{index + 1}</span>}
                      </div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--sl-text-primary)' }}>
                        {ORDER_STATUS_LABELS[status]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section
            className="overflow-hidden rounded-2xl"
            style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
          >
            <div className="flex items-center gap-3 px-5 py-4 sm:px-6" style={{ borderBottom: '1px solid var(--sl-border)' }}>
              <ReceiptText className="h-5 w-5" style={{ color: 'var(--sl-accent)' }} />
              <h2 className="font-semibold" style={{ color: 'var(--sl-text-primary)' }}>Склад замовлення</h2>
            </div>

            <div>
              {order.items?.map((item, index) => (
                <div
                  key={item.id}
                  className="grid gap-4 px-5 py-4 sm:grid-cols-[72px_1fr_auto] sm:items-center sm:px-6"
                  style={{ borderTop: index === 0 ? 'none' : '1px solid var(--sl-border)' }}
                >
                  <div
                    className="relative h-18 w-18 overflow-hidden rounded-2xl"
                    style={{ background: 'var(--sl-bg-elevated)' }}
                  >
                    {item.product?.images?.[0] ? (
                      <Image src={item.product.images[0].url} alt={item.name} fill className="object-contain p-2" sizes="72px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center" style={{ color: 'var(--sl-text-muted)' }}>
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold" style={{ color: 'var(--sl-text-primary)' }}>{item.name}</p>
                    {item.variantName && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                        {item.variantName}
                      </p>
                    )}
                    <p className="mt-2 text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                      {item.quantity} шт. × {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="text-lg font-semibold sm:text-right" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}>
                    {formatPrice(Number(item.price) * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-5">
            {order.ttn && (
              <section
                className="rounded-2xl p-5"
                style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)' }}>
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold" style={{ color: 'var(--sl-text-primary)' }}>Трекінг посилки</p>
                    <a
                      href={`https://novaposhta.ua/tracking/?cargo_number=${order.ttn}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-75"
                      style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
                    >
                      {order.ttn}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </section>
            )}

            <section
              className="rounded-2xl p-5"
              style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
            >
              <h2 className="font-semibold" style={{ color: 'var(--sl-text-primary)' }}>Доставка</h2>
              <p className="mt-2 text-sm leading-6" style={{ color: 'var(--sl-text-secondary)' }}>
                {getDeliverySummary(order)}
              </p>
              <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--sl-border)' }}>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm" style={{ color: 'var(--sl-text-muted)' }}>Разом</span>
                  <span className="text-xl font-semibold" style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}>
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
