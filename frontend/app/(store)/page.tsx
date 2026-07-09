import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  CreditCard,
  Headphones,
  Laptop2,
  MonitorSmartphone,
  PackageCheck,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import {
  getActivePromotions,
  getBanners,
  getCategories,
  getFeaturedProducts,
  getHomepageSections,
  getProducts,
  getStoreReviews,
  HomepageSectionData,
} from '@/lib/api';
import BannerSlider from '@/components/store/BannerSlider';
import CountdownTimer from '@/components/store/CountdownTimer';
import HomeMarquee from '@/components/store/HomeMarquee';
import ProductCarousel from '@/components/store/ProductCarousel';
import ReviewCarousel from '@/components/store/ReviewCarousel';
import { Category, Product, Promotion, Review } from '@/types';
import {
  formatPrice,
  getRepresentativeImage,
  getProductDisplayPrices,
  getProductHref,
} from '@/lib/utils';

export const revalidate = 60;

const CATEGORY_ICON_RULES = [
  { pattern: /ноутбук|macbook|ultrabook|laptop/i, icon: Laptop2 },
  { pattern: /смартфон|iphone|phone/i, icon: MonitorSmartphone },
  { pattern: /аксесуар|headphone|навушник|клавіатур|миша|запчастин/i, icon: Headphones },
];

function getCategoryIcon(category: Category) {
  const source = `${category.name} ${category.slug}`;
  const matched = CATEGORY_ICON_RULES.find((rule) => rule.pattern.test(source));
  return matched?.icon || Boxes;
}

function getRootCategories(categories: Category[]) {
  return categories.filter((category) => !category.parentId);
}

function getPromoProducts(promotions: Promotion[]) {
  const seen = new Set<string>();
  return promotions
    .flatMap((promotion: any) => promotion.products?.map((item: any) => item.product) || [])
    .filter((product: Product) => {
      if (!product || seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
}

function hasRealProductImage(product?: Product) {
  if (!product) return false;
  if (product.images?.length) return true;
  return Boolean(product.variants?.some((v) => (v.images?.length ?? 0) > 0));
}

function getCategorySubcopy(category: Category) {
  const childrenCount = category.children?.length || 0;
  if (childrenCount > 0) return `${childrenCount} підкатегорій для швидкого старту`;
  return 'Перейти до актуальних товарів';
}

/* ─── Hero ──────────────────────────────────────────────────────────── */
function HeroSpotlight({ product, title, subtitle }: { product: Product; title?: string; subtitle?: string }) {
  const { finalPrice, crossedPrice } = getProductDisplayPrices(product);

  return (
    <section
      className="relative overflow-hidden rounded-[28px] p-6 sm:p-8 lg:p-12"
      style={{
        background: 'var(--sl-bg-surface)',
        border: '1px solid var(--sl-border)',
      }}
    >
      {/* Radial glow bg */}
      <div
        className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, var(--sl-accent-glow) 0%, transparent 70%)' }}
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-center">
        {/* Left: copy */}
        <div className="space-y-6">
          <div
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: 'var(--sl-accent-muted)',
              color: 'var(--sl-accent)',
              border: '1px solid var(--sl-accent)',
              fontFamily: 'var(--sl-font-mono)',
            }}
          >
            ★ Хіт продажів
          </div>

          <h1
            className="text-5xl leading-none sm:text-6xl xl:text-7xl"
            style={{
              fontFamily: 'var(--sl-font-display)',
              color: 'var(--sl-text-primary)',
              letterSpacing: '0.03em',
            }}
          >
            {(title || 'ТЕХНІКА, ЯКУ ХОЧЕТЬСЯ КУПИТИ ЗАРАЗ').toUpperCase()}
          </h1>

          <p
            className="max-w-lg text-base leading-7 sm:text-lg"
            style={{ color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-body)' }}
          >
            {subtitle || 'Живі фото, зрозумілі конфігурації, чесні характеристики. Ціни дійсні до кінця місяця.'}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href={getProductHref(product)}
              className="sl-hover-btn-primary sl-hero-primary-cta relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl px-6 text-sm font-semibold"
              style={{
                background: 'var(--sl-accent)',
                color: '#fff',
                fontFamily: 'var(--sl-font-mono)',
              }}
            >
              Переглянути хіт
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/catalog"
              className="sl-hover-btn-secondary inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold"
              style={{
                border: '1px solid var(--sl-border)',
                color: 'var(--sl-text-secondary)',
                background: 'var(--sl-bg-elevated)',
                fontFamily: 'var(--sl-font-mono)',
              }}
            >
              Увесь каталог
            </Link>
          </div>

          {/* Trust mini-row */}
          <div className="flex flex-wrap gap-3 pt-2">
            {['🔒 Безпечна оплата', '🚚 Доставка 1–2 дні', '✅ Гарантія'].map((item) => (
              <span
                key={item}
                className="rounded-full px-3 py-1 text-xs"
                style={{
                  background: 'var(--sl-bg-elevated)',
                  color: 'var(--sl-text-secondary)',
                  border: '1px solid var(--sl-border)',
                  fontFamily: 'var(--sl-font-mono)',
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Right: product card */}
        <Link
          href={getProductHref(product)}
          className="sl-hover-border group relative block overflow-hidden rounded-2xl"
          style={{
            background: 'var(--sl-bg-elevated)',
            border: '1px solid var(--sl-border)',
          }}
        >
          {/* Amber radial behind image */}
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(circle at 50% 40%, var(--sl-accent-glow) 0%, transparent 70%)' }}
          />
          <div className="relative aspect-[4/3] overflow-hidden">
            <div className="absolute inset-0 p-6">
              <div className="relative h-full w-full overflow-hidden rounded-xl">
                <Image
                  src={getRepresentativeImage(product)}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1280px) 100vw, 440px"
                />
              </div>
            </div>
          </div>
          <div className="space-y-3 p-5" style={{ borderTop: '1px solid var(--sl-border)' }}>
            <div className="flex flex-wrap gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: 'var(--sl-accent)', color: '#fff', fontFamily: 'var(--sl-font-mono)' }}
              >
                ХІТ
              </span>
              {product.category && (
                <span
                  className="rounded-full px-3 py-1 text-xs"
                  style={{
                    background: 'var(--sl-bg-primary)',
                    color: 'var(--sl-text-muted)',
                    border: '1px solid var(--sl-border)',
                    fontFamily: 'var(--sl-font-mono)',
                  }}
                >
                  {product.category.name}
                </span>
              )}
            </div>
            <h2
              className="line-clamp-2 text-lg font-semibold leading-tight"
              style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
            >
              {product.name}
            </h2>
            <div className="flex flex-wrap items-end gap-3">
              <span
                className="text-2xl font-semibold tracking-tight"
                style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}
              >
                {formatPrice(finalPrice)}
              </span>
              {crossedPrice && (
                <span
                  className="text-sm line-through"
                  style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
                >
                  {formatPrice(crossedPrice)}
                </span>
              )}
            </div>
            <div
              className="inline-flex items-center gap-1 text-sm font-medium"
              style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
            >
              Дивитись товар
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

/* ─── Categories ─────────────────────────────────────────────────────── */
function CategoryQuickGrid({ categories, title, subtitle }: { categories: Category[]; title?: string; subtitle?: string }) {
  return (
    <section className="reveal space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            className="sl-section-title text-3xl sm:text-4xl"
            style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
          >
            {(title ?? 'Популярні напрямки').toUpperCase()}
          </h2>
          <p className="mt-2 max-w-2xl" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
            {subtitle ?? 'Швидкий вхід у ключові категорії, щоб не шукати потрібний розділ вручну.'}
          </p>
        </div>
        <Link
          href="/catalog"
          className="sl-hover-accent hidden items-center gap-1 text-sm font-medium sm:inline-flex"
          style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
        >
          Весь каталог
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => {
          const Icon = getCategoryIcon(category);
          return (
            <Link
              key={category.id}
              href={`/catalog/${category.slug}`}
              className="sl-hover-card group rounded-2xl p-5"
              style={{
                background: 'var(--sl-bg-surface)',
                border: '1px solid var(--sl-border)',
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)' }}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h3
                  className="text-base font-semibold transition-colors"
                  style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
                >
                  {category.name}
                </h3>
                <p className="mt-2 text-sm leading-6" style={{ color: 'var(--sl-text-muted)' }}>
                  {getCategorySubcopy(category)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Promos ─────────────────────────────────────────────────────────── */
function PromoSection({
  promotions,
  eyebrow,
  title,
  subtitle,
}: {
  promotions: Promotion[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  const promoProducts = getPromoProducts(promotions).slice(0, 8);
  if (!promotions.length || !promoProducts.length) return null;

  return (
    <section className="reveal space-y-6" style={{ borderTop: '1px solid var(--sl-border)', paddingTop: '2.5rem' }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)', border: '1px solid var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
          >
            {eyebrow || 'Пропозиції тижня'}
          </div>
          <h2
            className="mt-3 text-3xl sm:text-4xl"
            style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
          >
            {(title || 'Ціни, які хочеться забрати зараз').toUpperCase()}
          </h2>
          <p className="mt-2 max-w-2xl" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
            {subtitle || 'Активні офери, знижки та моделі, які варто подивитися першими.'}
          </p>
        </div>
        <div
          className="rounded-2xl px-4 py-3 shrink-0"
          style={{ background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border-hover)' }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }}
          >
            До завершення акції
          </div>
          <div className="mt-2">
            <CountdownTimer endDate={promotions[0].endDate} />
          </div>
        </div>
      </div>
      <ProductCarousel products={promoProducts} />
    </section>
  );
}

/* ─── Merch strip ────────────────────────────────────────────────────── */
function MerchStrip({
  eyebrow, title, description, href, hrefLabel, products,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  href: string;
  hrefLabel: string;
  products: Product[];
}) {
  if (!products.length) return null;

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
          <p className="mt-2 max-w-2xl" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
            {description}
          </p>
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
      <ProductCarousel products={products} />
    </section>
  );
}

/* ─── Trust section ──────────────────────────────────────────────────── */
function TrustSection({
  eyebrow,
  title,
  subtitle,
  cards,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  cards?: { title: string; text: string }[];
}) {
  const defaultTrustCards = [
    {
      icon: PackageCheck,
      title: 'Живі товарні фото',
      text: 'Реальні фото допомагають оцінити стан і деталі до покупки.',
    },
    {
      icon: CheckCircle2,
      title: 'Чесні характеристики',
      text: 'Менше плутанини перед оплатою і простіше порівняти кілька варіантів.',
    },
    {
      icon: Truck,
      title: 'Зрозумілий шлях до покупки',
      text: 'Від вибору до кошика кілька зрозумілих кроків.',
    },
    {
      icon: ShieldCheck,
      title: 'Довіра ще до checkout',
      text: 'Гарантія, наявність і акційна логіка показані там, де їх очікують.',
    },
  ];
  const trustCards = (cards?.filter((item) => item.title?.trim() || item.text?.trim()) || defaultTrustCards).map((item, index) => ({
    ...item,
    icon: defaultTrustCards[index % defaultTrustCards.length].icon,
  }));

  return (
    <section
      className="reveal space-y-6"
      style={{ borderTop: '1px solid var(--sl-border)', paddingTop: '2.5rem' }}
    >
      <div className="max-w-2xl">
        <div
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
          style={{
            background: 'var(--sl-bg-elevated)',
            color: 'var(--sl-text-secondary)',
            border: '1px solid var(--sl-border)',
            fontFamily: 'var(--sl-font-mono)',
          }}
        >
          {eyebrow || 'Чому купують тут'}
        </div>
        <h2
          className="mt-3 text-3xl sm:text-4xl"
          style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
        >
          {(title || 'Чому з SmartLine спокійніше купувати').toUpperCase()}
        </h2>
        <p className="mt-2" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
          {subtitle || 'Коротко про речі, які важливі перед покупкою техніки.'}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {trustCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-2xl p-5"
              style={{
                background: 'var(--sl-bg-surface)',
                border: '1px solid var(--sl-border)',
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)' }}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3
                className="mt-5 text-base font-semibold"
                style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
              >
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6" style={{ color: 'var(--sl-text-muted)' }}>
                {item.text}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Reviews ────────────────────────────────────────────────────────── */
function ReviewsShowcase({
  reviews,
  eyebrow,
  title,
  subtitle,
  ratingLabel,
}: {
  reviews: Review[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  ratingLabel?: string;
}) {
  if (!reviews.length) return null;

  return (
    <section
      className="reveal space-y-6"
      style={{ borderTop: '1px solid var(--sl-border)', paddingTop: '2.5rem' }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: 'var(--sl-accent-muted)',
              color: 'var(--sl-accent)',
              border: '1px solid var(--sl-accent)',
              fontFamily: 'var(--sl-font-mono)',
            }}
          >
            {eyebrow || 'Відгуки'}
          </div>
          <h2
            className="mt-3 text-3xl sm:text-4xl"
            style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
          >
            {(title || 'Що кажуть покупці').toUpperCase()}
          </h2>
          <p className="mt-2 max-w-2xl" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
            {subtitle || 'Реальні враження допомагають швидше зрозуміти, чи підходить магазин і товар.'}
          </p>
        </div>
        <div
          className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
          style={{
            background: 'var(--sl-bg-elevated)',
            border: '1px solid var(--sl-border)',
            color: 'var(--sl-text-secondary)',
            fontFamily: 'var(--sl-font-mono)',
          }}
        >
          {ratingLabel || '★ 4.9 середня оцінка'}
        </div>
      </div>
      <ReviewCarousel reviews={reviews} />
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
/* ─── Dynamic section resolver ───────────────────────────────────────────── */

async function resolveCarouselProducts(cfg: any): Promise<Product[]> {
  const source = cfg.source ?? 'featured';
  if (source === 'featured') {
    const r = await getFeaturedProducts().catch(() => ({ data: [] as Product[] }));
    return (r as any).data ?? [];
  }
  if (source === 'latest') {
    const r = await getProducts({ limit: 8 }).catch(() => ({ data: [] as Product[] }));
    return (r as any).data ?? [];
  }
  if (source === 'category' && cfg.categorySlug) {
    const r = await getProducts({ categorySlug: cfg.categorySlug, limit: 8 }).catch(() => ({ data: [] as Product[] }));
    return (r as any).data ?? [];
  }
  if (source === 'manual' && cfg.productIds?.length) {
    // fetch all products then filter by IDs in order
    const r = await getProducts({ limit: 200 }).catch(() => ({ data: [] as Product[] }));
    const all: Product[] = (r as any).data ?? [];
    return cfg.productIds
      .map((id: string) => all.find((p) => p.id === id))
      .filter(Boolean) as Product[];
  }
  return [];
}

export default async function HomePage() {
  // Fetch sections config + shared data in parallel
  const [sections, banners, allCategories, featured, promotions, latest, reviews] = await Promise.all([
    getHomepageSections().catch(() => [] as HomepageSectionData[]),
    getBanners('home').catch(() => []),
    getCategories().catch(() => []),
    getFeaturedProducts().catch(() => ({ data: [] as Product[], total: 0, page: 1, limit: 8 })),
    getActivePromotions().catch(() => []),
    getProducts({ limit: 8 }).catch(() => ({ data: [] as Product[], total: 0, page: 1, limit: 8 })),
    getStoreReviews().catch(() => ({ data: [] as Review[], total: 0, page: 1, limit: 20 })),
  ]);

  // Resolve hero product
  const heroProductPool = [...(featured as any).data, ...(latest as any).data];
  const autoHeroProduct: Product | undefined =
    heroProductPool.find((p: Product) => hasRealProductImage(p)) ||
    (featured as any).data[0] ||
    (latest as any).data[0];

  // Resolve carousel products for each carousel section
  const carouselSections = sections.filter((s) => s.type === 'carousel');
  const carouselProductsMap = new Map<string, Product[]>();
  await Promise.all(
    carouselSections.map(async (s) => {
      const products = await resolveCarouselProducts(s.config);
      carouselProductsMap.set(s.id, products);
    }),
  );

  // Resolve hero product if specific productId set
  const heroSection = sections.find((s) => s.type === 'hero');
  let heroProduct: Product | undefined = autoHeroProduct;
  if (heroSection && !(heroSection.config as any).autoSelect && (heroSection.config as any).productId) {
    const all: Product[] = heroProductPool;
    heroProduct = all.find((p) => p.id === (heroSection.config as any).productId) ?? autoHeroProduct;
  }

  // Build category list for categories section
  const rootCategories = getRootCategories(allCategories);

  const renderSection = (s: HomepageSectionData) => {
    if (!s.isActive) return null;
    const cfg = s.config as any;

    switch (s.type) {
      case 'hero':
        return heroProduct ? (
          <HeroSpotlight
            key={s.id}
            product={heroProduct}
            title={cfg.title}
            subtitle={cfg.subtitle}
          />
        ) : null;

      case 'marquee':
        return <HomeMarquee key={s.id} items={cfg.items} />;

      case 'banners':
        return banners.length > 0 ? (
          <section key={s.id} className="reveal space-y-4">
            {(cfg.title || cfg.subtitle) && (
              <div>
                {cfg.title && (
                  <h2
                    className="text-3xl sm:text-4xl"
                    style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
                  >
                    {String(cfg.title).toUpperCase()}
                  </h2>
                )}
                {cfg.subtitle && (
                  <p className="mt-2 max-w-2xl" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}>
                    {cfg.subtitle}
                  </p>
                )}
              </div>
            )}
            <BannerSlider banners={banners} />
          </section>
        ) : null;

      case 'categories': {
        let cats: Category[];
        if (cfg.categoryIds?.length) {
          cats = cfg.categoryIds
            .map((id: string) => allCategories.find((c) => c.id === id))
            .filter(Boolean) as Category[];
        } else {
          cats = rootCategories.slice(0, 8);
        }
        return cats.length > 0 ? (
          <CategoryQuickGrid
            key={s.id}
            categories={cats.slice(0, 8)}
            title={cfg.title}
            subtitle={cfg.subtitle}
          />
        ) : null;
      }

      case 'carousel': {
        const products = carouselProductsMap.get(s.id) ?? [];
        return products.length > 0 ? (
          <MerchStrip
            key={s.id}
            eyebrow={cfg.eyebrow ?? ''}
            title={cfg.title ?? ''}
            description={cfg.subtitle ?? ''}
            href={cfg.href ?? '/catalog'}
            hrefLabel={cfg.hrefLabel ?? 'Дивитись усі'}
            products={products.slice(0, 8)}
          />
        ) : null;
      }

      case 'promo':
        return (
          <PromoSection
            key={s.id}
            promotions={promotions as Promotion[]}
            eyebrow={cfg.eyebrow}
            title={cfg.title}
            subtitle={cfg.subtitle}
          />
        );

      case 'reviews':
        return (
          <ReviewsShowcase
            key={s.id}
            reviews={(reviews as any).data.slice(0, 6)}
            eyebrow={cfg.eyebrow}
            title={cfg.title}
            subtitle={cfg.subtitle}
            ratingLabel={cfg.ratingLabel}
          />
        );

      case 'trust':
        return (
          <TrustSection
            key={s.id}
            eyebrow={cfg.eyebrow}
            title={cfg.title}
            subtitle={cfg.subtitle}
            cards={cfg.cards}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto flex max-w-7xl flex-col gap-14 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {sections.map(renderSection)}
      </div>
    </div>
  );
}
