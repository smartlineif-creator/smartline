'use client';

export default function MobileStickyBar() {
  return (
    <div className="sl-sticky-bar md:hidden">
      <span>🔒 Безпечна оплата</span>
      <span style={{ color: 'var(--sl-border-hover)' }}>·</span>
      <span>🚚 Доставка 1–2 дні</span>
      <span style={{ color: 'var(--sl-border-hover)' }}>·</span>
      <span>✅ Гарантія 2 роки</span>
    </div>
  );
}
