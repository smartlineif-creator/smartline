import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Про нас | SmartLine',
  description: 'SmartLine — інтернет-магазин електроніки з офіційною гарантією та швидкою доставкою по Україні.',
};

const ADVANTAGES = [
  { icon: '✅', title: 'Офіційна гарантія', text: 'Всі товари мають офіційну гарантію виробника від 12 місяців.' },
  { icon: '🚚', title: 'Швидка доставка', text: 'Доставляємо Новою Поштою по всій Україні. Відправка в день замовлення.' },
  { icon: '💳', title: 'Зручна оплата', text: 'Онлайн картою, при отриманні або в розстрочку на 3/6/12 місяців.' },
  { icon: '🔄', title: 'Легке повернення', text: '14 днів на повернення товару без зайвих питань.' },
  { icon: '📞', title: 'Підтримка 7 днів', text: 'Наші менеджери завжди готові допомогти з вибором та замовленням.' },
  { icon: '💰', title: 'Найкращі ціни', text: 'Регулярно оновлюємо ціни та проводимо акції для наших покупців.' },
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
          SmartLine — сучасний інтернет-магазин електроніки, що спеціалізується на смартфонах, ноутбуках та аксесуарах.
          Ми пропонуємо тільки оригінальну продукцію від перевірених постачальників з офіційною гарантією.
          Наша мета — зробити покупку техніки простою, швидкою та вигідною для кожного українця.
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
