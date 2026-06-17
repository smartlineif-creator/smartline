'use client';

const ITEMS = [
  '★ 4.9 з 5 — рейтинг покупців',
  '2 400+ замовлень щомісяця',
  '🚚 Доставка від 1 дня',
  '✅ Гарантія 2 роки',
  '🔒 Безпечна оплата',
  'Понад 500 моделей в наявності',
  '💬 Підтримка 7 днів на тиждень',
  '↩ Повернення протягом 14 днів',
];

interface Props {
  items?: string[];
}

export default function HomeMarquee({ items }: Props) {
  const sourceItems = items?.filter((item) => item.trim())?.length ? items.filter((item) => item.trim()) : ITEMS;
  const repeated = [...sourceItems, ...sourceItems, ...sourceItems];

  return (
    <section className="relative my-2">
      <div
        className="relative left-1/2 min-h-14 w-screen -translate-x-1/2 overflow-hidden py-4"
        style={{
          borderTop: '1px solid var(--sl-border)',
          borderBottom: '1px solid var(--sl-border)',
          background: 'var(--sl-bg-elevated)',
        }}
      >
        <div
          className="flex whitespace-nowrap"
          style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}
        >
          <div
            className="flex min-w-max gap-8 px-8"
            style={{ animation: 'sl-marquee 40s linear infinite' }}
          >
            {repeated.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="inline-flex items-center gap-3 text-sm"
                style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}
              >
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ background: 'var(--sl-accent)', flexShrink: 0 }}
                />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
