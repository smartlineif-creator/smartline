'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function StoreError({ error, reset }: Props) {
  useEffect(() => {
    // Log to error tracking in production
    console.error('[StoreError]', error);
  }, [error]);

  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center"
      style={{ background: 'var(--sl-bg-primary)' }}
    >
      <div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)' }}
      >
        <AlertTriangle className="h-7 w-7" style={{ color: 'var(--sl-status-error)' }} />
      </div>

      <h1
        className="mb-3 text-2xl sm:text-3xl"
        style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
      >
        ЩОСЬ ПІШЛО НЕ ТАК
      </h1>
      <p
        className="mb-8 max-w-sm text-sm leading-relaxed"
        style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}
      >
        Виникла технічна помилка. Спробуйте оновити сторінку — зазвичай це допомагає.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
          style={{
            background: 'var(--sl-accent)',
            color: 'var(--sl-text-on-accent)',
            fontFamily: 'var(--sl-font-mono)',
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Спробувати знову
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
          style={{
            background: 'var(--sl-bg-surface)',
            border: '1px solid var(--sl-border)',
            color: 'var(--sl-text-secondary)',
            fontFamily: 'var(--sl-font-mono)',
          }}
        >
          <Home className="h-4 w-4" />
          Головна
        </Link>
      </div>
    </div>
  );
}
