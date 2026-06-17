import Link from 'next/link';
import { getCategories, getProducts } from '@/lib/api';
import ProductCard from '@/components/store/ProductCard';
import CategoryTabs from '@/components/store/CategoryTabs';
import SortBar from '@/components/store/SortBar';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Каталог товарів — SmartLine',
  description: 'Всі товари інтернет-магазину SmartLine: смартфони, ноутбуки, аксесуари.',
};

interface Props {
  searchParams: Promise<Record<string, string>>;
}

export default async function CatalogIndexPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const sortBy = sp.sort || 'newest';

  const [categories, products] = await Promise.all([
    getCategories().catch(() => []),
    getProducts({ page, limit: 24, sortBy }).catch(() => ({
      data: [], total: 0, page: 1, limit: 24, totalPages: 0,
    })),
  ]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* Breadcrumbs */}
        <nav
          className="mb-6 flex items-center gap-1.5 text-xs font-medium"
          style={{ fontFamily: 'var(--sl-font-mono)', color: 'var(--sl-text-muted)' }}
          aria-label="Навігація"
        >
          <Link href="/" className="sl-hover-accent transition-colors">Головна</Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ color: 'var(--sl-text-secondary)' }}>Каталог</span>
        </nav>

        {/* Page header */}
        <div className="mb-7 flex items-start gap-4">
          {/* Accent bar */}
          <div
            className="mt-1 hidden h-10 w-1 shrink-0 rounded-full sm:block"
            style={{ background: 'var(--sl-accent)' }}
          />
          <div className="flex flex-col gap-1.5">
            <h1
              className="text-3xl sm:text-4xl"
              style={{
                fontFamily: 'var(--sl-font-display)',
                color: 'var(--sl-text-primary)',
                letterSpacing: '0.04em',
                lineHeight: 1.1,
              }}
            >
              КАТАЛОГ ТОВАРІВ
            </h1>
            <p
              className="max-w-xl text-sm leading-relaxed"
              style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-body)' }}
            >
              Смартфони, ноутбуки та аксесуари з актуальними цінами і швидкою доставкою по Україні.
            </p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="mb-5">
          <CategoryTabs
            categories={categories}
            basePath="/catalog"
            allLabel="Всі товари"
            allHref="/catalog"
          />
        </div>

        {/* Sort + count bar */}
        <div className="mb-6">
          <SortBar
            total={products.total}
            currentSort={sortBy}
            baseHref="/catalog"
            sep="?"
          />
        </div>

        {/* Products grid */}
        {products.data.length === 0 ? (
          <div
            className="py-16 text-center text-sm"
            style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
          >
            Товарів не знайдено.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {(products.totalPages || 1) > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/catalog?sort=${sortBy}&page=${page - 1}`}
                    className="rounded-lg px-3 py-2 text-sm transition-all"
                    style={{
                      background: 'var(--sl-bg-elevated)',
                      border: '1px solid var(--sl-border)',
                      color: 'var(--sl-text-secondary)',
                      fontFamily: 'var(--sl-font-mono)',
                    }}
                  >
                    ←
                  </Link>
                )}
                {Array.from({ length: products.totalPages || 1 }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/catalog?sort=${sortBy}&page=${p}`}
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
                {page < (products.totalPages || 1) && (
                  <Link
                    href={`/catalog?sort=${sortBy}&page=${page + 1}`}
                    className="rounded-lg px-3 py-2 text-sm transition-all"
                    style={{
                      background: 'var(--sl-bg-elevated)',
                      border: '1px solid var(--sl-border)',
                      color: 'var(--sl-text-secondary)',
                      fontFamily: 'var(--sl-font-mono)',
                    }}
                  >
                    →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
