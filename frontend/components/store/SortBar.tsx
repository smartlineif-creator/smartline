import Link from 'next/link';
import { ArrowUpDown, TrendingUp, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Нові',        Icon: Sparkles   },
  { value: 'price_asc',  label: 'Ціна ↑',      Icon: ArrowUp    },
  { value: 'price_desc', label: 'Ціна ↓',      Icon: ArrowDown  },
  { value: 'popular',    label: 'Популярні',   Icon: TrendingUp },
] as const;

interface Props {
  total: number;
  currentSort: string;
  /** Base URL for sort links, e.g. "/catalog?page=1" or "/catalog/smartphones?page=1" */
  baseHref: string;
  /** Separator char to use between baseHref and sort param — "&" if baseHref already has "?" */
  sep?: '?' | '&';
}

export default function SortBar({ total, currentSort, baseHref, sep = '?' }: Props) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      style={{
        background: 'var(--sl-bg-surface)',
        border: '1px solid var(--sl-border)',
      }}
    >
      {/* Left: product count */}
      <div className="flex items-center gap-2">
        <ArrowUpDown
          className="h-3.5 w-3.5 shrink-0"
          style={{ color: 'var(--sl-accent)' }}
        />
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}
        >
          <span
            className="font-bold"
            style={{ color: 'var(--sl-text-primary)' }}
          >
            {total.toLocaleString('uk-UA')}
          </span>
          {' '}товарів
        </span>
      </div>

      {/* Right: sort segmented control */}
      <nav aria-label="Сортування" className="max-w-full">
        <div
          className="flex items-center gap-1 overflow-x-auto rounded-xl p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ background: 'var(--sl-bg-elevated)' }}
        >
          {SORT_OPTIONS.map(({ value, label, Icon }) => {
            const isActive = currentSort === value;
            return (
              <Link
                key={value}
                href={`${baseHref}${sep}sort=${value}&page=1`}
                aria-current={isActive ? 'true' : undefined}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 whitespace-nowrap"
                style={
                  isActive
                    ? {
                        background: 'var(--sl-accent)',
                        color: '#fff',
                        fontWeight: 600,
                        fontFamily: 'var(--sl-font-mono)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                      }
                    : {
                        color: 'var(--sl-text-muted)',
                        fontFamily: 'var(--sl-font-mono)',
                      }
                }
              >
                <Icon className="h-3 w-3 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
