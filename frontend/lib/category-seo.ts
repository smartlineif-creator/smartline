// Per-category meta descriptions (provided by SEO). Priority:
//   1. admin-set category.seoText (editable per category),
//   2. these curated texts by slug,
//   3. a generated fallback so EVERY category has a description.
const CATEGORY_SEO: Record<string, string> = {
  noutbuky:
    'Ноутбуки в SmartLine — Dell, Lenovo, HP, ASUS з перевіркою та гарантією. Доставка Новою Поштою по всій Україні.',
  aksesuary:
    'Аксесуари для ноутбука та ПК в SmartLine — миші, килимки, кабелі та інше. Новий і перевірений товар з гарантією.',
  'systemni-bloky':
    'Системні блоки в SmartLine — готові ПК для роботи та ігор з перевіркою та гарантією. Доставка по Україні.',
  monitory:
    'Монітори в SmartLine — перевірені моделі різних діагоналей з гарантією. Доставка Новою Поштою по всій Україні.',
};

export function categoryDescription(
  slug: string,
  name: string,
  seoText?: string | null,
): string {
  const text =
    seoText?.trim() ||
    CATEGORY_SEO[slug] ||
    `${name} в SmartLine — перевірений товар з гарантією. Доставка Новою Поштою по всій Україні.`;
  return text.slice(0, 160);
}
