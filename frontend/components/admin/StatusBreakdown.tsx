import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/utils';
import { DashboardStatusBreakdownItem } from '@/types';

interface Props {
  items: DashboardStatusBreakdownItem[];
}

const SEGMENT_BG: Record<string, string> = {
  NEW: 'bg-blue-500',
  CONFIRMED: 'bg-amber-500',
  SHIPPED: 'bg-orange-500',
  DELIVERED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
};

export default function StatusBreakdown({ items }: Props) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return null;

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-500">Розподіл статусів</h2>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
        {items.map((item) => (
          <div
            key={item.status}
            className={SEGMENT_BG[item.status] ?? 'bg-gray-400'}
            style={{ width: `${(item.count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {items.map((item) => (
          <div key={item.status} className="flex items-center gap-2 text-sm">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${ORDER_STATUS_COLORS[item.status]}`}
            >
              {ORDER_STATUS_LABELS[item.status]}
            </span>
            <span className="font-semibold text-gray-950">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
