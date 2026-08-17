import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatStripItem {
  label: string;
  value: string | number;
  /**
   * Marks a metric that is waiting on the operator. This is the only place the
   * strip spends colour — everything else stays neutral so the one number that
   * needs action is the one that reads first.
   */
  needsAction?: boolean;
  /**
   * Period-over-period change. `null`/`undefined` renders nothing — a dip is
   * not an application error, so the arrow only signals direction, never good/bad.
   */
  deltaPercent?: number | null;
}

/**
 * One instrument panel rather than a row of tinted tiles: a single bordered
 * surface with hairline rules between readings.
 */
export default function StatStrip({ items }: { items: StatStripItem[] }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:grid-cols-4 sm:divide-y-0">
      {items.map((item) => {
        const highlight = item.needsAction && Number(item.value) > 0;
        const hasDelta = item.deltaPercent !== undefined && item.deltaPercent !== null;
        return (
          <div key={item.label} className="px-5 py-4">
            <p className="text-xs font-medium text-gray-500">{item.label}</p>
            <p
              className={cn(
                'mt-1.5 text-2xl font-semibold tabular-nums',
                highlight ? 'text-blue-600' : 'text-gray-950',
              )}
            >
              {item.value}
            </p>
            {hasDelta && (
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-gray-500">
                {(item.deltaPercent as number) >= 0 ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {(item.deltaPercent as number) > 0 ? '+' : ''}
                {item.deltaPercent}%
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
