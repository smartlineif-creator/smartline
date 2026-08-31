'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { hasStoredSession, resendVerification, verifyEmail } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

type State = 'loading' | 'done' | 'error';

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const fetchUser = useAuthStore((s) => s.fetchUser);

  const [state, setState] = useState<State>('loading');
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  // The token is single-use (deleted on success). Strict Mode double-mounts the
  // effect in dev — without this guard the second call would 400 and flip a
  // successful verification to `error`.
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (!token) {
      setState('error');
      return;
    }

    verifyEmail(token)
      .then(() => {
        setState('done');
        if (hasStoredSession()) fetchUser().catch(() => {});
      })
      .catch(() => setState('error'));
  }, [token, fetchUser]);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      setResent(true);
    } catch {
      // Leave the button available so the user can retry.
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-[480px]">
      <div
        className="rounded-2xl p-7 text-center"
        style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
      >
        {state === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" style={{ color: 'var(--sl-accent)' }} />
            <p className="text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
              Підтверджуємо пошту…
            </p>
          </div>
        )}

        {state === 'done' && (
          <div className="space-y-5">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'color-mix(in srgb, var(--sl-status-success) 12%, transparent)' }}
            >
              <CheckCircle2 className="h-7 w-7" style={{ color: 'var(--sl-status-success)' }} />
            </div>
            <div>
              <p className="mb-1 text-lg font-bold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>
                Пошту підтверджено
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
                Усі ваші замовлення тепер в особистому кабінеті.
              </p>
            </div>
            <Link
              href="/account/orders"
              className="sl-hover-btn-primary inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold"
              style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
            >
              До кабінету
            </Link>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-5">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'color-mix(in srgb, var(--sl-status-error) 12%, transparent)' }}
            >
              <AlertCircle className="h-7 w-7" style={{ color: 'var(--sl-status-error)' }} />
            </div>
            <div>
              <p className="mb-1 text-lg font-bold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>
                Посилання недійсне
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
                Лінк застарів або вже використаний. Надішліть новий лист для підтвердження.
              </p>
            </div>
            {hasStoredSession() ? (
              resent ? (
                <p
                  className="inline-flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'var(--sl-status-success)', fontFamily: 'var(--sl-font-mono)' }}
                >
                  <MailCheck className="h-4 w-4" /> Лист надіслано
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="sl-hover-btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold"
                  style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)', opacity: resending ? 0.75 : 1 }}
                >
                  {resending ? <><Loader2 className="h-4 w-4 animate-spin" /> Надсилаємо…</> : 'Надіслати новий лист'}
                </button>
              )
            ) : (
              <Link
                href="/login"
                className="sl-hover-btn-primary inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold"
                style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
              >
                Увійдіть, щоб надіслати новий лист
              </Link>
            )}
          </div>
        )}
      </div>

      <Link
        href="/"
        className="mt-5 flex items-center justify-center gap-1.5 text-sm transition-opacity hover:opacity-70"
        style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        На головну
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
