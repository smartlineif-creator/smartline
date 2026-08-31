import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { GuestAccountCta } from '@/components/store/GuestAccountCta';

interface Props {
  searchParams: Promise<{ orderId?: string; orderNumber?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { orderId, orderNumber } = await searchParams;
  // The visible order number must match what emails, Telegram and the admin
  // show (#66) — the cuid tail is only a fallback for legacy links.
  const displayNumber = orderNumber ? `№${orderNumber}` : orderId ? orderId.slice(-8).toUpperCase() : null;

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-16"
      style={{ background: 'var(--sl-bg-primary)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-10 text-center"
        style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
      >
        {/* Icon */}
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}
        >
          <CheckCircle className="h-10 w-10" style={{ color: '#10b981' }} />
        </div>

        <h1
          className="mb-3 text-3xl"
          style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
        >
          ЗАМОВЛЕННЯ ОФОРМЛЕНО!
        </h1>

        <p
          className="mb-3 text-sm leading-relaxed"
          style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}
        >
          Дякуємо за покупку. Ми зв&apos;яжемося з вами найближчим часом.
        </p>

        {displayNumber && (
          <p
            className="mb-8 text-sm"
            style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
          >
            Номер замовлення:{' '}
            <span
              className="font-semibold"
              style={{ color: 'var(--sl-accent)' }}
            >
              {displayNumber}
            </span>
          </p>
        )}

        <GuestAccountCta />

        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="sl-hover-btn-primary flex h-11 items-center rounded-xl px-5 text-sm font-semibold"
            style={{
              background: 'var(--sl-accent)',
              color: '#fff',
              fontFamily: 'var(--sl-font-mono)',
            }}
          >
            На головну
          </Link>
          <Link
            href="/account/orders"
            className="sl-hover-ghost flex h-11 items-center rounded-xl px-5 text-sm font-semibold"
            style={{
              background: 'transparent',
              color: 'var(--sl-accent)',
              border: '1px solid var(--sl-accent)',
              fontFamily: 'var(--sl-font-mono)',
            }}
          >
            Мої замовлення
          </Link>
        </div>
      </div>
    </div>
  );
}
