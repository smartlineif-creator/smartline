import Link from 'next/link';
import Image from 'next/image';
import { Service } from '@/types';
import ServiceAddButton from '@/components/store/ServiceAddButton';
import WishlistButton from '@/components/store/WishlistButton';
import Rating from '@/components/store/Rating';
import { formatPrice, cn, getServiceDisplayPrice } from '@/lib/utils';

interface Props {
  service: Service;
  className?: string;
}

export default function ServiceCard({ service, className }: Props) {
  const { amount, prefix } = getServiceDisplayPrice(service);
  const priceStr = formatPrice(amount);
  const firstTier = service.tiers?.[0];

  return (
    <div className={cn('group/card relative bg-[var(--sl-bg-surface)] border border-[var(--sl-border)] rounded-2xl overflow-hidden flex flex-col sl-hover-card transition-all duration-200 hover:-translate-y-0.5', className)}>
      {/* Overlay link makes the whole card clickable. The buttons below sit on a
          higher layer, so they stay usable — a nested <a> would be invalid HTML. */}
      <Link
        href={`/services/${service.slug}`}
        aria-label={service.name}
        className="absolute inset-0 z-0"
      />

      <div className="absolute right-2 top-2 z-20">
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
          size="sm"
        />
      </div>

      {/* pointer-events-none: this positioned box paints ABOVE the z-0 overlay
          link (later in DOM), so without it clicks on the photo went nowhere. */}
      <div className="pointer-events-none relative aspect-video bg-[var(--sl-bg-elevated)] flex items-center justify-center overflow-hidden">
        {service.coverImage ? (
          <Image
            src={service.coverImage}
            alt={service.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <svg
            className="w-14 h-14 text-[var(--sl-text-muted)] opacity-40"
            viewBox="0 0 56 56"
            fill="none"
          >
            <path
              d="M14 28c0-7.7 6.3-14 14-14 3.5 0 6.7 1.3 9.1 3.4L28 26.7V14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="28" cy="28" r="18" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="28" cy="28" r="5" fill="currentColor" opacity="0.6" />
          </svg>
        )}
      </div>

      <div className="pointer-events-none relative z-10 p-5 flex flex-col gap-3 flex-1">
        <h2 className="font-[var(--sl-font-display)] text-[22px] tracking-[0.04em] leading-tight text-[var(--sl-text-primary)]">
          {service.name.toUpperCase()}
        </h2>

        <Rating ratings={service.reviews?.map((r) => r.rating) ?? []} />

        {service.description && (
          <p className="text-sm text-[var(--sl-text-secondary)] leading-relaxed line-clamp-3">
            {service.description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-[var(--sl-border)] flex items-center justify-between gap-3">
          <div>
            {prefix && (
              <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--sl-text-muted)]">
                {prefix}
              </span>
            )}
            <span className="font-[var(--sl-font-display)] text-[26px] tracking-[0.03em] text-[var(--sl-accent)]">
              {priceStr}
            </span>
          </div>

          <div className="pointer-events-auto relative z-10 flex gap-2">
            <ServiceAddButton service={service} tier={firstTier} />
          </div>
        </div>
      </div>
    </div>
  );
}
