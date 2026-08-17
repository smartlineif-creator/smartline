import { Metadata } from 'next';
import { getServices } from '@/lib/api';
import Breadcrumbs from '@/components/store/Breadcrumbs';
import { Service } from '@/types';
import ServiceCard from '@/components/store/ServiceCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Послуги — SmartLine',
  description: 'Чистка ноутбуків, встановлення Windows та інші сервісні послуги від SmartLine в Івано-Франківську.',
};

export default async function ServicesPage() {
  const services = await getServices().catch(() => [] as Service[]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 pb-20">
      <Breadcrumbs items={[{ label: 'Послуги' }]} />

      <div className="flex items-start gap-4 mb-10">
        <div className="w-1 h-11 rounded-full bg-[var(--sl-accent)] shrink-0 mt-1" />
        <div>
          <h1 className="font-[var(--sl-font-display)] text-[clamp(32px,5vw,48px)] tracking-[0.04em] leading-[1.05]">
            ПОСЛУГИ
          </h1>
          <p className="text-sm text-[var(--sl-text-muted)] mt-1.5 max-w-lg">
            Діагностика, чистка, встановлення ПЗ та ремонт ноутбуків. Самовивіз або Нова Пошта.
          </p>
        </div>
      </div>

      {services.length === 0 ? (
        <p className="text-[var(--sl-text-muted)] text-sm">Поки що послуги не додані.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </main>
  );
}
