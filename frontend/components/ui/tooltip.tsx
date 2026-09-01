'use client';

import { ReactNode, useRef, useState } from 'react';

interface TooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Lightweight hover tooltip. Positioned `fixed` from the trigger's rect so it
 * never clips inside an overflow container (tables, cards). Shows instantly on
 * hover (no native delay) and only when `label` is non-empty.
 */
export function Tooltip({ label, children, className }: TooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  const show = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setPos({ x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <span ref={ref} onMouseEnter={show} onMouseLeave={() => setPos(null)} className={className}>
      {children}
      {pos && label && (
        <span
          role="tooltip"
          className="pointer-events-none fixed z-[60] max-w-xs -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium leading-snug text-white shadow-lg ring-1 ring-black/10"
          style={{ left: pos.x, top: pos.y - 8 }}
        >
          {label}
          <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}
