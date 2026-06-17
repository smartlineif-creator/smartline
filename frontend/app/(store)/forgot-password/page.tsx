'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || 'Помилка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-16"
      style={{ background: 'var(--sl-bg-primary)' }}
    >
      <div className="w-full max-w-sm">
        <h1
          className="mb-2 text-center text-4xl"
          style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
        >
          СКИДАННЯ ПАРОЛЯ
        </h1>

        <div
          className="mt-8 rounded-2xl p-6"
          style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
        >
          {sent ? (
            <div className="space-y-4 text-center">
              <p
                className="text-sm"
                style={{ color: '#10b981', fontFamily: 'var(--sl-font-mono)' }}
              >
                ✓ Якщо email зареєстровано, ви отримаєте лист із посиланням для скидання пароля.
              </p>
              <Link
                href="/login"
                className="text-sm"
                style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
              >
                ← Повернутися до входу
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl px-3 text-sm outline-none transition-all"
                  style={{
                    background: 'var(--sl-bg-elevated)',
                    border: '1px solid var(--sl-border)',
                    color: 'var(--sl-text-primary)',
                    fontFamily: 'var(--sl-font-body)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--sl-accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--sl-border)')}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold"
                style={{
                  background: loading ? 'var(--sl-bg-elevated)' : 'var(--sl-accent)',
                  color: loading ? 'var(--sl-text-muted)' : '#fff',
                  fontFamily: 'var(--sl-font-mono)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-hover)'; }}
                onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)'; }}
              >
                {loading ? 'Надсилання...' : 'Надіслати посилання'}
              </button>
              <Link
                href="/login"
                className="block text-center text-sm"
                style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
              >
                ← Повернутися до входу
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
