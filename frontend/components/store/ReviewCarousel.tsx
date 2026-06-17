'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Review } from '@/types';

interface Props {
  reviews: Review[];
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export default function ReviewCarousel({ reviews }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const scrollEndTimerRef = useRef<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isLooping = reviews.length > 1;
  const carouselReviews = useMemo(
    () => (isLooping ? [...reviews, ...reviews, ...reviews] : reviews),
    [isLooping, reviews],
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

    const loopWidth = step * reviews.length;
    const min = loopWidth * 0.5;
    const max = loopWidth * 1.5;

    if (track.scrollLeft < min) {
      setInstantScroll(track.scrollLeft + loopWidth);
    }

    if (track.scrollLeft > max) {
      setInstantScroll(track.scrollLeft - loopWidth);
    }
  }, [getScrollAmount, isLooping, reviews.length, setInstantScroll]);

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

    setInstantScroll(step * reviews.length);

    const handleResize = () => {
      const nextStep = getScrollAmount();
      if (!nextStep) return;
      setInstantScroll(nextStep * reviews.length);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [getScrollAmount, isLooping, reviews.length, setInstantScroll]);

  useEffect(() => {
    if (!isLooping || isHovered) return undefined;

    const id = window.setInterval(() => {
      scrollOne('next');
    }, 6500);

    return () => window.clearInterval(id);
  }, [isHovered, isLooping, scrollOne]);

  if (!reviews.length) return null;

  return (
    <div
      className="relative xl:px-12"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={() => scrollOne('prev')}
        className="absolute left-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-[0_14px_30px_rgba(148,163,184,0.18)] transition-all duration-200 hover:-translate-y-[calc(50%+2px)] hover:shadow-[0_18px_38px_rgba(37,99,235,0.22)] active:scale-95 xl:flex"
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
        aria-label="Попередні відгуки"
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
        className="grid auto-cols-[88%] grid-flow-col gap-4 overflow-x-auto pb-2 [scrollbar-width:none] sm:auto-cols-[48%] xl:auto-cols-[calc((100%_-_32px)/3)] [&::-webkit-scrollbar]:hidden"
      >
        {carouselReviews.map((review, index) => (
          <article
            key={`${review.id}-${index}`}
            className="flex min-h-[250px] flex-col rounded-2xl p-5"
            style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className="text-base font-semibold"
                  style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
                >
                  {review.authorName}
                </div>
                <div
                  className="mt-1 text-xs"
                  style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
                >
                  {formatReviewDate(review.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-0.5" style={{ color: 'var(--sl-accent)' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < review.rating ? 'fill-current' : ''}`}
                    style={{ color: i < review.rating ? 'var(--sl-accent)' : 'var(--sl-text-muted)' }}
                  />
                ))}
              </div>
            </div>

            <p
              className="mt-4 line-clamp-5 text-sm leading-7"
              style={{ color: 'var(--sl-text-secondary)' }}
            >
              {review.text || 'Все пройшло добре, покупець залишив позитивне враження про замовлення.'}
            </p>

            <div className="mt-auto flex items-center justify-between gap-3 pt-5">
              {review.product ? (
                <Link
                  href={`/product/${review.product.slug}`}
                  className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                  style={{ background: 'var(--sl-bg-elevated)', color: 'var(--sl-text-secondary)', border: '1px solid var(--sl-border)', fontFamily: 'var(--sl-font-mono)' }}
                >
                  {review.product.name}
                </Link>
              ) : (
                <div
                  className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
                >
                  Підтверджений покупець
                </div>
              )}
              <div
                className="text-xs font-medium uppercase tracking-[0.08em]"
                style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
              >
                Відгук
              </div>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollOne('next')}
        className="absolute right-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-[0_14px_30px_rgba(148,163,184,0.18)] transition-all duration-200 hover:-translate-y-[calc(50%+2px)] hover:shadow-[0_18px_38px_rgba(37,99,235,0.22)] active:scale-95 xl:flex"
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
        aria-label="Наступні відгуки"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
