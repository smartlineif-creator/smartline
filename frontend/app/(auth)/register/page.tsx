'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { register } from '@/lib/api';

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  // Strip leading 380 if user typed it
  const local = digits.startsWith('380') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  const d = local.slice(0, 9);
  let out = '+380';
  if (d.length > 0) out += ' ' + d.slice(0, 2);
  if (d.length > 2) out += ' ' + d.slice(2, 5);
  if (d.length > 5) out += ' ' + d.slice(5, 7);
  if (d.length > 7) out += ' ' + d.slice(7, 9);
  return out === '+380' && raw === '' ? '' : out;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Пароль має містити щонайменше 8 символів.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({ email, password, name, phone });
      router.push('/account');
    } catch (err: any) {
      setError(err.message || 'Помилка реєстрації. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'h-12 w-full rounded-xl px-4 text-sm outline-none transition-all';
  const inputStyle = {
    background: 'var(--sl-bg-elevated)',
    border: '1px solid var(--sl-border)',
    color: 'var(--sl-text-primary)',
    fontFamily: 'var(--sl-font-body)',
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'var(--sl-accent)');
  const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'var(--sl-border)');

  return (
    <div className="w-full max-w-[480px]">
      <div className="mb-6">
        <h1
          className="mb-2 text-2xl font-bold"
          style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
        >
          Реєстрація
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
          Створіть обліковий запис для швидших покупок та відстеження замовлень.
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
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
              Ім'я
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Ваше ім'я"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
              Телефон
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="+380 XX XXX XX XX"
              value={phone}
              onChange={handlePhoneChange}
              className={inputCls}
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
              Email <span style={{ color: 'var(--sl-status-error)' }}>*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputCls}
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
              Пароль <span style={{ color: 'var(--sl-status-error)' }}>*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="h-12 w-full rounded-xl pl-4 pr-11 text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
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
            <p className="mt-1.5 text-xs" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
              Мінімум 8 символів
            </p>
          </div>

          {/* Legal */}
          <p className="text-xs leading-relaxed" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
            Реєструючись, ви погоджуєтеся з{' '}
            <Link href="/terms" className="transition-opacity hover:opacity-70" style={{ color: 'var(--sl-accent)' }}>
              Умовами використання
            </Link>
            {' '}та{' '}
            <Link href="/privacy" className="transition-opacity hover:opacity-70" style={{ color: 'var(--sl-accent)' }}>
              Політикою конфіденційності
            </Link>
            .
          </p>

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
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-hover)'; }}
            onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)'; }}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Реєструємо…</>
            ) : 'Зареєструватися'}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
        Вже маєте обліковий запис?{' '}
        <Link href="/login" className="font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--sl-accent)' }}>
          Увійти
        </Link>
      </p>
    </div>
  );
}
