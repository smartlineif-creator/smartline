'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Banner } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  banners: Banner[];
}

export default function BannerSlider({ banners }: Props) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % banners.length);
  }, [banners.length]);

  const prev = () => {
    setCurrent((i) => (i - 1 + banners.length) % banners.length);
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, banners.length]);

  if (!banners.length) return null;

  return (
    <div
      className="relative isolate aspect-[3/1] overflow-hidden sm:aspect-[4/1]"
      style={{
        borderRadius: 'var(--sl-radius-lg)',
        border: '1px solid var(--sl-border)',
        background: 'var(--sl-bg-primary)',
      }}
    >
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-700',
            i === current ? 'opacity-100' : 'opacity-0',
          )}
        >
          {banner.link ? (
            <Link href={banner.link} className="absolute inset-0">
              <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" priority={i === 0} />
            </Link>
          ) : (
            <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" priority={i === 0} />
          )}
        </div>
      ))}

      {/* Nav arrows */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Попередній банер"
            className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full p-2 transition-all"
            style={{
              background: 'var(--sl-bg-elevated)',
              border: '1px solid var(--sl-border)',
              color: 'var(--sl-text-secondary)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sl-accent)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-accent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sl-border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-secondary)';
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Наступний банер"
            className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full p-2 transition-all"
            style={{
              background: 'var(--sl-bg-elevated)',
              border: '1px solid var(--sl-border)',
              color: 'var(--sl-text-secondary)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sl-accent)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-accent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--sl-border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--sl-text-secondary)';
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div
            className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2 rounded-full px-3 py-2"
            style={{ background: 'var(--sl-bg-surface-glass)', border: '1px solid var(--sl-border)', backdropFilter: 'blur(8px)' }}
          >
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Слайд ${i + 1}`}
                aria-current={i === current ? 'true' : undefined}
                className={cn('h-2 rounded-full transition-all', i === current ? 'w-6' : 'w-2')}
                style={{
                  background: i === current ? 'var(--sl-accent)' : 'var(--sl-text-muted)',
                  opacity: i === current ? 1 : 0.5,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
