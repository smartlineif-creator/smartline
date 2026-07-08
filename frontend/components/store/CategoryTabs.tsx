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
  const dragRef = useRef<{ startX: number; startScrollLeft: number } | null>(null);
  const justDraggedRef = useRef(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollPrev(track.scrollLeft > 4);
    setCanScrollNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  // ResizeObserver (not just a window resize listener) catches web-font swaps
  // and content-length changes too, not only viewport resizes.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    updateScrollState();
    track.addEventListener('scroll', updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(track);
    return () => {
      track.removeEventListener('scroll', updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState]);

  // Desktop mouse users have no trackpad/touch to swipe with and no arrow
  // buttons here anymore (they caused more bugs than they solved — reflow,
  // overlap, off-center). Instead: a plain vertical wheel scroll pans this
  // row horizontally, and the row can be click-dragged like a carousel —
  // the two ways every major storefront (Amazon, Rozetka, AliExpress) lets
  // a mouse user work a horizontal chip list.
  //
  // Attached as a native, non-passive listener rather than React's onWheel:
  // some browsers treat React's synthetic wheel handler as passive, which
  // silently ignores preventDefault() — the page would then scroll AND the
  // row would scroll at the same time.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // already horizontal input (trackpad) — let it pass through natively
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    };
    track.addEventListener('wheel', onWheel, { passive: false });
    return () => track.removeEventListener('wheel', onWheel);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || e.pointerType !== 'mouse') return;
    dragRef.current = { startX: e.clientX, startScrollLeft: track.scrollLeft };
    track.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const drag = dragRef.current;
    if (!track || !drag) return;
    const delta = e.clientX - drag.startX;
    if (Math.abs(delta) > 3) justDraggedRef.current = true;
    track.scrollLeft = drag.startScrollLeft - delta;
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    trackRef.current?.releasePointerCapture(e.pointerId);
    dragRef.current = null;
    // Clear next tick — the click event (which would otherwise navigate the
    // Link under the cursor) fires synchronously right after pointerup.
    if (justDraggedRef.current) {
      window.setTimeout(() => { justDraggedRef.current = false; }, 0);
    }
  }, []);

  const handleClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (justDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return (
    <nav aria-label="Категорії" className="relative">
      <div
        className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 transition-opacity duration-200"
        style={{ background: 'linear-gradient(to left, transparent, var(--sl-bg-primary))', opacity: canScrollPrev ? 1 : 0 }}
      />
      <div
        className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 transition-opacity duration-200"
        style={{ background: 'linear-gradient(to right, transparent, var(--sl-bg-primary))', opacity: canScrollNext ? 1 : 0 }}
      />
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
        onDragStart={(e) => e.preventDefault()}
        className="flex select-none gap-2 overflow-x-auto pb-1 cursor-grab active:cursor-grabbing"
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
    </nav>
  );
}
