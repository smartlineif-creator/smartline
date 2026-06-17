'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useWishlistStore, WishlistItem } from '@/store/wishlist';

interface Props {
  item: WishlistItem;
  /** Size variant: sm for ProductCard overlay, md for ProductDetail */
  size?: 'sm' | 'md';
  className?: string;
}

export default function WishlistButton({ item, size = 'sm', className = '' }: Props) {
  const { toggle, has } = useWishlistStore();
  // Defer to client to avoid hydration mismatch with localStorage
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isInWishlist = mounted && has(item.key);

  const dim = size === 'sm' ? 'h-7 w-7' : 'h-10 w-10';
  const iconDim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-[18px] w-[18px]';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
      aria-label={isInWishlist ? 'Видалити з вибраного' : 'Додати до вибраного'}
      aria-pressed={isInWishlist}
      className={`flex shrink-0 items-center justify-center rounded-full transition-all duration-200 ${dim} ${className}`}
      style={{
        background: isInWishlist
          ? 'color-mix(in srgb, var(--sl-status-error) 12%, transparent)'
          : 'var(--sl-bg-surface-glass)',
        border: `1px solid ${isInWishlist
          ? 'color-mix(in srgb, var(--sl-status-error) 40%, transparent)'
          : 'var(--sl-border)'}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <Heart
        className={iconDim}
        style={{
          color: isInWishlist ? 'var(--sl-status-error)' : 'var(--sl-text-muted)',
          fill: isInWishlist ? 'var(--sl-status-error)' : 'none',
          transition: 'all 0.15s',
        }}
      />
    </button>
  );
}
