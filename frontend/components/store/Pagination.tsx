import Link from 'next/link';

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Builds the href for a page number — lets each page decide what to carry over. */
  hrefFor: (page: number) => string;
}

const BASE_CLASS = 'rounded-lg px-3 py-2 text-sm transition-all';
const IDLE_STYLE = {
  background: 'var(--sl-bg-elevated)',
  border: '1px solid var(--sl-border)',
  color: 'var(--sl-text-secondary)',
  fontFamily: 'var(--sl-font-mono)',
} as const;
const ACTIVE_STYLE = {
  background: 'var(--sl-accent)',
  color: '#fff',
  border: '1px solid var(--sl-accent)',
  fontFamily: 'var(--sl-font-mono)',
} as const;

/**
 * Page numbers to render: always the first, the last and the current ±2, with
 * a gap marker wherever the sequence jumps. Rendering every page turned long
 * catalogues into kilobytes of links, and each href now carries the full
 * filter query string.
 */
function pageWindow(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const wanted = [1, totalPages, page - 2, page - 1, page, page + 1, page + 2];
  const shown = [...new Set(wanted)]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const out: (number | 'gap')[] = [];
  let previous = 0;
  for (const p of shown) {
    if (previous > 0 && p - previous > 1) out.push('gap');
    out.push(p);
    previous = p;
  }
  return out;
}

export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null;

  // A page beyond the last one still gets arrows that lead back into range.
  const current = Math.min(Math.max(page, 1), totalPages);

  return (
    <nav aria-label="Пагінація" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {current > 1 && (
        <Link href={hrefFor(current - 1)} aria-label="Попередня сторінка" className={BASE_CLASS} style={IDLE_STYLE}>
          ←
        </Link>
      )}

      {pageWindow(current, totalPages).map((slot, index) =>
        slot === 'gap' ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="px-1 text-sm"
            style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
          >
            …
          </span>
        ) : (
          <Link
            key={slot}
            href={hrefFor(slot)}
            aria-label={`Сторінка ${slot}`}
            aria-current={slot === page ? 'page' : undefined}
            className={BASE_CLASS}
            style={slot === page ? ACTIVE_STYLE : IDLE_STYLE}
          >
            {slot}
          </Link>
        ),
      )}

      {current < totalPages && (
        <Link href={hrefFor(current + 1)} aria-label="Наступна сторінка" className={BASE_CLASS} style={IDLE_STYLE}>
          →
        </Link>
      )}
    </nav>
  );
}
