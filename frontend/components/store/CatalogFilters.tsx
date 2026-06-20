'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, X, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { CatalogFilter } from '@/types';

interface Props {
  currentSort: string;
  availableFilters?: CatalogFilter[];
  activeOptions?: Record<string, string[]>;
  currentMinPrice?: string;
  currentMaxPrice?: string;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Новинки' },
  { value: 'popular', label: 'Популярні' },
  { value: 'price_asc', label: 'Ціна ↑' },
  { value: 'price_desc', label: 'Ціна ↓' },
];

export default function CatalogFilters({
  currentSort,
  availableFilters = [],
  activeOptions = {},
  currentMinPrice = '',
  currentMaxPrice = '',
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state for price inputs — applied on submit, not on each keystroke
  const [localMin, setLocalMin] = useState(currentMinPrice);
  const [localMax, setLocalMax] = useState(currentMaxPrice);

  // Sync if URL params change (e.g. browser back/forward)
  useEffect(() => {
    setLocalMin(currentMinPrice);
    setLocalMax(currentMaxPrice);
  }, [currentMinPrice, currentMaxPrice]);

  // Track which filter groups are collapsed
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(overrides)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      params.delete('page');
      return `${pathname}?${params.toString()}`;
    },
    [searchParams, pathname],
  );

  const setSort = useCallback(
    (sort: string) => router.push(buildUrl({ sort })),
    [router, buildUrl],
  );

  const toggleOption = useCallback(
    (groupName: string, value: string) => {
      const current = { ...activeOptions };
      const existing = current[groupName] || [];
      const next = existing.includes(value)
        ? existing.filter((v) => v !== value)
        : [...existing, value];

      if (next.length === 0) {
        delete current[groupName];
      } else {
        current[groupName] = next;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');

      if (Object.keys(current).length > 0) {
        params.set('options', JSON.stringify(current));
      } else {
        params.delete('options');
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [activeOptions, searchParams, pathname, router],
  );

  // Apply price range to URL
  const applyPrice = useCallback(() => {
    const min = parseInt(localMin, 10);
    const max = parseInt(localMax, 10);
    router.push(
      buildUrl({
        minPrice: !isNaN(min) && min > 0 ? String(min) : '',
        maxPrice: !isNaN(max) && max > 0 ? String(max) : '',
      }),
    );
  }, [localMin, localMax, router, buildUrl]);

  const clearPrice = useCallback(() => {
    setLocalMin('');
    setLocalMax('');
    router.push(buildUrl({ minPrice: '', maxPrice: '' }));
  }, [router, buildUrl]);

  const handlePriceKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') applyPrice();
    },
    [applyPrice],
  );

  const totalActiveCount = Object.values(activeOptions).flat().length;
  const isPriceActive = Boolean(currentMinPrice || currentMaxPrice);
  const totalBadgeCount = totalActiveCount + (isPriceActive ? 1 : 0);

  const clearAll = useCallback(() => {
    setLocalMin('');
    setLocalMax('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('options');
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  const toggleCollapse = (groupName: string) => {
    setCollapsed((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5" style={{ color: 'var(--sl-accent)' }} />
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}
          >
            Фільтри
          </span>
        </div>
        {totalBadgeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            aria-label={`Скинути ${totalBadgeCount} активних фільтрів`}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all"
            style={{
              background: 'var(--sl-accent-muted)',
              border: '1px solid var(--sl-accent)',
              color: 'var(--sl-accent)',
              fontFamily: 'var(--sl-font-mono)',
            }}
          >
            <X className="h-2.5 w-2.5" />
            Скинути ({totalBadgeCount})
          </button>
        )}
      </div>

      {/* Sort section */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ border: '1px solid var(--sl-border)', background: 'var(--sl-bg-surface)' }}
      >
        <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--sl-border)' }}>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
          >
            Сортування
          </span>
        </div>
        <div className="p-2 flex flex-col gap-0.5">
          {SORT_OPTIONS.map((opt) => {
            const isActive = currentSort === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSort(opt.value)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-all"
                style={{
                  background: isActive ? 'var(--sl-accent-muted)' : 'transparent',
                  color: isActive ? 'var(--sl-accent)' : 'var(--sl-text-secondary)',
                  fontFamily: 'var(--sl-font-mono)',
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-bg-elevated)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-secondary)';
                  }
                }}
              >
                <span
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full"
                  style={{
                    border: `1.5px solid ${isActive ? 'var(--sl-accent)' : 'var(--sl-border-hover)'}`,
                    background: isActive ? 'var(--sl-accent)' : 'transparent',
                  }}
                >
                  {isActive && (
                    <span className="block h-1.5 w-1.5 rounded-full" style={{ background: '#fff' }} />
                  )}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price range filter */}
      <div
        className="overflow-hidden rounded-xl"
        style={{
          border: `1px solid ${isPriceActive ? 'var(--sl-accent)' : 'var(--sl-border)'}`,
          background: 'var(--sl-bg-surface)',
          transition: 'border-color 0.15s',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2.5"
          style={{ borderBottom: '1px solid var(--sl-border)', background: isPriceActive ? 'var(--sl-accent-muted)' : 'transparent' }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: isPriceActive ? 'var(--sl-accent)' : 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
          >
            Ціна, ₴
          </span>
          {isPriceActive && (
            <button
              type="button"
              onClick={clearPrice}
              aria-label="Скинути фільтр ціни"
              className="flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
            >
              <X className="h-3 w-3" style={{ color: 'var(--sl-accent)' }} />
            </button>
          )}
        </div>

        {/* Inputs */}
        <div className="p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {/* Min price */}
            <div className="flex-1">
              <label
                htmlFor="price-min"
                className="mb-1 block text-[10px] font-medium"
                style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
              >
                Від
              </label>
              <input
                id="price-min"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="0"
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                onKeyDown={handlePriceKeyDown}
                className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none transition-all"
                style={{
                  background: 'var(--sl-bg-elevated)',
                  border: '1px solid var(--sl-border)',
                  color: 'var(--sl-text-primary)',
                  fontFamily: 'var(--sl-font-mono)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sl-accent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sl-border)';
                }}
              />
            </div>

            <ArrowRight
              className="mt-4 h-3 w-3 shrink-0"
              style={{ color: 'var(--sl-text-muted)' }}
            />

            {/* Max price */}
            <div className="flex-1">
              <label
                htmlFor="price-max"
                className="mb-1 block text-[10px] font-medium"
                style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
              >
                До
              </label>
              <input
                id="price-max"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="∞"
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                onKeyDown={handlePriceKeyDown}
                className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none transition-all"
                style={{
                  background: 'var(--sl-bg-elevated)',
                  border: '1px solid var(--sl-border)',
                  color: 'var(--sl-text-primary)',
                  fontFamily: 'var(--sl-font-mono)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sl-accent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--sl-border)';
                }}
              />
            </div>
          </div>

          {/* Apply button */}
          <button
            type="button"
            onClick={applyPrice}
            className="w-full rounded-lg py-1.5 text-[11px] font-semibold transition-all"
            style={{
              background: 'var(--sl-accent-muted)',
              border: '1px solid var(--sl-accent)',
              color: 'var(--sl-accent)',
              fontFamily: 'var(--sl-font-mono)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-muted)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-accent)';
            }}
          >
            Застосувати
          </button>
        </div>
      </div>

      {/* Option group filters */}
      {availableFilters.map((filter) => {
        const activeValues = activeOptions[filter.groupName] || [];
        const isCollapsed = collapsed[filter.groupName] ?? false;
        const activeCount = activeValues.length;

        return (
          <div
            key={filter.groupName}
            className="overflow-hidden rounded-xl"
            style={{
              border: `1px solid ${activeCount > 0 ? 'var(--sl-accent)' : 'var(--sl-border)'}`,
              background: 'var(--sl-bg-surface)',
              transition: 'border-color 0.15s',
            }}
          >
            {/* Group header — clickable to collapse */}
            <button
              type="button"
              onClick={() => toggleCollapse(filter.groupName)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-all"
              style={{
                borderBottom: isCollapsed ? 'none' : '1px solid var(--sl-border)',
                background: activeCount > 0 ? 'var(--sl-accent-muted)' : 'transparent',
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{
                    color: activeCount > 0 ? 'var(--sl-accent)' : 'var(--sl-text-muted)',
                    fontFamily: 'var(--sl-font-mono)',
                  }}
                >
                  {filter.groupName}
                </span>
                {activeCount > 0 && (
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                    style={{
                      background: 'var(--sl-accent)',
                      color: '#fff',
                      fontFamily: 'var(--sl-font-mono)',
                    }}
                  >
                    {activeCount}
                  </span>
                )}
              </div>
              <ChevronDown
                className="h-3.5 w-3.5 transition-transform duration-200"
                style={{
                  color: 'var(--sl-text-muted)',
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {/* Values */}
            {!isCollapsed && (
              <div className="p-2 flex flex-col gap-0.5">
                {filter.values.map(({ value: val, count }) => {
                  const isActive = activeValues.includes(val);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => toggleOption(filter.groupName, val)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-all"
                      style={{
                        background: isActive ? 'var(--sl-accent-muted)' : 'transparent',
                        color: isActive ? 'var(--sl-accent)' : 'var(--sl-text-secondary)',
                        fontFamily: 'var(--sl-font-mono)',
                        fontWeight: isActive ? 600 : 400,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-bg-elevated)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-secondary)';
                        }
                      }}
                    >
                      <span
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded"
                        style={{
                          border: `1.5px solid ${isActive ? 'var(--sl-accent)' : 'var(--sl-border-hover)'}`,
                          background: isActive ? 'var(--sl-accent)' : 'transparent',
                          transition: 'all 0.15s',
                        }}
                      >
                        {isActive && (
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path
                              d="M1 3.5l2 2L8 1"
                              stroke="#fff"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="flex-1 truncate">{val}</span>
                      <span
                        className="shrink-0 text-[10px]"
                        style={{ color: isActive ? 'var(--sl-accent)' : 'var(--sl-text-muted)', opacity: 0.7 }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
