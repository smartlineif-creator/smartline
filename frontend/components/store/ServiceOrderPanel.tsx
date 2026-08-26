'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Service } from '@/types';
import { useCartStore } from '@/store/cart';
import ServiceAddButton, { buildServiceCartItem } from './ServiceAddButton';
import WishlistButton from './WishlistButton';
import StickyBuyBar from './StickyBuyBar';
import { formatPrice } from '@/lib/utils';

interface Props {
  service: Service;
}

export default function ServiceOrderPanel({ service }: Props) {
  const addItem = useCartStore((st) => st.addItem);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const tiersRef = useRef<HTMLDivElement | null>(null);
  const tiers = service.tiers ?? [];
  const [selectedId, setSelectedId] = useState<string | undefined>(tiers[0]?.id);
  const selectedTier = tiers.find((t) => t.id === selectedId) ?? tiers[0];

  const amount = selectedTier ? Number(selectedTier.price) : Number(service.price);
  const priceStr = formatPrice(amount);

  const handleBarAdd = () => {
    addItem(buildServiceCartItem(service, selectedTier));
    toast.success(`«${service.name}» додано до кошика`);
  };

  return (
    <>
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--sl-text-muted)] mb-1">
        Вартість
      </p>
      <p className="font-[var(--sl-font-display)] text-[44px] tracking-[0.03em] text-[var(--sl-accent)] leading-none mb-1.5">
        {priceStr}
      </p>

      {tiers.length >= 2 ? (
        <div ref={tiersRef} className="flex flex-col gap-2 mb-5">
          {tiers.map((tier) => (
            /* The tier name is what explains the price gap, so it wraps in full
               instead of truncating; the price sits under it rather than competing
               for the same line. */
            <label
              key={tier.id}
              className={`flex cursor-pointer gap-2.5 rounded-xl border px-3 py-3 text-sm transition-colors ${
                selectedId === tier.id
                  ? 'border-[var(--sl-border-hover)] bg-[var(--sl-bg-elevated)]'
                  : 'border-[var(--sl-border)]'
              }`}
            >
              <input
                type="radio"
                name="tier"
                checked={selectedId === tier.id}
                onChange={() => setSelectedId(tier.id)}
                className="accent-[var(--sl-accent)] mt-0.5 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block leading-snug text-[var(--sl-text-primary)]">{tier.label}</span>
                {tier.note && (
                  <span className="mt-0.5 block text-xs leading-snug text-[var(--sl-text-muted)]">
                    {tier.note}
                  </span>
                )}
                <span className="mt-1.5 block font-[var(--sl-font-mono)] text-[15px] text-[var(--sl-text-secondary)]">
                  {formatPrice(Number(tier.price))}
                </span>
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--sl-text-muted)] mb-5 leading-relaxed">
          Точна ціна залежить від моделі. Уточнюємо при оформленні.
        </p>
      )}

      <div ref={ctaRef} className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          <ServiceAddButton
            service={service}
            tier={selectedTier}
            label="Додати до кошика"
            className="sl-hover-ghost flex-1 rounded-xl border border-[var(--sl-accent)] py-3 text-sm font-semibold text-[var(--sl-accent)] transition-all"
          />
          <WishlistButton
            item={{
              key: `service:${service.id}`,
              kind: 'service',
              productId: '',
              serviceId: service.id,
              slug: service.slug,
              name: service.name,
              image: service.coverImage ?? '',
              price: amount,
            }}
            size="md"
          />
        </div>

        {/* Same hierarchy as the product page: checkout is the primary action. */}
        <Link
          href="/checkout"
          onClick={() => addItem(buildServiceCartItem(service, selectedTier))}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--sl-accent)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--sl-accent-hover)]"
          style={{ fontFamily: 'var(--sl-font-mono)' }}
        >
          Купити зараз
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <StickyBuyBar
        anchorRef={ctaRef}
        price={amount}
        configLabel={tiers.length >= 2 ? selectedTier?.label : undefined}
        onConfigTap={tiers.length >= 2 ? () => tiersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) : undefined}
        primaryLabel="Купити зараз"
        onPrimary={() => addItem(buildServiceCartItem(service, selectedTier))}
        onAddToCart={handleBarAdd}
        hideAt="lg"
      />
    </>
  );
}
