import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/store/ThemeToggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sl-theme min-h-screen flex flex-col" style={{ background: 'var(--sl-bg-primary)' }}>
      {/* Simplified auth header */}
      <header
        className="flex h-14 shrink-0 items-center justify-between px-5 sm:px-8"
        style={{ borderBottom: '1px solid var(--sl-border)' }}
      >
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--sl-font-display)', letterSpacing: '0.05em' }}
        >
          <span style={{ color: 'var(--sl-text-primary)' }}>SMART</span>
          <span style={{ color: 'var(--sl-accent)' }}>LINE</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/catalog"
            className="hidden sm:flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Повернутися до магазину
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pt-10 pb-16">
        {children}
      </main>
    </div>
  );
}
