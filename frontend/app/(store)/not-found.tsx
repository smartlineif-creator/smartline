import Link from 'next/link';
import { SearchX, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center"
      style={{ background: 'var(--sl-bg-primary)' }}
    >
      {/* Big 404 */}
      <div
        className="mb-2 text-[120px] font-bold leading-none tracking-tight"
        style={{
          fontFamily: 'var(--sl-font-display)',
          color: 'var(--sl-accent)',
          opacity: 0.15,
        }}
      >
        404
      </div>

      {/* Icon */}
      <div
        className="-mt-8 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'var(--sl-accent-muted)', border: '1px solid var(--sl-accent)' }}
      >
        <SearchX className="h-7 w-7" style={{ color: 'var(--sl-accent)' }} />
      </div>

      <h1
        className="mb-3 text-2xl sm:text-3xl"
        style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
      >
        СТОРІНКУ НЕ ЗНАЙДЕНО
      </h1>
      <p
        className="mb-8 max-w-sm text-sm leading-relaxed"
        style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}
      >
        Схоже, що ця сторінка переїхала або ніколи не існувала. Спробуйте перейти до каталогу або на головну.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/catalog"
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
          style={{
            background: 'var(--sl-accent)',
            color: 'var(--sl-text-on-accent)',
            fontFamily: 'var(--sl-font-mono)',
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          До каталогу
        </Link>
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
