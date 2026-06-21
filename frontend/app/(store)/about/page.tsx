import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Про нас | SmartLine',
  description: 'SmartLine — магазин перевіреної техніки в Івано-Франківську (ТЦ Щедрик). Ноутбуки Dell, Lenovo, HP, ASUS з гарантією та доставкою по всій Україні.',
};

const ADVANTAGES = [
  { icon: '✅', title: 'Перевірена техніка', text: 'Кожен ноутбук перевіряється перед продажем. Надаємо гарантію на всі пристрої.' },
  { icon: '🚚', title: 'Швидка доставка', text: 'Відправляємо Новою Поштою по всій Україні. Відправка в день замовлення або наступний день.' },
  { icon: '💳', title: 'Зручна оплата', text: 'Оплата онлайн картою або накладним платежем при отриманні.' },
  { icon: '🔄', title: 'Легке повернення', text: '14 днів на повернення товару відповідно до законодавства.' },
  { icon: '📞', title: 'Консультація', text: 'Допоможемо підібрати ноутбук під ваші задачі та бюджет. Пн–Пт 11:00–18:00, Сб 11:00–17:00.' },
  { icon: '💰', title: 'Чесні ціни', text: 'Продаємо техніку за ринковими цінами. Без прихованих доплат.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1
          className="mb-4 text-4xl sm:text-5xl"
          style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
        >
          ПРО SMARTLINE
        </h1>
        <p
          className="mb-12 max-w-2xl text-lg leading-relaxed"
          style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}
        >
          SmartLine — магазин перевіреної техніки в Івано-Франківську. Ми спеціалізуємось на ноутбуках провідних брендів:
          Dell, Lenovo, HP, ASUS, Acer. Кожен пристрій проходить перевірку перед продажем.
          Знаходимось у ТЦ Щедрик (вул. Галицька 112Д, маг №17) — можна приїхати, подивитись і вибрати особисто.
        </p>

        <h2
          className="mb-6 text-2xl sm:text-3xl"
          style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
        >
          ЧОМУ ОБИРАЮТЬ НАС
        </h2>
        <div className="mb-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADVANTAGES.map((a) => (
            <div
              key={a.title}
              className="rounded-2xl p-5"
              style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
            >
              <div className="mb-3 text-3xl">{a.icon}</div>
              <h3
                className="mb-1 font-semibold"
                style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
              >
                {a.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--sl-text-muted)' }}>{a.text}</p>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--sl-accent-muted)', border: '1px solid var(--sl-accent)' }}
        >
          <h2
            className="mb-2 text-2xl"
            style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
          >
            Є ПИТАННЯ?
          </h2>
          <p className="mb-6 text-sm" style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}>
            Зв&apos;яжіться з нами — ми завжди раді допомогти
          </p>
          <Link
            href="/contacts"
            className="sl-hover-btn-primary inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold"
            style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
          >
            Написати нам
          </Link>
        </div>
      </div>
    </div>
  );
}
