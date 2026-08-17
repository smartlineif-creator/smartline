'use client';

import { useState } from 'react';
import { ServiceBlockFaq } from '@/types';
import { ChevronDown } from 'lucide-react';

export default function FaqBlock({ block }: { block: ServiceBlockFaq }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-px max-w-2xl">
      {block.items.map((item, i) => (
        <div
          key={i}
          className={`border border-[var(--sl-border)] bg-[var(--sl-bg-surface)] overflow-hidden transition-colors ${
            i === 0 ? 'rounded-t-xl' : ''
          } ${i === block.items.length - 1 ? 'rounded-b-xl' : ''}`}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-left text-[var(--sl-text-primary)] cursor-pointer"
          >
            {item.question}
            <ChevronDown
              className={`w-4 h-4 text-[var(--sl-text-muted)] shrink-0 transition-transform ${
                open === i ? 'rotate-180' : ''
              }`}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-[13px] text-[var(--sl-text-secondary)] leading-relaxed">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
