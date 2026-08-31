'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { hasStoredSession } from '@/lib/api';

/**
 * Post-purchase CTA on the success screen. Guests only — the mounted-gate
 * avoids an SSR hydration mismatch, since hasStoredSession() is always false
 * on the server but true for a logged-in buyer on the client.
 */
export function GuestAccountCta() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || hasStoredSession()) return null;

  return (
    <div
      className="mb-6 rounded-2xl p-5 text-left"
      style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'color-mix(in srgb, var(--sl-accent) 12%, transparent)', color: 'var(--sl-accent)' }}
        >
          <UserPlus className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>
            Створіть акаунт, щоб відстежувати замовлення
          </p>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
            Підтвердіть пошту — і всі ваші замовлення зберуться в одному кабінеті.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/register"
              className="sl-hover-btn-primary inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold"
              style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
            >
              Створити акаунт
            </Link>
            <Link
              href="/login"
              className="sl-hover-ghost inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold"
              style={{ background: 'transparent', color: 'var(--sl-accent)', border: '1px solid var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
            >
              Увійти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
