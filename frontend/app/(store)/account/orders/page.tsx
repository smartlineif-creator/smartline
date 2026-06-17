'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock3, PackageCheck, ShoppingBag } from 'lucide-react';
import { getOrders } from '@/lib/api';
import { Order } from '@/types';
import { formatPrice, ORDER_STATUS_LABELS } from '@/lib/utils';

function formatOrderDate(value: string) {
  return new Date(value).toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getStatusTone(status: Order['status']) {
  if (status === 'DELIVERED') return { bg: 'rgba(16, 185, 129, 0.12)', color: 'var(--sl-status-success)', border: 'rgba(16, 185, 129, 0.28)' };
  if (status === 'CANCELLED') return { bg: 'rgba(239, 68, 68, 0.12)', color: 'var(--sl-status-error)', border: 'rgba(239, 68, 68, 0.28)' };
  if (status === 'SHIPPED') return { bg: 'rgba(245, 158, 11, 0.12)', color: 'var(--sl-status-warning)', border: 'rgba(245, 158, 11, 0.28)' };
  return { bg: 'var(--sl-accent-muted)', color: 'var(--sl-accent)', border: 'var(--sl-border-hover)' };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders()
      .then((res) => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

  if (loading) return (
    <div
      className="flex min-h-screen items-center justify-center text-sm"
      style={{ background: 'var(--sl-bg-primary)', color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
    >
      Завантаження...
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-75"
          style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Акаунт
        </Link>

        <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p
              className="mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
              style={{
                background: 'var(--sl-accent-muted)',
                color: 'var(--sl-accent)',
                border: '1px solid var(--sl-border-hover)',
                fontFamily: 'var(--sl-font-mono)',
              }}
            >
              Історія покупок
            </p>
            <h1
              className="text-3xl leading-tight sm:text-4xl"
              style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
            >
              Мої замовлення
            </h1>
            <p className="mt-2 max-w-xl text-sm sm:text-base" style={{ color: 'var(--sl-text-secondary)' }}>
              Відстежуйте статуси, суми та деталі кожної покупки без зайвих переходів.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
            >
              <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                Замовлень
              </p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}>
                {orders.length}
              </p>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
            >
              <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                Сума
              </p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}>
                {formatPrice(totalSpent)}
              </p>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div
            className="rounded-2xl px-5 py-14 text-center"
            style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
          >
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)' }}
            >
              <ShoppingBag className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-semibold" style={{ color: 'var(--sl-text-primary)' }}>
              Замовлень поки немає
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--sl-text-muted)' }}>
              Коли ви оформите покупку, тут зʼявиться статус, склад і сума замовлення.
            </p>
            <Link
              href="/catalog"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-opacity hover:opacity-85"
              style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
            >
              Перейти в каталог
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}>
            {orders.map((order, index) => {
              const tone = getStatusTone(order.status);
              const itemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="group block px-5 py-4 transition-all hover:bg-[color-mix(in_srgb,var(--sl-accent)_6%,transparent)] sm:px-6"
                  style={{ borderTop: index === 0 ? 'none' : '1px solid var(--sl-border)' }}
                >
                  <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--sl-text-primary)' }}>
                          Замовлення #{order.orderNumber}
                        </h2>
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{ background: tone.bg, color: tone.color, border: `1px solid ${tone.border}`, fontFamily: 'var(--sl-font-mono)' }}
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--sl-text-muted)' }}>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-4 w-4" />
                          {formatOrderDate(order.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <PackageCheck className="h-4 w-4" />
                          {itemsCount ? `${itemsCount} товарів` : 'Деталі замовлення'}
                        </span>
                      </div>
                    </div>

                    <div className="text-xl font-semibold md:text-right" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}>
                      {formatPrice(order.totalAmount)}
                    </div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all group-hover:translate-x-1" style={{ color: 'var(--sl-accent)', background: 'var(--sl-bg-elevated)' }}>
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
