'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Loader2, MailOpen } from 'lucide-react';
import { forgotPassword } from '@/lib/api';

const RESEND_COOLDOWN = 45;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      setCooldown(RESEND_COOLDOWN);
    } catch {
      // Neutral message — never reveal if email exists
      setSent(true);
      setCooldown(RESEND_COOLDOWN);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      await forgotPassword(email);
    } catch { /* silent */ } finally {
      setLoading(false);
      setCooldown(RESEND_COOLDOWN);
    }
  };

  return (
    <div className="w-full max-w-[480px]">
      <div className="mb-6">
        <h1
          className="mb-2 text-2xl font-bold"
          style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
        >
          Скидання пароля
        </h1>
        {!sent && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
            Введіть email, вказаний під час реєстрації. Ми надішлемо посилання для створення нового пароля.
          </p>
        )}
      </div>

      {error && (
        <div
          className="mb-5 flex items-start gap-3 rounded-xl px-4 py-3"
          style={{ background: 'color-mix(in srgb, var(--sl-status-error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--sl-status-error) 30%, transparent)' }}
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-px" style={{ color: 'var(--sl-status-error)' }} />
          <p className="text-sm" style={{ color: 'var(--sl-status-error)', fontFamily: 'var(--sl-font-body)' }}>{error}</p>
        </div>
      )}

      <div className="rounded-2xl p-7" style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}>
        {sent ? (
          /* ── Success state ── */
          <div className="space-y-5 text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'color-mix(in srgb, var(--sl-status-success) 12%, transparent)' }}
            >
              <MailOpen className="h-7 w-7" style={{ color: 'var(--sl-status-success)' }} />
            </div>
            <div>
              <p className="mb-1 font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>
                Перевірте пошту
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
                Якщо акаунт із адресою{' '}
                <span style={{ color: 'var(--sl-text-secondary)' }}>{email}</span>{' '}
                існує, ми надіслали посилання для скидання пароля.
              </p>
            </div>
            <button
              type="button"
              disabled={cooldown > 0 || loading}
              onClick={handleResend}
              className="text-sm transition-opacity"
              style={{
                color: cooldown > 0 ? 'var(--sl-text-muted)' : 'var(--sl-accent)',
                fontFamily: 'var(--sl-font-mono)',
                cursor: cooldown > 0 ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Надсилаємо…' : cooldown > 0
                ? `Надіслати повторно через ${cooldown} с`
                : 'Надіслати повторно'}
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-12 w-full rounded-xl px-4 text-sm outline-none transition-all"
                style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)', color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sl-accent)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--sl-border)')}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'var(--sl-accent)',
                color: '#fff',
                fontFamily: 'var(--sl-font-mono)',
                opacity: loading ? 0.75 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-hover)'; }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)'; }}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Надсилаємо…</>
              ) : 'Надіслати посилання'}
            </button>
          </form>
        )}
      </div>

      <Link
        href="/login"
        className="mt-5 flex items-center justify-center gap-1.5 text-sm transition-opacity hover:opacity-70"
        style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Повернутися до входу
      </Link>
    </div>
  );
}
