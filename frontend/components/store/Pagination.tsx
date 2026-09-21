import Link from 'next/link';
import { buildPageHref } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Path the links point at, e.g. `/catalog/noutbuky`. */
  basePath: string;
  /** Already-sanitised params to carry across pages — see `buildPageHref`. */
  params: Record<string, string | undefined>;
}

/** Page numbers rendered whenever the catalogue is deeper than this. */
const SLOTS = 7;

const BASE_CLASS = 'rounded-lg px-3 py-2 text-sm transition-all';
const IDLE_STYLE = {
  background: 'var(--sl-bg-elevated)',
  border: '1px solid var(--sl-border)',
  color: 'var(--sl-text-secondary)',
  fontFamily: 'var(--sl-font-mono)',
} as const;
const ACTIVE_STYLE = {
  background: 'var(--sl-accent)',
  color: 'var(--sl-text-on-accent)',
  border: '1px solid var(--sl-accent)',
  fontFamily: 'var(--sl-font-mono)',
} as const;

/**
 * First page, last page and a block around the current one. Always exactly
 * SLOTS numbers once the catalogue is deep enough, so the control keeps its
 * width and the digits stay put under the cursor. A gap is only ever drawn
 * where it hides two or more pages — hiding a single page behind «…» costs
 * more space than showing it.
 */
function pageWindow(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= SLOTS) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  let left = page - 2;
  let right = page + 2;

  if (left <= 3) {
    left = 2;
    right = SLOTS - 1;
  } else if (right >= totalPages - 2) {
    right = totalPages - 1;
    left = totalPages - SLOTS + 2;
  }

  const out: (number | 'gap')[] = [1];
  if (left > 2) out.push('gap');
  for (let i = left; i <= right; i++) out.push(i);
  if (right < totalPages - 1) out.push('gap');
  out.push(totalPages);
  return out;
}

export function Pagination({ page, totalPages, basePath, params }: PaginationProps) {
  if (totalPages <= 1) return null;

  // A page beyond the last one still gets arrows and a highlight that lead
  // back into range, instead of a control with nothing marked as current.
  const current = Math.min(Math.max(page, 1), totalPages);
  const hrefFor = (target: number) => buildPageHref(basePath, params, target);

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
            aria-current={slot === current ? 'page' : undefined}
            className={BASE_CLASS}
            style={slot === current ? ACTIVE_STYLE : IDLE_STYLE}
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
