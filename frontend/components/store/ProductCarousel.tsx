'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types';
import ProductCard from '@/components/store/ProductCard';

interface Props {
  products: Product[];
}

export default function ProductCarousel({ products }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const scrollEndTimerRef = useRef<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isLooping = products.length > 1;
  const carouselProducts = useMemo(
    () => (isLooping ? [...products, ...products, ...products] : products),
    [isLooping, products],
  );

  const getScrollAmount = useCallback(() => {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | null;
    if (!track || !card) return 0;
    return card.offsetWidth + 16;
  }, []);

  const setInstantScroll = useCallback((left: number) => {
    const track = trackRef.current;
    if (!track) return;

    track.style.scrollBehavior = 'auto';
    track.scrollLeft = left;
    window.requestAnimationFrame(() => {
      track.style.scrollBehavior = '';
    });
  }, []);

  const normalizeLoopPosition = useCallback(() => {
    const track = trackRef.current;
    const step = getScrollAmount();
    if (!track || !step || !isLooping) return;

    const loopWidth = step * products.length;
    const min = loopWidth * 0.5;
    const max = loopWidth * 1.5;

    if (track.scrollLeft < min) {
      setInstantScroll(track.scrollLeft + loopWidth);
    }

    if (track.scrollLeft > max) {
      setInstantScroll(track.scrollLeft - loopWidth);
    }
  }, [getScrollAmount, isLooping, products.length, setInstantScroll]);

  const scrollOne = useCallback((direction: 'prev' | 'next') => {
    const track = trackRef.current;
    const step = getScrollAmount();
    if (!track || !step) return;

    normalizeLoopPosition();
    track.scrollBy({ left: direction === 'next' ? step : -step, behavior: 'smooth' });

    if (scrollEndTimerRef.current) {
      window.clearTimeout(scrollEndTimerRef.current);
    }

    scrollEndTimerRef.current = window.setTimeout(normalizeLoopPosition, 520);
  }, [getScrollAmount, normalizeLoopPosition]);

  useEffect(() => {
    const track = trackRef.current;
    const step = getScrollAmount();
    if (!track || !step || !isLooping) return undefined;

    setInstantScroll(step * products.length);

    const handleResize = () => {
      const nextStep = getScrollAmount();
      if (!nextStep) return;
      setInstantScroll(nextStep * products.length);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [getScrollAmount, isLooping, products.length, setInstantScroll]);

  useEffect(() => {
    if (!isLooping || isHovered) return undefined;

    const id = window.setInterval(() => {
      scrollOne('next');
    }, 4200);

    return () => window.clearInterval(id);
  }, [isHovered, isLooping, scrollOne]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={() => scrollOne('prev')}
        className="absolute -left-6 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-200 active:scale-95 xl:flex"
        style={{
          background: 'var(--sl-bg-elevated)',
          border: '1px solid var(--sl-border)',
          color: 'var(--sl-text-secondary)',
        }}
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
        aria-label="Попередні товари"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        ref={trackRef}
        onScroll={() => {
          if (!isLooping) return;
          if (scrollEndTimerRef.current) {
            window.clearTimeout(scrollEndTimerRef.current);
          }
          scrollEndTimerRef.current = window.setTimeout(normalizeLoopPosition, 180);
        }}
        className="grid auto-cols-[calc(50%-8px)] grid-flow-col gap-4 overflow-x-auto scroll-px-4 px-4 pt-2 pb-6 -mx-4 -mt-2 -mb-6 [scrollbar-width:none] sm:auto-cols-[calc(33.333%-11px)] lg:auto-cols-[calc(25%-12px)] xl:-mx-8 xl:auto-cols-[calc((100%_-_48px)/4)] xl:scroll-px-8 xl:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {carouselProducts.map((product, index) => (
          <div key={`${product.id}-${index}`} className="min-w-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollOne('next')}
        className="absolute -right-6 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition-all duration-200 active:scale-95 xl:flex"
        style={{
          background: 'var(--sl-bg-elevated)',
          border: '1px solid var(--sl-border)',
          color: 'var(--sl-text-secondary)',
        }}
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
        aria-label="Наступні товари"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
