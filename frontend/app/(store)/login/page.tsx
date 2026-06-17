'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '@/lib/api';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Ви увійшли в систему');
      router.push('/account');
    } catch (err: any) {
      toast.error(err.message || 'Невірний email або пароль');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'var(--sl-bg-elevated)',
    border: '1px solid var(--sl-border)',
    color: 'var(--sl-text-primary)',
    fontFamily: 'var(--sl-font-body)',
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
          ВХІД
        </h1>
        <p className="mb-8 text-center text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
          Увійдіть у свій акаунт SmartLine
        </p>

        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
        >
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
                autoFocus
                className="h-11 w-full rounded-xl px-3 text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--sl-accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--sl-border)')}
              />
            </div>
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}
              >
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl pl-3 pr-10 text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--sl-accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--sl-border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--sl-text-muted)' }}
                  aria-label={showPassword ? 'Приховати пароль' : 'Показати пароль'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all"
              style={{
                background: loading ? 'var(--sl-bg-elevated)' : 'var(--sl-accent)',
                color: loading ? 'var(--sl-text-muted)' : '#fff',
                fontFamily: 'var(--sl-font-mono)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-hover)'; }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)'; }}
            >
              {loading ? 'Завантаження...' : 'Увійти'}
            </button>
          </form>
        </div>

        <div className="mt-5 space-y-2 text-center text-sm" style={{ fontFamily: 'var(--sl-font-mono)' }}>
          <div>
            <Link
              href="/forgot-password"
              style={{ color: 'var(--sl-accent)' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--sl-accent-hover)')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--sl-accent)')}
            >
              Забули пароль?
            </Link>
          </div>
          <div style={{ color: 'var(--sl-text-muted)' }}>
            Немає акаунту?{' '}
            <Link
              href="/register"
              style={{ color: 'var(--sl-accent)' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--sl-accent-hover)')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--sl-accent)')}
            >
              Зареєструватися
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
