'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Review } from '@/types';
import ReviewForm from './ReviewForm';

interface Props {
  target: { kind: 'product' | 'service'; id: string };
  reviews: Review[];
}

export default function ReviewsSection({ target, reviews }: Props) {
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div
        className="rounded-2xl px-5 py-6 sm:px-6"
        style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
      >
        <div className="mb-6 flex items-end gap-4">
          <div>
            <p className="text-4xl font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}>
              {reviews.length > 0 ? averageRating.toFixed(1) : '—'}
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--sl-text-muted)' }}>Середня оцінка</p>
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-0.5" style={{ color: 'var(--sl-accent)' }}>
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} className={cn('h-5 w-5', index < Math.round(averageRating) ? 'fill-current' : '')} style={{ opacity: index < Math.round(averageRating) ? 1 : 0.25 }} />
              ))}
            </div>
            <p className="mt-1 text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>{reviews.length} відгуків</p>
          </div>
        </div>
        <div className="space-y-4">
          {reviews.length > 0 ? reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl p-4"
              style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)' }}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium" style={{ color: 'var(--sl-text-primary)' }}>{review.authorName}</p>
                  <div className="mt-1 flex items-center gap-0.5" style={{ color: 'var(--sl-accent)' }}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star key={index} className="h-4 w-4" style={{ fill: index < review.rating ? 'currentColor' : 'none', opacity: index < review.rating ? 1 : 0.25 }} />
                    ))}
                  </div>
                </div>
              </div>
              {review.text && <p className="text-sm leading-6" style={{ color: 'var(--sl-text-secondary)' }}>{review.text}</p>}
            </div>
          )) : (
            <p className="text-sm" style={{ color: 'var(--sl-text-muted)' }}>Поки що відгуків немає.</p>
          )}
        </div>
      </div>

      <ReviewForm target={target} />
    </div>
  );
}
