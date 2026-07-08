'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  LayoutGrid,
  Smartphone,
  Laptop,
  Headphones,
  Gamepad2,
  Tablet,
  Tv,
  Camera,
  Package,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { Category } from '@/types';

const ICON_MAP: Record<string, LucideIcon> = {
  смартфони: Smartphone,
  ноутбуки: Laptop,
  аудіо: Headphones,
  'ігрові консолі': Gamepad2,
  планшети: Tablet,
  телевізори: Tv,
  'фото та відео': Camera,
  аксесуари: Package,
};

/** Returns an icon only for known top-level categories; undefined otherwise */
function getCategoryIcon(name: string): LucideIcon | undefined {
  return ICON_MAP[name.toLowerCase()];
}

interface Props {
  categories: Category[];
  /** The slug of the currently active category. Undefined = "All" is active */
  activeSlug?: string;
  /** Prefix for category links, e.g. "/catalog" */
  basePath?: string;
  /** Label + href for the "all" chip */
  allLabel?: string;
  allHref?: string;
}

const SCROLL_BUTTON_CLASS =
  'z-20 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-95 lg:flex';

export default function CategoryTabs({
  categories,
  activeSlug,
  basePath = '/catalog',
  allLabel = 'Всі товари',
  allHref,
}: Props) {
  const resolvedAllHref = allHref ?? basePath;
  const allActive = !activeSlug;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollPrev(track.scrollLeft > 4);
    setCanScrollNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const track = trackRef.current;
    if (!track) return undefined;
    track.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      track.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const scroll = useCallback((direction: 'prev' | 'next') => {
    const track = trackRef.current;
    if (!track) return;
    const amount = track.clientWidth * 0.7;
    track.scrollBy({ left: direction === 'next' ? amount : -amount, behavior: 'smooth' });
  }, []);

  return (
    <nav aria-label="Категорії" className="flex items-center gap-1">
      {canScrollPrev && (
        <button
          type="button"
          onClick={() => scroll('prev')}
          className={SCROLL_BUTTON_CLASS}
          style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)', color: 'var(--sl-text-secondary)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sl-accent)';
            (e.currentTarget as HTMLButtonElement).style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-bg-elevated)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sl-border)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-secondary)';
          }}
          aria-label="Прокрутити категорії назад"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div className="relative min-w-0 flex-1">
        {canScrollPrev && (
          <div
            className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8"
            style={{ background: 'linear-gradient(to left, transparent, var(--sl-bg-primary))' }}
          />
        )}
        {canScrollNext && (
          <div
            className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12"
            style={{ background: 'linear-gradient(to right, transparent, var(--sl-bg-primary))' }}
          />
        )}
        <div
          ref={trackRef}
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* "All" chip */}
          <Link
            href={resolvedAllHref}
            aria-current={allActive ? 'page' : undefined}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200"
            style={
              allActive
                ? { background: 'var(--sl-accent)', color: '#fff' }
                : { background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)', color: 'var(--sl-text-secondary)' }
            }
          >
            <LayoutGrid className="h-3.5 w-3.5 shrink-0" style={{ opacity: allActive ? 1 : 0.55 }} />
            {allLabel}
          </Link>

          {categories.map((cat) => {
            const isActive = cat.slug === activeSlug;
            const Icon = getCategoryIcon(cat.name);

            return (
              <Link
                key={cat.id}
                href={`${basePath}/${cat.slug}`}
                aria-current={isActive ? 'page' : undefined}
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
                style={
                  isActive
                    ? { background: 'var(--sl-accent)', color: '#fff', fontWeight: 600 }
                    : { background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)', color: 'var(--sl-text-secondary)' }
                }
              >
                {Icon && (
                  <Icon className="h-3.5 w-3.5 shrink-0" style={{ opacity: isActive ? 1 : 0.55 }} />
                )}
                {cat.name}
              </Link>
            );
          })}
        </div>
      </div>

      {canScrollNext && (
        <button
          type="button"
          onClick={() => scroll('next')}
          className={SCROLL_BUTTON_CLASS}
          style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)', color: 'var(--sl-text-secondary)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sl-accent)';
            (e.currentTarget as HTMLButtonElement).style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-bg-elevated)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sl-border)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-secondary)';
          }}
          aria-label="Прокрутити категорії далі"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </nav>
  );
}
