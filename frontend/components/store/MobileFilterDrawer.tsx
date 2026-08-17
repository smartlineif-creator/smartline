'use client';

import { useState, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { CatalogFilter } from '@/types';
import CatalogFilters from './CatalogFilters';

interface Props {
  currentSort: string;
  availableFilters?: CatalogFilter[];
  activeOptions?: Record<string, string[]>;
  currentMinPrice?: string;
  currentMaxPrice?: string;
  /** Result count for the sticky «Показати N товарів» button. */
  total?: number;
  /** Real price bounds of the current selection — passed through to the price inputs. */
  priceRange?: { min: number; max: number } | null;
}

export default function MobileFilterDrawer({
  currentSort,
  availableFilters = [],
  activeOptions = {},
  currentMinPrice,
  currentMaxPrice,
  total,
  priceRange,
}: Props) {
  const [open, setOpen] = useState(false);

  const totalActive =
    Object.values(activeOptions).flat().length +
    (currentMinPrice || currentMaxPrice ? 1 : 0);

  // The drawer intentionally stays open while the user composes filters —
  // every tap used to close it, forcing a reopen per option. It closes only
  // via X, the backdrop, or the «Показати N товарів» button below.

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Trigger button — visible only on mobile (< lg) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
        style={{
          background: totalActive > 0 ? 'var(--sl-accent-muted)' : 'var(--sl-bg-surface)',
          border: `1px solid ${totalActive > 0 ? 'var(--sl-accent)' : 'var(--sl-border)'}`,
          color: totalActive > 0 ? 'var(--sl-accent)' : 'var(--sl-text-secondary)',
          fontFamily: 'var(--sl-font-mono)',
        }}
        aria-label="Відкрити фільтри"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" />
        Фільтри
        {totalActive > 0 && (
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: 'var(--sl-accent)', color: '#fff' }}
          >
            {totalActive}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[300] lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel — slides in from the right */}
      <div
        className="fixed right-0 top-0 z-[301] h-full w-[320px] max-w-[90vw] overflow-y-auto p-4 lg:hidden transition-transform duration-300"
        style={{
          background: 'var(--sl-bg-primary)',
          borderLeft: '1px solid var(--sl-border)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
        aria-label="Фільтри"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer header */}
        <div className="mb-4 flex items-center justify-between">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}
          >
            Фільтри та сортування
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
            style={{ background: 'var(--sl-bg-elevated)', color: 'var(--sl-text-muted)' }}
            aria-label="Закрити фільтри"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="pb-20">
          <CatalogFilters
            currentSort={currentSort}
            availableFilters={availableFilters}
            activeOptions={activeOptions}
            currentMinPrice={currentMinPrice}
            currentMaxPrice={currentMaxPrice}
            priceRange={priceRange}
          />
        </div>

        {/* Sticky apply — the one deliberate exit from filter composing */}
        <div
          className="sticky bottom-0 -mx-4 px-4 pb-4 pt-3"
          style={{ background: 'var(--sl-bg-primary)', borderTop: '1px solid var(--sl-border)' }}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-12 w-full rounded-xl text-sm font-semibold"
            style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
          >
            {typeof total === 'number' ? `Показати ${total} товарів` : 'Показати товари'}
          </button>
        </div>
      </div>
    </>
  );
}
