'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Eye, EyeOff, Loader2, Mail, MailCheck } from 'lucide-react';
import { register, resendVerification } from '@/lib/api';
import { formatPhone, isValidUAPhone } from '@/lib/validation';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // Prefill email from a just-completed guest checkout (no PII in the URL).
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('sl_checkout_email');
      if (saved) setEmail(saved);
    } catch {}
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Пароль має містити щонайменше 8 символів.');
      return;
    }
    if (phone && !isValidUAPhone(phone)) {
      setError('Введіть повний номер телефону: +380 XX XXX XX XX.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({ email, password, name, phone });
      setRegistered(true);
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

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      setResent(true);
    } catch {
      // Leave the option available so the user can retry.
    } finally {
      setResending(false);
    }
  };

  if (registered) {
    return (
      <div className="w-full max-w-[480px]">
        <div className="rounded-2xl p-7 text-center" style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}>
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'color-mix(in srgb, var(--sl-accent) 12%, transparent)' }}
          >
            <Mail className="h-7 w-7" style={{ color: 'var(--sl-accent)' }} />
          </div>
          <h1 className="mb-2 text-xl font-bold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>
            Майже готово!
          </h1>
          <p className="mb-1 text-sm leading-relaxed" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
            Ми надіслали лист для підтвердження на
          </p>
          <p className="mb-5 text-sm font-semibold" style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}>
            {email}
          </p>
          <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
            Відкрийте його й натисніть кнопку підтвердження — і всі ваші замовлення зберуться в кабінеті.
          </p>
          <Link
            href="/account"
            className="sl-hover-btn-primary flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold"
            style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
          >
            Перейти до кабінету
          </Link>
          <div className="mt-4">
            {resent ? (
              <p className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--sl-status-success)', fontFamily: 'var(--sl-font-mono)' }}>
                <MailCheck className="h-4 w-4" /> Лист надіслано ще раз
              </p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
                Не отримали лист?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="sl-hover-accent font-semibold underline underline-offset-4"
                  style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)', textDecorationThickness: '1.5px', opacity: resending ? 0.6 : 1, cursor: resending ? 'default' : 'pointer' }}
                >
                  {resending ? 'Надсилаємо…' : 'Надіслати ще раз'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

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
