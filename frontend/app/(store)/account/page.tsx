'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowRight,
  Heart,
  LogOut,
  Package,
  User,
  UserCog,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getOrders } from '@/lib/api';
import { formatPrice, ORDER_STATUS_LABELS } from '@/lib/utils';
import { Order } from '@/types';

const STATUS_DOT: Record<string, string> = {
  NEW:       'var(--sl-status-info)',
  CONFIRMED: 'var(--sl-status-warning)',
  SHIPPED:   '#fb923c',
  DELIVERED: 'var(--sl-status-success)',
  CANCELLED: 'var(--sl-status-error)',
};

const NAV_ITEMS = [
  { href: '/account/orders', icon: Package,  label: 'Мої замовлення',    desc: 'Статус і деталі замовлень' },
  { href: '/account/settings', icon: UserCog, label: 'Особисті дані',   desc: 'Ім\'я, телефон, пароль' },
  { href: '/wishlist',         icon: Heart,   label: 'Обране',           desc: 'Відкладені товари' },
];

export default function AccountPage() {
  const { user, loading, fetchUser, logout } = useAuthStore();
  const router = useRouter();
  const [lastOrder, setLastOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, router, user]);

  useEffect(() => {
    if (!user) return;
    getOrders({ limit: '1', page: '1' })
      .then((res) => setLastOrder(res.data[0] ?? null))
      .catch(() => setLastOrder(null));
  }, [user]);

  const handleLogout = async () => {
    await logout();
    toast.success('Ви вийшли з системи');
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm"
        style={{ background: 'var(--sl-bg-primary)', color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
        {loading ? 'Завантаження...' : 'Переадресація...'}
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">

        {/* Header */}
        <div className="mb-7 flex items-center justify-between">
          <h1
            className="text-2xl font-bold sm:text-3xl"
            style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
          >
            ОСОБИСТИЙ КАБІНЕТ
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-60"
            style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Вийти
          </button>
        </div>

        {/* Top grid: Profile + Last order */}
        <div className="grid gap-4 sm:grid-cols-2">

          {/* Profile card */}
          <section
            className="rounded-2xl p-5"
            style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)', border: '1px solid var(--sl-border-hover)' }}
              >
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>
                  {user.name || 'Клієнт SmartLine'}
                </p>
                <p className="truncate text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                  {user.email}
                </p>
              </div>
              {user.discount > 0 && (
                <span
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold"
                  style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)', border: '1px solid var(--sl-border-hover)', fontFamily: 'var(--sl-font-mono)' }}
                >
                  -{user.discount}%
                </span>
              )}
            </div>

            {user.phone && (
              <p className="mt-3 text-sm" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}>
                {user.phone}
              </p>
            )}

            <div className="mt-4 flex gap-3" style={{ borderTop: '1px solid var(--sl-border)', paddingTop: '1rem' }}>
              <Link
                href="/account/settings"
                className="text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
              >
                Редагувати профіль
              </Link>
              <span style={{ color: 'var(--sl-border-hover)' }}>·</span>
              <Link
                href="/forgot-password"
                className="text-sm transition-opacity hover:opacity-70"
                style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
              >
                Змінити пароль
              </Link>
            </div>
          </section>

          {/* Last order */}
          <section
            className="rounded-2xl p-5"
            style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
              Останнє замовлення
            </p>

            {lastOrder === undefined && (
              <p className="text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                Завантаження...
              </p>
            )}

            {lastOrder === null && (
              <div>
                <p className="text-sm" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
                  Замовлень ще немає.
                </p>
                <Link
                  href="/catalog"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
                >
                  Перейти до каталогу <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {lastOrder && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}>
                    №{lastOrder.orderNumber}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: STATUS_DOT[lastOrder.status] ?? 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOT[lastOrder.status] ?? 'var(--sl-text-muted)', display: 'inline-block' }} />
                    {ORDER_STATUS_LABELS[lastOrder.status] ?? lastOrder.status}
                  </span>
                </div>
                <p className="text-xl font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}>
                  {formatPrice(Number(lastOrder.totalAmount))}
                </p>
                <Link
                  href={`/account/orders/${lastOrder.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
                >
                  Переглянути <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* Nav grid */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-2xl p-4 transition-all"
              style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--sl-border-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--sl-border)')}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--sl-bg-elevated)', color: 'var(--sl-accent)' }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>
                  {label}
                </p>
                <p className="text-xs" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                  {desc}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: 'var(--sl-text-muted)' }} />
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
