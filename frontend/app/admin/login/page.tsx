'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, TriangleAlert } from 'lucide-react';
import { login } from '@/lib/api';

export default function AdminLoginPage() {
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
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: '#fff',
    border: '1.5px solid #E2E8F0',
    color: '#0A0E1A',
    borderRadius: '10px',
    padding: '10px 14px',
    width: '100%',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s',
  } as React.CSSProperties;

  return (
    <div className="min-h-screen flex" style={{ background: '#F6F7FA' }}>

      {/* ── Left brand panel (desktop only) ── */}
      <div
        className="hidden lg:flex lg:w-[400px] xl:w-[440px] shrink-0 flex-col justify-between p-10"
        style={{ background: '#080C18', borderRight: '1px solid rgba(0,130,255,0.12)' }}
      >
        <div>
          {/* Logo mark + wordmark */}
          <div className="flex items-center gap-3 mb-12">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black"
              style={{ background: 'rgba(0,130,255,0.15)', color: '#0082FF', fontFamily: 'monospace', letterSpacing: '-0.05em' }}
            >
              SL
            </div>
            <span className="text-lg font-bold tracking-[0.12em]" style={{ color: '#EEF2FF', fontFamily: 'ui-sans-serif, system-ui' }}>
              SMART<span style={{ color: '#0082FF' }}>LINE</span>
            </span>
          </div>

          <h2 className="text-3xl font-bold mb-3 leading-snug" style={{ color: '#EEF2FF' }}>
            Admin console
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#8899BB' }}>
            Manage products, orders,<br />promotions and store settings.
          </p>
        </div>

        {/* Bottom info */}
        <div className="space-y-3">
          <div
            className="flex items-center gap-2.5 rounded-xl px-4 py-3"
            style={{ background: 'rgba(0,130,255,0.07)', border: '1px solid rgba(0,130,255,0.15)' }}
          >
            <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: '#0082FF' }} />
            <p className="text-xs" style={{ color: '#8899BB', fontFamily: 'monospace' }}>
              Restricted access · Authorized staff only
            </p>
          </div>
          <p className="text-center text-xs" style={{ color: '#4A5A7A', fontFamily: 'monospace' }}>
            © {new Date().getFullYear()} SmartLine
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black mb-3"
              style={{ background: '#080C18', color: '#0082FF', fontFamily: 'monospace' }}
            >
              SL
            </div>
            <span className="text-base font-bold tracking-[0.12em]" style={{ color: '#080C18' }}>
              SMART<span style={{ color: '#0082FF' }}>LINE</span>
            </span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold mb-1.5" style={{ color: '#0A0E1A' }}>
              Admin console
            </h1>
            <p className="text-sm" style={{ color: '#6070A0' }}>
              Sign in to manage products, orders, and store settings.
            </p>
          </div>

          {/* Inline error */}
          {error && (
            <div
              className="mb-5 flex items-start gap-3 rounded-xl px-4 py-3"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-px" style={{ color: '#EF4444' }} />
              <p className="text-sm" style={{ color: '#991B1B' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#0A0E1A' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#0082FF')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-sm font-medium" style={{ color: '#0A0E1A' }}>
                  Password
                </label>
                <a
                  href="/account/forgot"
                  className="text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: '#0082FF' }}
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#0082FF')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: '#9BA3B5' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {capsLock && (
                <div className="mt-1.5 flex items-center gap-1.5" style={{ color: '#D97706' }}>
                  <TriangleAlert className="h-3.5 w-3.5" />
                  <span className="text-xs">Caps Lock is on</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: loading ? '#3366AA' : '#0055CC', marginTop: '8px' }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#0077FF'; }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#0055CC'; }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Mobile footer */}
          <p className="mt-8 text-center text-xs lg:hidden" style={{ color: '#9BA3B5', fontFamily: 'monospace' }}>
            Restricted access · Authorized staff only
          </p>
        </div>
      </div>
    </div>
  );
}
