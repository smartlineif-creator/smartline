'use client';

import { useCartStore } from '@/store/cart';
import { CartLocalItem, Service, ServiceTier } from '@/types';
import { toast } from 'sonner';

/**
 * The one place a service becomes a cart line. Both the plain add button and the
 * detail page's «Купити зараз» build the item through this, so a tier can never
 * be attached by one path and dropped by the other.
 */
export function buildServiceCartItem(service: Service, tier?: ServiceTier): CartLocalItem {
  return {
    itemType: 'service',
    serviceId: service.id,
    serviceSlug: service.slug,
    serviceName: service.name,
    servicePrice: Number(tier?.price ?? service.price),
    tierId: tier?.id,
    tierLabel: tier?.label,
    quantity: 1,
  };
}

interface Props {
  service: Service;
  tier?: ServiceTier;
  label?: string;
  className?: string;
}

export default function ServiceAddButton({ service, tier, label = 'В кошик', className }: Props) {
  const addItem = useCartStore((s) => s.addItem);

  function handleAdd() {
    addItem(buildServiceCartItem(service, tier));
    toast.success(`«${service.name}» додано до кошика`);
  }

  return (
    <button
      onClick={handleAdd}
      className={
        className ??
        'px-3 py-2 rounded-xl text-sm font-semibold bg-[var(--sl-accent)] text-white hover:bg-[var(--sl-accent-hover)] transition-colors'
      }
    >
      {label}
    </button>
  );
}
