import Link from 'next/link';
import {
  LayoutGrid,
  Smartphone,
  Laptop,
  Headphones,
  Gamepad2,
  Tablet,
  Tv,
  Camera,
  Package,
  type LucideIcon,
} from 'lucide-react';
import { Category } from '@/types';

const ICON_MAP: Record<string, LucideIcon> = {
  смартфони: Smartphone,
  ноутбуки: Laptop,
  аудіо: Headphones,
  'ігрові консолі': Gamepad2,
  планшети: Tablet,
  телевізори: Tv,
  'фото та відео': Camera,
  аксесуари: Package,
};

/** Returns an icon only for known top-level categories; undefined otherwise */
function getCategoryIcon(name: string): LucideIcon | undefined {
  return ICON_MAP[name.toLowerCase()];
}

interface Props {
  categories: Category[];
  /** The slug of the currently active category. Undefined = "All" is active */
  activeSlug?: string;
  /** Prefix for category links, e.g. "/catalog" */
  basePath?: string;
  /** Label + href for the "all" chip */
  allLabel?: string;
  allHref?: string;
}

export default function CategoryTabs({
  categories,
  activeSlug,
  basePath = '/catalog',
  allLabel = 'Всі товари',
  allHref,
}: Props) {
  const resolvedAllHref = allHref ?? basePath;
  const allActive = !activeSlug;

  return (
    <nav
      aria-label="Категорії"
      className="relative"
    >
      {/* Fade-out gradient on the right for scroll hint */}
      <div
        className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12"
        style={{
          background: 'linear-gradient(to right, transparent, var(--sl-bg-primary))',
        }}
      />
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* "All" chip */}
        <Link
          href={resolvedAllHref}
          aria-current={allActive ? 'page' : undefined}
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200"
          style={
            allActive
              ? { background: 'var(--sl-accent)', color: '#fff' }
              : { background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)', color: 'var(--sl-text-secondary)' }
          }
        >
          <LayoutGrid className="h-3.5 w-3.5 shrink-0" style={{ opacity: allActive ? 1 : 0.55 }} />
          {allLabel}
        </Link>

        {categories.map((cat) => {
          const isActive = cat.slug === activeSlug;
          const Icon = getCategoryIcon(cat.name);

          return (
            <Link
              key={cat.id}
              href={`${basePath}/${cat.slug}`}
              aria-current={isActive ? 'page' : undefined}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
              style={
                isActive
                  ? { background: 'var(--sl-accent)', color: '#fff', fontWeight: 600 }
                  : { background: 'var(--sl-bg-surface)', border: '1px solid var(--sl-border)', color: 'var(--sl-text-secondary)' }
              }
            >
              {Icon && (
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ opacity: isActive ? 1 : 0.55 }} />
              )}
              {cat.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
