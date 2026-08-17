import Link from 'next/link';
import { ArrowRight, Package, Wrench } from 'lucide-react';
import { DashboardTopItem } from '@/types';
import { formatPrice } from '@/lib/utils';

interface Props {
  items: DashboardTopItem[];
}

function hrefFor(item: DashboardTopItem): string {
  return item.kind === 'product' ? `/admin/products/${item.id}/edit` : `/admin/services/${item.id}`;
}

export default function TopItems({ items }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-500">Топ позицій</h2>
      {items.length === 0 ? (
        <p className="py-2 text-sm text-gray-500">Ще немає продажів за цей період</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const Icon = item.kind === 'product' ? Package : Wrench;
            return (
              <Link
                key={`${item.kind}-${item.id}`}
                href={hrefFor(item)}
                className="group flex items-center justify-between gap-3 py-2.5 text-sm transition hover:bg-gray-50"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate font-medium text-gray-900">{item.name}</span>
                  <span className="shrink-0 text-xs text-gray-400">× {item.quantity}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold text-gray-950">{formatPrice(item.revenue)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 transition group-hover:text-blue-600" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
