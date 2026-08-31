'use client';

import { useState } from 'react';
import { Loader2, MailCheck, MailWarning } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { resendVerification } from '@/lib/api';

/** Shown in the account area while the signed-in user's email is unverified. */
export function EmailVerifyBanner() {
  const user = useAuthStore((s) => s.user);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerified) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification();
      setSent(true);
    } catch {
      // Leave the button available so the user can retry.
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="mb-6 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
      style={{
        background: 'color-mix(in srgb, var(--sl-accent) 8%, var(--sl-bg-surface))',
        border: '1px solid color-mix(in srgb, var(--sl-accent) 30%, transparent)',
      }}
    >
      <div className="flex items-start gap-3">
        <MailWarning className="h-5 w-5 shrink-0" style={{ color: 'var(--sl-accent)' }} />
        <p className="text-sm" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
          Ми надіслали лист на{' '}
          <span style={{ color: 'var(--sl-text-primary)', fontWeight: 600 }}>{user.email}</span>
          {' '}— відкрийте його, щоб підтвердити пошту й побачити всі замовлення.
        </p>
      </div>
      {sent ? (
        <span
          className="inline-flex shrink-0 items-center gap-2 text-sm font-medium"
          style={{ color: 'var(--sl-status-success)', fontFamily: 'var(--sl-font-mono)' }}
        >
          <MailCheck className="h-4 w-4" /> Лист надіслано
        </span>
      ) : (
        <button
          onClick={handleResend}
          disabled={sending}
          className="sl-hover-btn-primary inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold"
          style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)', opacity: sending ? 0.75 : 1 }}
        >
          {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Надсилаємо…</> : 'Не прийшов? Надіслати ще раз'}
        </button>
      )}
    </div>
  );
}
