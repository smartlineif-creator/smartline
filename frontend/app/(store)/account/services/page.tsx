'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Wrench } from 'lucide-react';
import { getOrders } from '@/lib/api';
import { Order, OrderItem } from '@/types';
import {
  formatPrice,
  getServiceRedemptionLabel,
  getServiceRedemptionState,
  pluralUk,
  ServiceRedemptionState,
} from '@/lib/utils';

function formatServiceDate(value: string) {
  return new Date(value).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getRedemptionTone(state: ServiceRedemptionState) {
  if (state === 'done') return { bg: 'rgba(16, 185, 129, 0.12)', color: 'var(--sl-status-success)', border: 'rgba(16, 185, 129, 0.28)' };
  if (state === 'partial') return { bg: 'rgba(245, 158, 11, 0.12)', color: 'var(--sl-status-warning)', border: 'rgba(245, 158, 11, 0.28)' };
  return { bg: 'var(--sl-accent-muted)', color: 'var(--sl-accent)', border: 'var(--sl-border-hover)' };
}

interface ServiceRow {
  item: OrderItem;
  order: Order;
}

export default function AccountServicesPage() {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders({ hasService: 'true', limit: '100' })
      .then((res) => {
        const flat = res.data.flatMap((order) =>
          (order.items ?? [])
            .filter((item) => item.serviceId)
            .map((item) => ({ item, order })),
        );
        setRows(flat);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div
      className="flex min-h-screen items-center justify-center text-sm"
      style={{ background: 'var(--sl-bg-primary)', color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
    >
      Завантаження...
    </div>
  );

  const serviceCount = rows.reduce((sum, row) => sum + row.item.quantity, 0);

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

        <div className="mb-8">
          <p
            className="mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: 'var(--sl-accent-muted)',
              color: 'var(--sl-accent)',
              border: '1px solid var(--sl-border-hover)',
              fontFamily: 'var(--sl-font-mono)',
            }}
          >
            Куплені послуги
          </p>
          <h1
            className="text-3xl leading-tight sm:text-4xl"
            style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
          >
            Мої послуги
          </h1>
          <p className="mt-2 max-w-xl text-sm sm:text-base" style={{ color: 'var(--sl-text-secondary)' }}>
            {rows.length > 0
              ? `${serviceCount} ${pluralUk(serviceCount, 'послуга', 'послуги', 'послуг')} — стан кожної, скільки вже надано`
              : 'Стан кожної придбаної послуги — скільки вже надано, скільки лишилось'}
          </p>
        </div>

        {rows.length === 0 ? (
          <div
            className="rounded-2xl px-5 py-14 text-center"
            style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
          >
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)' }}
            >
              <Wrench className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-semibold" style={{ color: 'var(--sl-text-primary)' }}>
              Ви ще не замовляли послуг
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--sl-text-muted)' }}>
              Коли ви придбаєте послугу, тут з&apos;явиться її стан і історія погашення.
            </p>
            <Link
              href="/services"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-opacity hover:opacity-85"
              style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
            >
              Перейти до послуг
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}>
            {rows.map(({ item, order }, index) => {
              const state = getServiceRedemptionState(item);
              const tone = getRedemptionTone(state);
              return (
                <div
                  key={item.id}
                  className="grid gap-4 px-5 py-4 sm:px-6 md:grid-cols-[auto_1fr_auto] md:items-center"
                  style={{ borderTop: index === 0 ? 'none' : '1px solid var(--sl-border)', opacity: state === 'done' ? 0.5 : 1 }}
                >
                  <div
                    className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                    style={{ background: 'var(--sl-bg-elevated)', color: 'var(--sl-accent)' }}
                  >
                    {item.service?.coverImage ? (
                      <Image src={item.service.coverImage} alt={item.name} fill className="object-cover" sizes="48px" />
                    ) : (
                      <Wrench className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold" style={{ color: 'var(--sl-text-primary)' }}>
                        {item.name}
                      </h2>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: tone.bg, color: tone.color, border: `1px solid ${tone.border}`, fontFamily: 'var(--sl-font-mono)' }}
                      >
                        {getServiceRedemptionLabel(item)}
                      </span>
                    </div>
                    {item.variantName && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--sl-text-secondary)' }}>{item.variantName}</p>
                    )}
                    <p className="mt-2 text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                      {item.quantity} шт. × {formatPrice(item.price)}
                    </p>
                  </div>

                  <div className="text-sm md:text-right" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                    <p>Замовлення №{order.orderNumber}</p>
                    <p>{formatServiceDate(order.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
