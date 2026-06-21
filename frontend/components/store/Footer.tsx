import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--sl-bg-surface)',
        borderTop: '1px solid var(--sl-border)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <div
              className="mb-4 text-2xl font-bold"
              style={{ fontFamily: 'var(--sl-font-display)', letterSpacing: '0.05em' }}
            >
              <span style={{ color: 'var(--sl-text-primary)' }}>SMART</span>
              <span style={{ color: 'var(--sl-accent)' }}>LINE</span>
            </div>
            <p className="mb-5 text-sm leading-6" style={{ color: 'var(--sl-text-muted)' }}>
              Магазин перевіреної техніки в Івано-Франківську. Ноутбуки Dell, Lenovo, HP, ASUS з гарантією та доставкою по Україні.
            </p>
            {/* Trust badges */}
            <div className="flex flex-wrap gap-2">
              {['🔒 Безпечна оплата', '🚚 Нова Пошта', '✅ Перевірена техніка'].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    background: 'var(--sl-bg-elevated)',
                    color: 'var(--sl-text-secondary)',
                    border: '1px solid var(--sl-border)',
                    fontFamily: 'var(--sl-font-mono)',
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Catalog */}
          <div>
            <h4
              className="mb-4 text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}
            >
              Каталог
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/catalog/smartfony', label: 'Смартфони' },
                { href: '/catalog/noutbuky', label: 'Ноутбуки' },
                { href: '/catalog/aksesuary', label: 'Аксесуари' },
                { href: '/catalog', label: 'Усі категорії' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="sl-hover-text-primary"
                    style={{ color: 'var(--sl-text-muted)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4
              className="mb-4 text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}
            >
              Компанія
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/about', label: 'Про нас' },
                { href: '/contacts', label: 'Контакти' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="sl-hover-text-primary"
                    style={{ color: 'var(--sl-text-muted)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customers */}
          <div>
            <h4
              className="mb-4 text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }}
            >
              Клієнтам
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/account/orders', label: 'Мої замовлення' },
                { href: '/account', label: 'Особистий кабінет' },
                { href: '/cart', label: 'Кошик' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="sl-hover-text-primary"
                    style={{ color: 'var(--sl-text-muted)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 flex flex-col items-center justify-between gap-4 pt-6 text-center sm:flex-row"
          style={{ borderTop: '1px solid var(--sl-border)' }}
        >
          <p
            className="text-xs"
            style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
          >
            © {new Date().getFullYear()} SmartLine. Всі права захищені.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="sl-hover-accent text-xs" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
              Публічна оферта
            </Link>
            <Link href="/privacy" className="sl-hover-accent text-xs" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
              Конфіденційність
            </Link>
            <a href="https://www.instagram.com/smartline_if" target="_blank" rel="noopener noreferrer" className="sl-hover-accent text-xs" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
