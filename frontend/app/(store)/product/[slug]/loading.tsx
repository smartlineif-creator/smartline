export default function ProductLoading() {
  return (
    <div
      className="min-h-screen animate-pulse"
      style={{ background: 'var(--sl-bg-primary)' }}
    >
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumbs */}
        <div className="mb-6 h-3 w-56 rounded-full" style={{ background: 'var(--sl-bg-elevated)' }} />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_380px] lg:grid-cols-[1fr_420px]">
          {/* Left: images */}
          <div className="flex gap-3">
            {/* Thumbnails */}
            <div className="hidden flex-col gap-2 sm:flex">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 w-16 rounded-xl" style={{ background: 'var(--sl-bg-surface)' }} />
              ))}
            </div>
            {/* Main image */}
            <div className="flex-1 aspect-square rounded-2xl" style={{ background: 'var(--sl-bg-surface)' }} />
          </div>

          {/* Right: buy panel */}
          <div className="space-y-4">
            <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--sl-bg-surface)' }}>
              <div className="h-4 w-20 rounded-full" style={{ background: 'var(--sl-bg-elevated)' }} />
              <div className="h-7 w-full rounded-xl" style={{ background: 'var(--sl-bg-elevated)' }} />
              <div className="h-7 w-3/4 rounded-xl" style={{ background: 'var(--sl-bg-elevated)' }} />
              <div className="h-8 w-32 rounded-full" style={{ background: 'var(--sl-bg-elevated)' }} />
              <div className="h-12 w-full rounded-xl" style={{ background: 'var(--sl-bg-elevated)' }} />
              <div className="h-12 w-full rounded-xl" style={{ background: 'var(--sl-bg-elevated)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
