'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

interface Props {
  anchorRef: React.RefObject<HTMLElement | null>;
  price: number;
  crossedPrice?: number | null;
  configLabel?: string;
  onConfigTap?: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  onAddToCart: () => void;
  hideAt: 'md' | 'lg';
}

export default function StickyBuyBar({
  anchorRef,
  price,
  crossedPrice,
  configLabel,
  onConfigTap,
  primaryLabel,
  onPrimary,
  onAddToCart,
  hideAt,
}: Props) {
  const [passed, setPassed] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      // Visible whenever the main CTA block is anywhere outside the viewport —
      // including on first paint, before the user has ever reached it. Sales
      // depend on the buy action being reachable from the very first screen.
      ([entry]) => {
        setPassed(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [anchorRef]);

  useEffect(() => {
    // Only fields that summon the on-screen keyboard. A bare 'input' matcher
    // also caught the tier RADIO buttons — picking a tier left focus on the
    // radio and silently suppressed the bar until the next tap elsewhere.
    const isTextEntry = (target: EventTarget | null): boolean =>
      target instanceof HTMLElement &&
      target.matches('textarea, input:not([type=radio]):not([type=checkbox]):not([type=button]):not([type=submit]):not([type=range])');

    const onFocusIn = (e: FocusEvent) => {
      if (isTextEntry(e.target)) setInputFocused(true);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (isTextEntry(e.target)) setInputFocused(false);
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const visible = passed && !inputFocused;
  const hideClass = hideAt === 'md' ? 'md:hidden' : 'lg:hidden';

  return (
    <>
      {visible && <div className={cn('h-[72px]', hideClass)} aria-hidden />}
      <div
        className={cn(
          'fixed bottom-0 inset-x-0 z-40 transition-transform duration-200',
          visible ? 'translate-y-0' : 'translate-y-full',
          hideClass,
        )}
        style={{
          background: 'var(--sl-bg-surface)',
          borderTop: '1px solid var(--sl-border)',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.35)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-end gap-x-2">
              <span
                className="whitespace-nowrap text-lg font-semibold tracking-tight"
                style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
              >
                {formatPrice(price)}
              </span>
              {crossedPrice && (
                <span
                  className="whitespace-nowrap pb-0.5 text-xs line-through"
                  style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
                >
                  {formatPrice(crossedPrice)}
                </span>
              )}
            </div>
            {configLabel && (
              // block + max-w-full: an inline button ignores `truncate` and the
              // label runs underneath the CTA buttons instead of ellipsizing.
              <button
                type="button"
                onClick={onConfigTap}
                className="mt-0.5 block max-w-full truncate text-left text-[11px] underline decoration-dotted"
                style={{ color: 'var(--sl-text-muted)' }}
              >
                {configLabel}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onAddToCart}
            aria-label="Додати в кошик"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ border: '1px solid var(--sl-accent)', color: 'var(--sl-accent)' }}
          >
            <ShoppingCart className="h-5 w-5" />
          </button>

          <Link
            href="/checkout"
            onClick={onPrimary}
            className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold"
            style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
