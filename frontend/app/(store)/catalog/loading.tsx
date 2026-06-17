export default function CatalogLoading() {
  return (
    <div
      className="min-h-screen animate-pulse"
      style={{ background: 'var(--sl-bg-primary)' }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6 h-3 w-40 rounded-full" style={{ background: 'var(--sl-bg-elevated)' }} />

        {/* Title */}
        <div className="mb-6 flex items-start gap-4">
          <div className="h-9 w-1 rounded-full" style={{ background: 'var(--sl-bg-elevated)' }} />
          <div className="h-9 w-56 rounded-xl" style={{ background: 'var(--sl-bg-elevated)' }} />
        </div>

        {/* Category tabs */}
        <div className="mb-5 flex gap-2">
          {[80, 110, 90, 100, 85, 120].map((w, i) => (
            <div key={i} className="h-9 shrink-0 rounded-xl" style={{ width: w, background: 'var(--sl-bg-elevated)' }} />
          ))}
        </div>

        {/* Sort bar */}
        <div className="mb-6 h-12 rounded-2xl" style={{ background: 'var(--sl-bg-surface)' }} />

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="hidden w-56 shrink-0 space-y-2 lg:block">
            {[160, 200, 180, 140].map((h, i) => (
              <div key={i} className="rounded-xl" style={{ height: h, background: 'var(--sl-bg-surface)' }} />
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl" style={{ background: 'var(--sl-bg-surface)' }}>
                <div className="aspect-square" style={{ background: 'var(--sl-bg-elevated)' }} />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-full rounded-full" style={{ background: 'var(--sl-bg-elevated)' }} />
                  <div className="h-3 w-2/3 rounded-full" style={{ background: 'var(--sl-bg-elevated)' }} />
                  <div className="mt-3 h-5 w-1/2 rounded-full" style={{ background: 'var(--sl-bg-elevated)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
