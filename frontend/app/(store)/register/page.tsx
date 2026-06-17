'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { register } from '@/lib/api';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ email, password, name, phone });
      toast.success('Реєстрацію успішно завершено');
      router.push('/account');
    } catch (err: any) {
      toast.error(err.message || 'Помилка реєстрації');
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

  const labelStyle = {
    color: 'var(--sl-text-secondary)',
    fontFamily: 'var(--sl-font-mono)',
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
          РЕЄСТРАЦІЯ
        </h1>
        <p className="mb-8 text-center text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
          Створіть акаунт SmartLine
        </p>

        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Ім'я", value: name, onChange: setName, placeholder: "Іван Іванов", type: 'text' },
              { label: 'Телефон', value: phone, onChange: setPhone, placeholder: '+380501234567', type: 'tel' },
              { label: 'Email *', value: email, onChange: setEmail, placeholder: '', type: 'email', required: true },
              { label: 'Пароль *', value: password, onChange: setPassword, placeholder: '', type: 'password', required: true },
            ].map((field) => (
              <div key={field.label}>
                <label
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-widest"
                  style={labelStyle}
                >
                  {field.label}
                </label>
                {field.type === 'password' ? (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      required={field.required}
                      minLength={6}
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
                ) : (
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="h-11 w-full rounded-xl px-3 text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--sl-accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--sl-border)')}
                  />
                )}
              </div>
            ))}

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
              {loading ? 'Завантаження...' : 'Зареєструватися'}
            </button>
          </form>
        </div>

        <div className="mt-5 text-center text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
          Вже є акаунт?{' '}
          <Link
            href="/login"
            style={{ color: 'var(--sl-accent)' }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--sl-accent-hover)')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--sl-accent)')}
          >
            Увійти
          </Link>
        </div>
      </div>
    </div>
  );
}
