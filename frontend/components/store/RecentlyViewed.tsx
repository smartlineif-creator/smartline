'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { useRecentlyViewedStore } from '@/store/recentlyViewed';
import { formatPrice } from '@/lib/utils';

interface Props {
  currentProductId: string;
}

export default function RecentlyViewed({ currentProductId }: Props) {
  const getOthers = useRecentlyViewedStore((s) => s.getOthers);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const others = getOthers(currentProductId);
  if (others.length === 0) return null;

  return (
    <section className="mt-12">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ background: 'var(--sl-accent-muted)', border: '1px solid var(--sl-accent)' }}
        >
          <Clock className="h-4 w-4" style={{ color: 'var(--sl-accent)' }} />
        </div>
        <h2
          className="text-xl"
          style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
        >
          НЕЩОДАВНО ПЕРЕГЛЯНУТІ
        </h2>
      </div>

      {/* Horizontal scroll list */}
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {others.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="group flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl transition-all duration-200"
            style={{
              background: 'var(--sl-bg-surface)',
              border: '1px solid var(--sl-border)',
            }}
          >
            {/* Image */}
            <div
              className="relative aspect-square overflow-hidden"
              style={{ background: 'var(--sl-bg-elevated)' }}
            >
              <div className="absolute inset-0 p-2">
                <div className="relative h-full w-full overflow-hidden rounded-lg">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="144px"
                  />
                </div>
              </div>
            </div>
            {/* Info */}
            <div className="p-2">
              <p
                className="line-clamp-2 text-xs font-medium leading-snug"
                style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}
              >
                {product.name}
              </p>
              <p
                className="mt-1 text-xs font-semibold"
                style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}
              >
                {formatPrice(product.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
