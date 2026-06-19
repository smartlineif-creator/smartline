'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Loader2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';
import { updateProfile, changePassword } from '@/lib/api';

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const local = digits.startsWith('380') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  const d = local.slice(0, 9);
  let out = '+380';
  if (d.length > 0) out += ' ' + d.slice(0, 2);
  if (d.length > 2) out += ' ' + d.slice(2, 5);
  if (d.length > 5) out += ' ' + d.slice(5, 7);
  if (d.length > 7) out += ' ' + d.slice(7, 9);
  return out === '+380' && raw === '' ? '' : out;
}

const inputCls = 'h-11 w-full rounded-xl px-4 text-sm outline-none transition-all';
const inputStyle = {
  background: 'var(--sl-bg-elevated)',
  border: '1px solid var(--sl-border)',
  color: 'var(--sl-text-primary)',
  fontFamily: 'var(--sl-font-body)',
};
const onFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'var(--sl-accent)');
const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'var(--sl-border)');

export default function AccountSettingsPage() {
  const { user, loading, fetchUser, setUser } = useAuthStore();
  const router = useRouter();

  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [capsLock, setCapsLock]               = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, router, user]);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setPhone(user.phone ?? '');
    }
  }, [user]);

  useEffect(() => {
    const sync = (e: KeyboardEvent) => setCapsLock(e.getModifierState('CapsLock'));
    window.addEventListener('keydown', sync);
    window.addEventListener('keyup', sync);
    return () => { window.removeEventListener('keydown', sync); window.removeEventListener('keyup', sync); };
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const updated = await updateProfile({ name, phone });
      setUser(updated);
      toast.success('Профіль оновлено');
    } catch (err: any) {
      toast.error(err.message || 'Помилка збереження');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Новий пароль має містити щонайменше 8 символів');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Пароль змінено');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Невірний поточний пароль');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm"
        style={{ background: 'var(--sl-bg-primary)', color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
        Завантаження...
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto max-w-xl px-4 py-8 sm:py-10">

        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Особистий кабінет
        </Link>

        <h1
          className="mb-8 text-2xl font-bold"
          style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
        >
          ОСОБИСТІ ДАНІ
        </h1>

        {/* Profile form */}
        <section
          className="mb-4 rounded-2xl p-6"
          style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
        >
          <h2 className="mb-5 font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>
            Контактні дані
          </h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
                Ім'я
              </label>
              <input
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
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
                Телефон
              </label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="+380 XX XXX XX XX"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className={inputCls}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className={inputCls}
                style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'var(--sl-accent)',
                color: '#fff',
                fontFamily: 'var(--sl-font-mono)',
                opacity: profileLoading ? 0.75 : 1,
                cursor: profileLoading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!profileLoading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-hover)'; }}
              onMouseLeave={(e) => { if (!profileLoading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)'; }}
            >
              {profileLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Зберігаємо…</> : 'Зберегти зміни'}
            </button>
          </form>
        </section>

        {/* Password form */}
        <section
          className="rounded-2xl p-6"
          style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
        >
          <h2 className="mb-5 font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>
            Зміна пароля
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
                Поточний пароль
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl pl-4 pr-11 text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--sl-text-muted)' }}>
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
                Новий пароль
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-11 w-full rounded-xl pl-4 pr-11 text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--sl-text-muted)' }}>
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
                Мінімум 8 символів
              </p>
              {capsLock && (
                <div className="mt-1.5 flex items-center gap-1.5" style={{ color: 'var(--sl-status-warning)' }}>
                  <TriangleAlert className="h-3.5 w-3.5" />
                  <span className="text-xs" style={{ fontFamily: 'var(--sl-font-mono)' }}>Caps Lock увімкнено</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                border: '1px solid var(--sl-accent)',
                color: 'var(--sl-accent)',
                background: 'transparent',
                fontFamily: 'var(--sl-font-mono)',
                opacity: passwordLoading ? 0.75 : 1,
                cursor: passwordLoading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!passwordLoading) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; } }}
              onMouseLeave={(e) => { if (!passwordLoading) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-accent)'; } }}
            >
              {passwordLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Змінюємо…</> : 'Змінити пароль'}
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}
