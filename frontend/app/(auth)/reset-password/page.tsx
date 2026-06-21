'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { resetPassword } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError('Посилання недійсне або застаріле. Запросіть нове.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Пароль має бути не менше 6 символів'); return; }
    if (password !== confirm) { setError('Паролі не збігаються'); return; }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch {
      setError('Посилання недійсне або застаріло. Запросіть нове скидання пароля.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px]">
      <div className="mb-6">
        <h1
          className="mb-2 text-2xl font-bold"
          style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
        >
          Новий пароль
        </h1>
        {!done && !error && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
            Придумайте надійний пароль для вашого акаунта.
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
        {done ? (
          <div className="space-y-5 text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'color-mix(in srgb, var(--sl-status-success) 12%, transparent)' }}
            >
              <CheckCircle2 className="h-7 w-7" style={{ color: 'var(--sl-status-success)' }} />
            </div>
            <div>
              <p className="mb-1 font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>
                Пароль змінено
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
                Перенаправляємо на сторінку входу…
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
                Новий пароль
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  disabled={!token}
                  className="h-12 w-full rounded-xl px-4 pr-11 text-sm outline-none transition-all"
                  style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)', color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sl-accent)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--sl-border)')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                  style={{ color: 'var(--sl-text-secondary)' }}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
                Підтвердження пароля
              </label>
              <input
                id="confirm"
                type={showPwd ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={!token}
                className="h-12 w-full rounded-xl px-4 text-sm outline-none transition-all"
                style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)', color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sl-accent)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--sl-border)')}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'var(--sl-accent)',
                color: '#fff',
                fontFamily: 'var(--sl-font-mono)',
                opacity: loading || !token ? 0.75 : 1,
                cursor: loading || !token ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!loading && token) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-hover)'; }}
              onMouseLeave={(e) => { if (!loading && token) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)'; }}
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Зберігаємо…</> : 'Зберегти пароль'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
