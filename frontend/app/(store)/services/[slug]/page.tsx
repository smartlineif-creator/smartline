import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getService, getServiceReviews } from '@/lib/api';
import Breadcrumbs from '@/components/store/Breadcrumbs';
import { Service } from '@/types';
import BlockRenderer from '@/components/store/BlockRenderer';
import ServiceOrderPanel from '@/components/store/ServiceOrderPanel';
import ReviewsSection from '@/components/store/ReviewsSection';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const service = await getService(slug);
    return {
      title: `${service.name} — SmartLine`,
      description: service.description ?? `Послуга ${service.name} від SmartLine`,
    };
  } catch {
    return { title: 'Послуга — SmartLine' };
  }
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;

  let service: Service;
  try {
    service = await getService(slug);
  } catch {
    notFound();
  }
  const reviewsRes = await getServiceReviews(service.id).catch(
    () => ({ data: [], total: 0, page: 1, limit: 10, avgRating: 0 }),
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 pb-20">
      <Breadcrumbs items={[{ label: 'Послуги', href: '/services' }, { label: service.name }]} />

      {/* Hero + content — one grid so the order card can stick for the whole page */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 xl:gap-14 items-start">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--sl-accent)] mb-2.5">
            Послуга
          </p>
          <h1 className="font-[var(--sl-font-display)] text-[clamp(32px,5vw,52px)] tracking-[0.04em] leading-[1.05] mb-4">
            {service.name.toUpperCase()}
          </h1>
          {service.description && (
            <p className="text-[15px] text-[var(--sl-text-secondary)] leading-relaxed max-w-lg mb-6">
              {service.description}
            </p>
          )}

          {service.coverImage && (
            <div className="relative aspect-[16/7] rounded-2xl overflow-hidden bg-[var(--sl-bg-elevated)] mt-2">
              <Image
                src={service.coverImage}
                alt={service.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 800px"
              />
            </div>
          )}

          {/* Content blocks */}
          <div className="mt-12">
            <BlockRenderer blocks={service.blocks} />
          </div>
        </div>

        {/* Order card — its own grid child so that on <lg it stacks right after
            the content, BEFORE the reviews: the buy block should not sink below
            a potentially long review list on mobile. On lg it spans both rows
            of the first column and sticks as before. */}
        <div className="bg-[var(--sl-bg-surface)] border border-[var(--sl-border)] rounded-2xl p-7 lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <ServiceOrderPanel service={service} />
          <hr className="border-[var(--sl-border)] my-4" />
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between text-[var(--sl-text-muted)]">
              <span>Отримання</span>
              <span className="text-[var(--sl-text-secondary)]">Самовивіз або НП</span>
            </div>
            <div className="flex justify-between text-[var(--sl-text-muted)]">
              <span>Оплата</span>
              <span className="text-[var(--sl-text-secondary)]">Готівка / Онлайн</span>
            </div>
          </div>
        </div>

        {/* Reviews — third grid child: on <lg it lands below the order card,
            on lg auto-placement returns it to the first column under the content. */}
        <div className="lg:col-start-1">
          <h2 className="font-[var(--sl-font-display)] text-2xl tracking-[0.04em] text-[var(--sl-text-primary)] mb-6">
            ВІДГУКИ
          </h2>
          <ReviewsSection
            target={{ kind: 'service', id: service.id }}
            initial={reviewsRes.data}
            total={reviewsRes.total}
            avgRating={reviewsRes.avgRating}
          />
        </div>
      </div>
    </main>
  );
}
