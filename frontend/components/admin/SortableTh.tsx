'use client';

import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { SortDirection } from '@/lib/useTableSort';

interface Props<C extends string> {
  column: C;
  /** Currently sorted column, or null while the table keeps its server order. */
  active: C | null;
  direction: SortDirection;
  onSort: (column: C) => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * A sortable table header. Declared at module scope rather than inside a page so
 * React keeps its identity between renders.
 */
export default function SortableTh<C extends string>({
  column,
  active,
  direction,
  onSort,
  children,
  align = 'left',
  className,
}: Props<C>) {
  const isActive = active === column;

  return (
    <th
      className={cn(
        'whitespace-nowrap px-4 py-3 font-medium select-none',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
      aria-sort={isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'inline-flex items-center gap-1 transition-colors hover:text-gray-900',
          isActive ? 'text-blue-600' : 'text-gray-500',
        )}
      >
        {children}
        {!isActive && <ArrowUpDown className="h-3.5 w-3.5 opacity-35" />}
        {isActive && direction === 'asc' && <ChevronUp className="h-3.5 w-3.5" />}
        {isActive && direction === 'desc' && <ChevronDown className="h-3.5 w-3.5" />}
      </button>
    </th>
  );
}
