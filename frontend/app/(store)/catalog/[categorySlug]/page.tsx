import { cache, Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumbs from '@/components/store/Breadcrumbs';
import { getCategoryBySlug, getProducts } from '@/lib/api';
import ProductCard from '@/components/store/ProductCard';
import CatalogFilters from '@/components/store/CatalogFilters';
import CategoryTabs from '@/components/store/CategoryTabs';
import SortBar from '@/components/store/SortBar';
import MobileFilterDrawer from '@/components/store/MobileFilterDrawer';
import { Pagination } from '@/components/store/Pagination';
import {
  buildPageHref,
  firstParam,
  pageNumberFrom,
  parseOptionsParam,
  parsePriceParam,
} from '@/lib/utils';
import { SearchX } from 'lucide-react';

export const revalidate = 60;

const PAGE_SIZE = 24;
const DEFAULT_SORT = 'newest';

/** Repeated query params arrive as arrays — see `firstParam`. */
type SearchParams = Record<string, string | string[] | undefined>;

interface Props {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<SearchParams>;
}

/**
 * The sanitised view of the URL. Everything downstream — the API call, the
 * sidebar, the pagination links and the metadata — reads this instead of the
 * raw params, so junk input cannot reach the API and tracking params cannot
 * leak into internal links.
 */
function readParams(sp: SearchParams) {
  const sort = firstParam(sp.sort) || DEFAULT_SORT;
  const minPrice = parsePriceParam(sp.minPrice);
  const maxPrice = parsePriceParam(sp.maxPrice);
  const activeOptions = parseOptionsParam(sp.options);
  const hasOptions = Object.keys(activeOptions).length > 0;

  return {
    page: pageNumberFrom(sp.page),
    sort,
    minPrice,
    maxPrice,
    activeOptions,
    // Sorting reorders the catalogue into a different page-2, so it counts as
    // a facet for indexing purposes just like a price or option filter does.
    hasFilters: hasOptions || Boolean(minPrice) || Boolean(maxPrice) || sort !== DEFAULT_SORT,
    linkParams: {
      sort: sort !== DEFAULT_SORT ? sort : undefined,
      minPrice,
      maxPrice,
      options: hasOptions ? JSON.stringify(activeOptions) : undefined,
    },
  };
}

/**
 * The page body and `generateMetadata` both need this list — the latter only to
 * learn whether the requested page exists at all. `cache` keys on the primitive
 * arguments, so the two callers share one result instead of racing the fetch
 * layer's own deduplication.
 */
const loadProducts = cache(
  async (
    categorySlug: string,
    page: number,
    sortBy: string,
    minPrice: string | undefined,
    maxPrice: string | undefined,
    optionsJson: string | undefined,
  ) =>
    getProducts({
      categorySlug,
      page,
      limit: PAGE_SIZE,
      sortBy,
      ...(minPrice ? { minPrice: Number(minPrice) } : {}),
      ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
      ...(optionsJson ? { options: JSON.parse(optionsJson) as Record<string, string[]> } : {}),
    }).catch(() => ({
      data: [],
      total: 0,
      page: 1,
      limit: PAGE_SIZE,
      totalPages: 0,
      availableFilters: [],
      priceRange: null,
    })),
);

export async function generateMetadata({ params, searchParams }: Props) {
  const { categorySlug } = await params;
  const sp = await searchParams;
  try {
    const cat = await getCategoryBySlug(categorySlug);
    const { page, sort, minPrice, maxPrice, hasFilters, linkParams } = readParams(sp);

    // Shares the page body's result — metadata only needs the one thing it
    // cannot work out on its own: whether this page number exists at all.
    const { totalPages } = await loadProducts(
      categorySlug,
      page,
      sort,
      minPrice,
      maxPrice,
      linkParams.options,
    );

    const isOutOfRange = page > Math.max(totalPages ?? 0, 1);
    // A filtered URL is a near-duplicate of the clean category page, and a page
    // that does not exist is not a page at all — both point their canonical at
    // the bare category. Plain pagination stays indexable on its own, with
    // `?page=1` folded away so the first page keeps a single address.
    const canonical =
      hasFilters || isOutOfRange || page === 1
        ? `/catalog/${categorySlug}`
        : `/catalog/${categorySlug}?page=${page}`;
    const pageSuffix = page > 1 ? ` — сторінка ${page}` : '';
    const noindex = hasFilters || isOutOfRange;

    return {
      // `absolute` so the root layout's "%s — SmartLine" template doesn't
      // append a second "— SmartLine" onto a title that already has it.
      title: { absolute: `${cat.name}${pageSuffix} — купити в SmartLine` },
      // Description comes ONLY from the admin-entered SEO field — no hardcoded
      // or auto-generated text, so the admin form reflects the real state.
      description: cat.seoText?.trim().slice(0, 160) || undefined,
      alternates: { canonical },
      // `follow` stays on so the crawler still walks through to the products.
      ...(noindex ? { robots: { index: false, follow: true } } : {}),
    };
  } catch {
    return { title: 'Каталог' };
  }
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { categorySlug } = await params;
  const sp = await searchParams;

  let category;
  try {
    category = await getCategoryBySlug(categorySlug);
  } catch {
    notFound();
  }

  const { page, sort: sortBy, minPrice, maxPrice, activeOptions, linkParams } = readParams(sp);

  const products = await loadProducts(
    categorySlug,
    page,
    sortBy,
    minPrice,
    maxPrice,
    linkParams.options,
  );

  const activeOptionCount = Object.values(activeOptions).flat().length;

  // Paging carries the active filters forward — building the href from scratch
  // used to drop price and option filters on every page change.
  const basePath = `/catalog/${categorySlug}`;
  const pageHref = (target: number) => buildPageHref(basePath, linkParams, target);

  const totalPages = products.totalPages || 0;
  // A bookmarked or shared page can outlive the stock it was built on.
  const isOutOfRange = totalPages > 0 && page > totalPages;

  return (
    <div className="min-h-screen" style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumbs items={[{ label: 'Каталог', href: '/catalog' }, { label: category.name }]} />

        {/* Page header */}
        <div className="mb-6 flex items-start gap-4">
          <div
            className="mt-1 hidden h-8 w-1 shrink-0 rounded-full sm:block"
            style={{ background: 'var(--sl-accent)' }}
          />
          <h1
            className="text-2xl sm:text-3xl"
            style={{
              fontFamily: 'var(--sl-font-display)',
              color: 'var(--sl-text-primary)',
              letterSpacing: '0.04em',
              lineHeight: 1.1,
            }}
          >
            {category.name.toUpperCase()}
          </h1>
        </div>

        {/* Subcategory tabs */}
        {category.children && category.children.length > 0 && (
          <div className="mb-5">
            <CategoryTabs
              categories={category.children}
              basePath="/catalog"
              allLabel="Всі"
              allHref={`/catalog/${categorySlug}`}
            />
          </div>
        )}

        <div className="flex gap-6">
          {/* Filters sidebar — desktop only */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <Suspense>
              <CatalogFilters
                currentSort={sortBy}
                availableFilters={products.availableFilters}
                activeOptions={activeOptions}
                currentMinPrice={minPrice}
                currentMaxPrice={maxPrice}
                priceRange={products.priceRange}
              />
            </Suspense>
          </aside>

          {/* Products grid */}
          <div className="flex-1 min-w-0">
            {/* Mobile: filter button, then full-width sort bar */}
            <div className="mb-4 flex flex-col gap-2 lg:hidden">
              <Suspense>
                <MobileFilterDrawer
                  currentSort={sortBy}
                  availableFilters={products.availableFilters}
                  activeOptions={activeOptions}
                  currentMinPrice={minPrice}
                  currentMaxPrice={maxPrice}
                  total={products.total}
                  priceRange={products.priceRange}
                />
              </Suspense>
              <SortBar total={products.total} />
            </div>

            {/* Desktop: sort bar */}
            <div className="mb-4 hidden lg:block">
              <SortBar total={products.total} />
            </div>

            {/* Active filter chips */}
            {activeOptionCount > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {Object.entries(activeOptions).flatMap(([groupName, values]) =>
                  values.map((val) => (
                    <span
                      key={`${groupName}:${val}`}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs"
                      style={{
                        background: 'var(--sl-accent-muted)',
                        border: '1px solid var(--sl-accent)',
                        color: 'var(--sl-accent)',
                        fontFamily: 'var(--sl-font-mono)',
                      }}
                    >
                      <span style={{ color: 'var(--sl-text-muted)', marginRight: 2 }}>{groupName}:</span>
                      {val}
                    </span>
                  ))
                )}
              </div>
            )}

            {products.data.length === 0 ? (
              /* 1.3 — Empty state with CTA */
              <div
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div
                  className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
                >
                  <SearchX className="h-6 w-6" style={{ color: 'var(--sl-text-muted)' }} />
                </div>
                <p
                  className="mb-1 text-base font-semibold"
                  style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-body)' }}
                >
                  {isOutOfRange ? `Сторінки ${page} не існує` : 'Нічого не знайдено'}
                </p>
                <p
                  className="mb-5 text-sm"
                  style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}
                >
                  {isOutOfRange
                    ? 'Поверніться на першу сторінку — фільтри збережуться'
                    : 'Спробуйте змінити або скинути фільтри'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {isOutOfRange && (
                    <Link
                      href={pageHref(1)}
                      className="rounded-xl px-5 py-2 text-sm font-semibold transition-all"
                      style={{
                        background: 'var(--sl-accent)',
                        color: 'var(--sl-text-on-accent)',
                        fontFamily: 'var(--sl-font-mono)',
                      }}
                    >
                      На першу сторінку
                    </Link>
                  )}
                  <Link
                    href={`/catalog/${categorySlug}`}
                    className="rounded-xl px-5 py-2 text-sm font-semibold transition-all"
                    style={
                      isOutOfRange
                        ? {
                            background: 'var(--sl-bg-elevated)',
                            border: '1px solid var(--sl-border)',
                            color: 'var(--sl-text-secondary)',
                            fontFamily: 'var(--sl-font-mono)',
                          }
                        : {
                            background: 'var(--sl-accent)',
                            color: 'var(--sl-text-on-accent)',
                            fontFamily: 'var(--sl-font-mono)',
                          }
                    }
                  >
                    Скинути всі фільтри
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {products.data.flatMap((product) => {
                  const variants = product.variants ?? [];
                  const hasOptions = variants.some((v) => v.selections && v.selections.length > 0);

                  if (!hasOptions || variants.length <= 1) {
                    return [<ProductCard key={product.id} product={product} selectedVariant={variants[0]} />];
                  }

                  // When option filters are active — show only matching variants
                  const variantGroupNames = new Set(
                    variants.flatMap((v) => v.selections?.map((s) => s.optionValue.group.name) ?? [])
                  );
                  const optionEntries = Object.entries(activeOptions).filter(
                    ([groupName, vals]) => vals.length > 0 && variantGroupNames.has(groupName),
                  );
                  const visibleVariants = optionEntries.length > 0
                    ? variants.filter((v) =>
                        optionEntries.every(([groupName, values]) =>
                          v.selections?.some(
                            (s) =>
                              s.optionValue.group.name === groupName &&
                              values.includes(s.optionValue.value),
                          ),
                        ),
                      )
                    : variants;

                  if (visibleVariants.length === 0) return [];

                  return visibleVariants.map((variant) => (
                    <ProductCard
                      key={`${product.id}-${variant.id}`}
                      product={product}
                      selectedVariant={variant}
                    />
                  ));
                })}
              </div>
            )}

            {/* Outside the branch above: an out-of-range page renders the empty
                state, and that is exactly when paging back is needed most. */}
            <Pagination page={page} totalPages={totalPages} basePath={basePath} params={linkParams} />
          </div>
        </div>

        {/* SEO text */}
        {category.seoText && (
          <div
            className="prose prose-sm mt-12 max-w-none"
            style={{ color: 'var(--sl-text-muted)' }}
            dangerouslySetInnerHTML={{ __html: category.seoText }}
          />
        )}
      </div>
    </div>
  );
}
