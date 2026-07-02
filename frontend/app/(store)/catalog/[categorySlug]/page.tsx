import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCategoryBySlug, getProducts } from '@/lib/api';
import ProductCard from '@/components/store/ProductCard';
import CatalogFilters from '@/components/store/CatalogFilters';
import CategoryTabs from '@/components/store/CategoryTabs';
import SortBar from '@/components/store/SortBar';
import MobileFilterDrawer from '@/components/store/MobileFilterDrawer';
import { SearchX } from 'lucide-react';

export const revalidate = 60;

interface Props {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<Record<string, string>>;
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  try {
    const cat = await getCategoryBySlug(categorySlug);
    return { title: `${cat.name} — купити в SmartLine`, description: cat.seoText?.slice(0, 160) };
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

  const page = Number(sp.page) || 1;
  const sortBy = sp.sort || 'newest';
  const minPrice = sp.minPrice;
  const maxPrice = sp.maxPrice;

  // Parse option filters from URL
  let activeOptions: Record<string, string[]> = {};
  if (sp.options) {
    try {
      const parsed = JSON.parse(sp.options);
      if (parsed && typeof parsed === 'object') {
        activeOptions = parsed;
      }
    } catch { /* ignore */ }
  }

  const products = await getProducts({
    categorySlug,
    page,
    limit: 24,
    sortBy,
    ...(minPrice ? { minPrice: Number(minPrice) } : {}),
    ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
    ...(Object.keys(activeOptions).length > 0 ? { options: activeOptions } : {}),
  }).catch(() => ({ data: [], total: 0, page: 1, limit: 24, totalPages: 0, availableFilters: [] }));

  const activeOptionCount = Object.values(activeOptions).flat().length;

  return (
    <div className="min-h-screen" style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumbs */}
        <nav
          className="mb-6 flex items-center gap-1.5 text-xs font-medium"
          style={{ fontFamily: 'var(--sl-font-mono)', color: 'var(--sl-text-muted)' }}
          aria-label="Навігація"
        >
          <Link href="/" className="sl-hover-accent transition-colors">Головна</Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <Link href="/catalog" className="sl-hover-accent transition-colors">Каталог</Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ color: 'var(--sl-text-secondary)' }}>{category.name}</span>
        </nav>

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
              />
            </Suspense>
          </aside>

          {/* Products grid */}
          <div className="flex-1 min-w-0">
            {/* Mobile: filter button + sort bar */}
            <div className="mb-4 flex items-center gap-2 lg:hidden">
              <Suspense>
                <MobileFilterDrawer
                  currentSort={sortBy}
                  availableFilters={products.availableFilters}
                  activeOptions={activeOptions}
                  currentMinPrice={minPrice}
                  currentMaxPrice={maxPrice}
                />
              </Suspense>
              <div className="flex-1">
                <SortBar
                  total={products.total}
                  currentSort={sortBy}
                  baseHref={`/catalog/${categorySlug}`}
                  sep="?"
                />
              </div>
            </div>

            {/* Desktop: sort bar */}
            <div className="mb-4 hidden lg:block">
              <SortBar
                total={products.total}
                currentSort={sortBy}
                baseHref={`/catalog/${categorySlug}`}
                sep="?"
              />
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
                  Нічого не знайдено
                </p>
                <p
                  className="mb-5 text-sm"
                  style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}
                >
                  Спробуйте змінити або скинути фільтри
                </p>
                <Link
                  href={`/catalog/${categorySlug}`}
                  className="rounded-xl px-5 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: 'var(--sl-accent)',
                    color: 'var(--sl-text-on-accent)',
                    fontFamily: 'var(--sl-font-mono)',
                  }}
                >
                  Скинути всі фільтри
                </Link>
              </div>
            ) : (
              <>
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

                {/* Pagination */}
                {(products.totalPages || 1) > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    {Array.from({ length: products.totalPages || 1 }, (_, i) => i + 1).map((p) => (
                      <Link
                        key={p}
                        href={`/catalog/${categorySlug}?page=${p}&sort=${sortBy}`}
                        className="rounded-lg px-3 py-2 text-sm transition-all"
                        style={
                          p === page
                            ? { background: 'var(--sl-accent)', color: '#fff', border: '1px solid var(--sl-accent)', fontFamily: 'var(--sl-font-mono)' }
                            : { background: 'var(--sl-bg-elevated)', border: '1px solid var(--sl-border)', color: 'var(--sl-text-secondary)', fontFamily: 'var(--sl-font-mono)' }
                        }
                      >
                        {p}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
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
