'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      style={{
        background: 'var(--sl-bg-elevated)',
        borderBottom: '1px solid var(--sl-border)',
        fontFamily: 'var(--sl-font-mono)',
      }}
      className="relative flex items-center justify-center px-8 py-2 text-xs"
    >
      <span style={{ color: 'var(--sl-text-secondary)' }}>
        🔥{' '}
        <span style={{ color: 'var(--sl-text-primary)' }}>
          Доставка 1&ndash;2 дні
        </span>
        {' · '}
        <span style={{ color: 'var(--sl-accent)' }}>Рейтинг 4.9★</span>
        {' · '}
        Гарантія
      </span>
      <button
        onClick={() => setDismissed(true)}
        style={{ color: 'var(--sl-text-muted)' }}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
        aria-label="Закрити"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
