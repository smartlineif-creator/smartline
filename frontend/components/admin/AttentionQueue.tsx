import Link from 'next/link';
import { ArrowRight, ShoppingCart, Wrench, MessageSquareWarning, PackageX, Percent } from 'lucide-react';
import { DashboardAttention } from '@/types';

interface Props {
  attention: DashboardAttention;
}

export default function AttentionQueue({ attention }: Props) {
  const rows = [
    { key: 'newOrders', label: 'Нові замовлення', value: attention.newOrders, href: '/admin/orders', icon: ShoppingCart },
    { key: 'serviceRequests', label: 'Заявки на послуги', value: attention.serviceRequests, href: '/admin/requests', icon: Wrench },
    { key: 'pendingReviews', label: 'Відгуки на модерації', value: attention.pendingReviews, href: '/admin/reviews', icon: MessageSquareWarning },
    { key: 'outOfStock', label: 'Товари без залишку', value: attention.outOfStock, href: '/admin/products', icon: PackageX },
    { key: 'expiringPromotions', label: 'Акції, що завершуються', value: attention.expiringPromotions, href: '/admin/promotions', icon: Percent },
  ].filter((row) => row.value > 0);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-500">Потребує уваги</h2>
      {rows.length === 0 ? (
        <p className="py-2 text-sm text-gray-500">Все опрацьовано</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {rows.map(({ key, label, value, href, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              className="group flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <Icon className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600">{label}:</span>
              <span className="font-semibold text-gray-950">{value}</span>
              <ArrowRight className="h-3.5 w-3.5 text-gray-300 transition group-hover:text-blue-600" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
