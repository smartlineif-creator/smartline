'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { createReview } from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  target: { kind: 'product' | 'service'; id: string };
}

export default function ReviewForm({ target }: Props) {
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  /** 0 = not hovering; while hovering the stars preview that value instead of the picked one. */
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewName, setReviewName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewName.trim().length < 2) {
      toast.error("Вкажіть ім'я");
      return;
    }
    try {
      await createReview({
        productId: target.kind === 'product' ? target.id : undefined,
        serviceId: target.kind === 'service' ? target.id : undefined,
        authorName: reviewName,
        rating: reviewRating,
        text: reviewText,
      });
      toast.success('Відгук надіслано на модерацію');
      setReviewText('');
      setReviewName('');
    } catch {
      toast.error('Помилка надсилання відгуку');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-5 sm:p-6 xl:sticky xl:top-[68px] xl:self-start"
      style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
    >
      <h3 className="text-lg font-semibold" style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}>Залишити відгук</h3>
      <p className="mt-1 text-sm" style={{ color: 'var(--sl-text-muted)' }}>Короткий чесний відгук допоможе наступному покупцю прийняти рішення.</p>
      <div className="mt-5 space-y-4">
        <input
          type="text"
          placeholder="Ваше ім'я"
          value={reviewName}
          onChange={(e) => setReviewName(e.target.value)}
          required
          className="h-11 w-full rounded-xl px-3 text-sm outline-none"
          style={{
            background: 'var(--sl-bg-elevated)',
            border: '1px solid var(--sl-border)',
            color: 'var(--sl-text-primary)',
            fontFamily: 'var(--sl-font-body)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--sl-accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--sl-border)')}
        />
        <div>
          <p className="mb-2 text-sm font-medium" style={{ color: 'var(--sl-text-secondary)' }}>Оцінка</p>
          <div
            className="flex gap-1"
            role="radiogroup"
            aria-label="Оцінка"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((rating) => {
              // While the pointer is over the row, preview the hovered
              // value; otherwise show what is actually selected.
              const filled = rating <= (hoverRating || reviewRating);
              return (
                <button
                  key={rating}
                  type="button"
                  role="radio"
                  aria-checked={rating === reviewRating}
                  aria-label={`${rating} з 5`}
                  onClick={() => setReviewRating(rating)}
                  onMouseEnter={() => setHoverRating(rating)}
                  onFocus={() => setHoverRating(rating)}
                  onBlur={() => setHoverRating(0)}
                  className="rounded-md p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className="h-6 w-6 transition-colors"
                    style={{
                      fill: filled ? 'var(--sl-accent)' : 'none',
                      color: filled ? 'var(--sl-accent)' : 'var(--sl-text-muted)',
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
        <textarea
          placeholder="Що сподобалось, як поводиться товар у використанні..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={5}
          className="w-full rounded-xl px-3 py-3 text-sm outline-none"
          style={{
            background: 'var(--sl-bg-elevated)',
            border: '1px solid var(--sl-border)',
            color: 'var(--sl-text-primary)',
            fontFamily: 'var(--sl-font-body)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--sl-accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--sl-border)')}
        />
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold"
          style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent-hover)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--sl-accent)')}
        >
          Надіслати відгук
        </button>
      </div>
    </form>
  );
}
