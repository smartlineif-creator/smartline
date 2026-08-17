import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Service } from '@/types';
import ServiceCard from '@/components/store/ServiceCard';

interface Props {
  services: Service[];
  eyebrow?: string;
  title: string;
  subtitle?: string;
  layout: 'grid' | 'carousel';
  href: string;
  hrefLabel: string;
}

export default function ServicesSection({
  services, eyebrow, title, subtitle, layout, href, hrefLabel,
}: Props) {
  if (!services.length) return null;

  return (
    <section
      className="reveal space-y-6"
      style={{ borderTop: '1px solid var(--sl-border)', paddingTop: '2.5rem' }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow && (
            <div
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
              style={{
                background: 'var(--sl-bg-elevated)',
                color: 'var(--sl-text-secondary)',
                border: '1px solid var(--sl-border)',
                fontFamily: 'var(--sl-font-mono)',
              }}
            >
              {eyebrow}
            </div>
          )}
          <h2
            className="mt-2 text-3xl sm:text-4xl"
            style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
          >
            {title.toUpperCase()}
          </h2>
          {subtitle && (
            <p className="mt-2 max-w-2xl" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
              {subtitle}
            </p>
          )}
        </div>
        <Link
          href={href}
          className="sl-hover-accent inline-flex items-center gap-1 text-sm font-medium shrink-0"
          style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
        >
          {hrefLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {layout === 'carousel' ? (
        <div className="-mx-2 overflow-x-auto px-2 pt-2 pb-6 -mt-2 -mb-6">
          <div className="flex min-w-max snap-x snap-mandatory gap-4">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} className="w-[300px] shrink-0 snap-start" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </section>
  );
}
