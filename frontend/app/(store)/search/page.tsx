import Link from 'next/link';
import Breadcrumbs from '@/components/store/Breadcrumbs';
import { SearchX } from 'lucide-react';
import { getProducts } from '@/lib/api';
import { firstParam, pageNumberFrom, pluralUk } from '@/lib/utils';
import ProductCard from '@/components/store/ProductCard';
import { Pagination } from '@/components/store/Pagination';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: Props) {
  const q = firstParam((await searchParams).q);
  return { title: q ? `Пошук: "${q}"` : 'Пошук' };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = firstParam(sp.q);
  const page = pageNumberFrom(sp.page);

  const results = q && q.trim().length >= 2
    ? await getProducts({ q, page, limit: 24 }).catch(() => ({ data: [], total: 0, page: 1, limit: 24, totalPages: 0 }))
    : { data: [], total: 0, page: 1, limit: 24, totalPages: 0 };

  const totalPages = results.totalPages || 0;
  const isOutOfRange = totalPages > 0 && page > totalPages;

  return (
    <div className="min-h-screen" style={{ background: 'var(--sl-bg-primary)' }}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Breadcrumbs items={[{ label: 'Пошук' }]} />

        <h1
          className="mb-2 text-3xl sm:text-4xl"
          style={{ fontFamily: 'var(--sl-font-display)', color: 'var(--sl-text-primary)', letterSpacing: '0.04em' }}
        >
          {q ? `РЕЗУЛЬТАТИ ДЛЯ "${q.toUpperCase()}"` : 'ПОШУК'}
        </h1>
        <p className="mb-8 text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
          {results.total} {pluralUk(results.total, 'товар', 'товари', 'товарів')}
        </p>

        {results.data.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {results.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)' }}
            >
              <SearchX className="h-7 w-7" style={{ color: 'var(--sl-text-muted)' }} />
            </div>
            <p
              className="mb-2 text-base font-medium"
              style={{ color: 'var(--sl-text-primary)', fontFamily: 'var(--sl-font-mono)' }}
            >
              {isOutOfRange
                ? `Сторінки ${page} не існує`
                : q
                  ? 'Нічого не знайдено'
                  : 'Введіть запит для пошуку'}
            </p>
            <p className="mb-6 text-sm" style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}>
              {isOutOfRange
                ? 'Поверніться на першу сторінку результатів'
                : q
                  ? `За запитом "${q}" товарів не знайдено`
                  : 'Мінімум 2 символи'}
            </p>
            <Link
              href={isOutOfRange && q ? `/search?q=${encodeURIComponent(q)}` : '/catalog'}
              className="inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold"
              style={{ background: 'var(--sl-accent)', color: 'var(--sl-text-on-accent)', fontFamily: 'var(--sl-font-mono)' }}
            >
              {isOutOfRange ? 'До перших результатів' : 'Перейти до каталогу'}
            </Link>
          </div>
        )}

        {/* Outside the branch above, so an out-of-range page still offers a way back. */}
        <Pagination
          page={page}
          totalPages={totalPages}
          basePath="/search"
          params={{ q: q?.trim() || undefined }}
        />
      </div>
    </div>
  );
}
