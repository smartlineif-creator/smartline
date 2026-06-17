'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowRight,
  BadgePercent,
  Headphones,
  LogOut,
  Package,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

function LoadingState({ label = 'Завантаження...' }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center text-sm"
      style={{ background: 'var(--sl-bg-primary)', color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
    >
      {label}
    </div>
  );
}

export default function AccountPage() {
  const { user, loading, fetchUser, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, router, user]);

  const handleLogout = async () => {
    await logout();
    toast.success('Ви вийшли з системи');
    router.push('/');
  };

  if (loading) return <LoadingState />;
  if (!user) return <LoadingState label="Переадресація..." />;

  return (
    <div className="min-h-screen" style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
              Акаунт SmartLine
            </p>
            <h1
              className="text-3xl leading-tight sm:text-4xl"
              style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
            >
              Особистий кабінет
            </h1>
            <p className="mt-2 max-w-xl text-sm sm:text-base" style={{ color: 'var(--sl-text-secondary)' }}>
              Тут зібрані ваші замовлення, контактні дані та швидкі дії після покупки.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all hover:opacity-80"
            style={{
              border: '1px solid var(--sl-border)',
              color: 'var(--sl-text-secondary)',
              background: 'var(--sl-bg-surface)',
              fontFamily: 'var(--sl-font-mono)',
            }}
          >
            <LogOut className="h-4 w-4" />
            Вийти
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section
            className="rounded-2xl p-5 sm:p-6"
            style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)', border: '1px solid var(--sl-border-hover)' }}
                >
                  <User className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>
                    {user.name || 'Клієнт SmartLine'}
                  </h2>
                  <p className="mt-1 truncate text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                    {user.email}
                  </p>
                  {user.phone && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                      {user.phone}
                    </p>
                  )}
                </div>
              </div>

              <div
                className="rounded-xl px-4 py-3"
                style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
              >
                <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                  Персональна знижка
                </p>
                <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}>
                  {user.discount > 0 ? `${user.discount}%` : '0%'}
                </p>
              </div>
            </div>
          </section>

          <section
            className="rounded-2xl p-5 sm:p-6"
            style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>
              Після покупки
            </h2>
            <div className="mt-4 grid gap-3">
              {[
                { icon: ShieldCheck, title: 'Гарантія і прозорість', text: 'Статус замовлення та дані товару завжди під рукою.' },
                { icon: Headphones, title: 'Підтримка', text: 'Підкажемо з оплатою, доставкою або вибором комплекту.' },
                { icon: BadgePercent, title: 'Персональні умови', text: 'Знижки й пропозиції видно у вашому профілі.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'var(--sl-bg-elevated)', color: 'var(--sl-accent)' }}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--sl-text-primary)' }}>{item.title}</p>
                    <p className="mt-0.5 text-sm leading-5" style={{ color: 'var(--sl-text-muted)' }}>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Link
            href="/account/orders"
            className="group rounded-2xl p-5 transition-all"
            style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)' }}
                >
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--sl-text-primary)' }}>Мої замовлення</h3>
                  <p className="mt-1 text-sm" style={{ color: 'var(--sl-text-muted)' }}>Переглянути статус, суму та склад замовлення.</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" style={{ color: 'var(--sl-accent)' }} />
            </div>
          </Link>

          <Link
            href="/catalog"
            className="group rounded-2xl p-5 transition-all"
            style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: 'var(--sl-bg-elevated)', color: 'var(--sl-accent)' }}
                >
                  <ArrowRight className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--sl-text-primary)' }}>Повернутись до каталогу</h3>
                  <p className="mt-1 text-sm" style={{ color: 'var(--sl-text-muted)' }}>Швидко знайти ще один товар або аксесуар.</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" style={{ color: 'var(--sl-accent)' }} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
