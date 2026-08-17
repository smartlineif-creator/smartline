'use client';

import { useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

/** One comparator per sortable column, always written ascending — the hook flips it. */
export type SortComparators<C extends string, T> = Record<C, (a: T, b: T) => number>;

interface Options<C extends string> {
  /** Column sorted on first render. Without it rows keep their server order until a header is clicked. */
  initialColumn?: C;
  initialDirection?: SortDirection;
}

/**
 * Column sorting shared by every admin table, so a header behaves the same
 * everywhere: first click sorts ascending, clicking the active column flips it.
 */
export function useTableSort<C extends string, T>(
  rows: T[],
  comparators: SortComparators<C, T>,
  options: Options<C> = {},
) {
  const [column, setColumn] = useState<C | null>(options.initialColumn ?? null);
  const [direction, setDirection] = useState<SortDirection>(options.initialDirection ?? 'asc');

  const sorted = useMemo(() => {
    if (!column) return rows;
    const compare = comparators[column];
    if (!compare) return rows;
    // Copy first: Array.prototype.sort mutates, and `rows` is state owned elsewhere.
    return [...rows].sort((a, b) => (direction === 'asc' ? compare(a, b) : -compare(a, b)));
  }, [rows, column, direction, comparators]);

  const onSort = (next: C) => {
    if (next === column) {
      setDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setColumn(next);
    setDirection('asc');
  };

  return { sorted, column, direction, onSort };
}

/** Ukrainian-aware text compare — «Є» and «І» sort where a reader expects them. */
export function compareText(a: string | null | undefined, b: string | null | undefined) {
  return (a ?? '').localeCompare(b ?? '', 'uk');
}

export function compareNumber(a: number, b: number) {
  return a - b;
}

export function compareDate(a: string | Date, b: string | Date) {
  return new Date(a).getTime() - new Date(b).getTime();
}
