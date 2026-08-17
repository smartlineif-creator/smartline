interface Props {
  ratings: number[];
  count?: number;
  size?: 'sm' | 'md';
}

/** Compact star rating row — shared by product and service cards. */
export default function Rating({ ratings, count, size = 'sm' }: Props) {
  if (!ratings || ratings.length === 0 || count === 0) return null;

  const avg = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  const rounded = Math.round(avg * 2) / 2; // nearest 0.5
  const dim = size === 'md' ? 14 : 11;

  return (
    <div className="mt-1 flex items-center gap-1">
      <div className="flex items-center gap-0.5" aria-label={`Рейтинг ${avg.toFixed(1)} з 5`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.floor(rounded);
          const half = !filled && star - 0.5 === rounded;
          return (
            <svg key={star} width={dim} height={dim} viewBox="0 0 12 12" fill="none">
              {half ? (
                <>
                  <defs>
                    <linearGradient id={`h-${size}-${star}`} x1="0" x2="1" y1="0" y2="0">
                      <stop offset="50%" stopColor="var(--sl-status-warning)" />
                      <stop offset="50%" stopColor="var(--sl-bg-elevated)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M6 1l1.3 2.6 2.9.4-2.1 2 .5 2.9L6 7.4 3.4 8.9l.5-2.9-2.1-2 2.9-.4L6 1z"
                    fill={`url(#h-${size}-${star})`}
                    stroke="var(--sl-status-warning)"
                    strokeWidth="0.5"
                  />
                </>
              ) : (
                <path
                  d="M6 1l1.3 2.6 2.9.4-2.1 2 .5 2.9L6 7.4 3.4 8.9l.5-2.9-2.1-2 2.9-.4L6 1z"
                  fill={filled ? 'var(--sl-status-warning)' : 'var(--sl-bg-elevated)'}
                  stroke={filled ? 'var(--sl-status-warning)' : 'var(--sl-border-hover)'}
                  strokeWidth="0.5"
                />
              )}
            </svg>
          );
        })}
      </div>
      <span
        className="text-[10px] leading-none"
        style={{ color: 'var(--sl-text-muted)', fontFamily: 'var(--sl-font-mono)' }}
      >
        {avg.toFixed(1)} ({count ?? ratings.length})
      </span>
    </div>
  );
}
