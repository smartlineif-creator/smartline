import Link from 'next/link';

export interface Crumb {
  label: string;
  /** Omit on the current page — it renders as plain text, not a link. */
  href?: string;
}

/**
 * The single breadcrumb treatment for the storefront. Every page used to roll its
 * own, which left three different font sizes (11/12/14px) on adjacent pages.
 * «Головна» is prepended here so no caller can forget or restyle it.
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ label: 'Головна', href: '/' }, ...items];

  return (
    <nav
      aria-label="Навігація"
      className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-medium"
      style={{ fontFamily: 'var(--sl-font-mono)', color: 'var(--sl-text-muted)' }}
    >
      {trail.map((crumb, i) => {
        const isLast = i === trail.length - 1;
        return (
          <span key={`${crumb.label}-${i}`} className="flex items-center gap-x-1.5">
            {i > 0 && <span style={{ color: 'var(--sl-border-hover)' }}>/</span>}
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className="sl-hover-accent transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="line-clamp-1" style={{ color: 'var(--sl-text-secondary)' }}>
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
