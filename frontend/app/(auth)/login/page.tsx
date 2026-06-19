'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Eye, EyeOff, Loader2, TriangleAlert } from 'lucide-react';
import { login } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [capsLock, setCapsLock] = useState(false);

  const syncCapsLock = useCallback((e: KeyboardEvent) => {
    setCapsLock(e.getModifierState('CapsLock'));
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', syncCapsLock);
    window.addEventListener('keyup', syncCapsLock);
    return () => {
      window.removeEventListener('keydown', syncCapsLock);
      window.removeEventListener('keyup', syncCapsLock);
    };
  }, [syncCapsLock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/account');
    } catch (err: any) {
      setError(err.message || 'Невірний email або пароль. Спробуйте ще раз.');
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
          Вхід
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
          Увійдіть, щоб переглядати замовлення та швидше оформлювати покупки.
        </p>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}
            >
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

          {/* Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium"
                style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}
              >
                Пароль
              </label>
              <Link
                href="/forgot-password"
                className="text-xs transition-opacity hover:opacity-70"
                style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
              >
                Забули пароль?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 w-full rounded-xl pl-4 pr-11 text-sm outline-none transition-all"
                style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)', color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--sl-accent)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--sl-border)')}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                style={{ color: 'var(--sl-text-muted)' }}
                aria-label={showPassword ? 'Приховати пароль' : 'Показати пароль'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {capsLock && (
              <div className="mt-1.5 flex items-center gap-1.5" style={{ color: 'var(--sl-status-warning)' }}>
                <TriangleAlert className="h-3.5 w-3.5" />
                <span className="text-xs" style={{ fontFamily: 'var(--sl-font-mono)' }}>Caps Lock увімкнено</span>
              </div>
            )}
          </div>

          {/* Submit */}
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
              marginTop: '8px',
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-hover)'; }}
            onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)'; }}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Входимо…</>
            ) : 'Увійти'}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
        Немає облікового запису?{' '}
        <Link href="/register" className="font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--sl-accent)' }}>
          Зареєструватися
        </Link>
      </p>
    </div>
  );
}
