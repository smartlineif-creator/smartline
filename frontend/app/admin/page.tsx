import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { adminGetDashboardAttention, adminGetDashboardStats, adminGetAllOrders } from '@/lib/api';
import { formatPrice, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/utils';
import { DashboardStats } from '@/types';
import AdminPageHint from '@/components/admin/AdminPageHint';
import StatStrip from '@/components/admin/StatStrip';
import PeriodTabs from '@/components/admin/PeriodTabs';
import AttentionQueue from '@/components/admin/AttentionQueue';
import StatusBreakdown from '@/components/admin/StatusBreakdown';
import RevenueChart from '@/components/admin/RevenueChart';
import TopItems from '@/components/admin/TopItems';

export const dynamic = 'force-dynamic';

const EMPTY_STATS: DashboardStats = {
  period: '7d',
  bucket: 'day',
  metrics: {
    orders: { value: 0, deltaPercent: null },
    revenue: { value: 0, deltaPercent: null },
    avgOrder: { value: 0, deltaPercent: null },
    products: { value: 0, deltaPercent: null },
  },
  statusBreakdown: [],
  revenueSeries: [],
  topItems: [],
};

interface Props {
  searchParams: Promise<Record<string, string>>;
}

export default async function AdminDashboardPage({ searchParams }: Props) {
  const sp = await searchParams;
  const period = sp.period || '7d';

  const [attention, stats, recentOrders] = await Promise.all([
    adminGetDashboardAttention().catch(() => ({
      newOrders: 0, serviceRequests: 0, pendingReviews: 0, outOfStock: 0, expiringPromotions: 0,
    })),
    adminGetDashboardStats(period).catch(() => EMPTY_STATS),
    adminGetAllOrders({ limit: '10', page: '1' }).catch(() => ({ data: [], total: 0, page: 1, limit: 10 })),
  ]);

  const cards = [
    { label: 'Замовлень', value: stats.metrics.orders.value, deltaPercent: stats.metrics.orders.deltaPercent },
    { label: 'Виручка', value: formatPrice(stats.metrics.revenue.value), deltaPercent: stats.metrics.revenue.deltaPercent },
    { label: 'Середній чек', value: formatPrice(stats.metrics.avgOrder.value), deltaPercent: stats.metrics.avgOrder.deltaPercent },
    { label: 'Товарів у каталозі', value: stats.metrics.products.value },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHint
        storageKey="dashboard"
        tips={[
          { text: 'Блок "Потребує уваги" зверху — список того, що чекає на дію: нові замовлення, заявки, відгуки на модерації тощо.' },
          { text: 'Перемикайте період вгорі, щоб побачити метрики, розподіл статусів, динаміку виручки й топ позицій за різні вікна.' },
          { text: 'Дельта біля метрики порівнює обраний період із попереднім таким же вікном.' },
          { text: 'Таблиця внизу показує останні 10 замовлень незалежно від обраного періоду.' },
        ]}
      />
      <h1 className="text-2xl font-bold">Дашборд</h1>

      <AttentionQueue attention={attention} />

      <PeriodTabs current={stats.period} />

      <StatStrip items={cards} />

      <StatusBreakdown items={stats.statusBreakdown} />

      <RevenueChart data={stats.revenueSeries} />

      <TopItems items={stats.topItems} />

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="font-semibold">Останні замовлення</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Покупець', 'Сума', 'Статус', 'Дата', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentOrders.data.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Замовлень ще немає</td></tr>
              ) : recentOrders.data.map((order) => (
                /* The page is a Server Component, so the row cannot take an onClick.
                   Padding lives on each Link instead of the cell so the clickable
                   area actually fills the row — otherwise the pointer cursor would
                   promise a click that the cell gutters do not deliver. */
                <tr key={order.id} className="group cursor-pointer hover:bg-gray-50">
                  <td className="h-px font-mono">
                    <Link href={`/admin/orders/${order.id}`} className="flex h-full items-center px-4 py-3">#{order.orderNumber}</Link>
                  </td>
                  <td className="h-px">
                    <Link href={`/admin/orders/${order.id}`} className="flex h-full items-center px-4 py-3">{order.customerName}</Link>
                  </td>
                  <td className="h-px font-medium">
                    <Link href={`/admin/orders/${order.id}`} className="flex h-full items-center px-4 py-3">{formatPrice(order.totalAmount)}</Link>
                  </td>
                  <td className="h-px">
                    <Link href={`/admin/orders/${order.id}`} className="flex h-full items-center px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </Link>
                  </td>
                  <td className="h-px text-muted-foreground">
                    <Link href={`/admin/orders/${order.id}`} className="flex h-full items-center px-4 py-3">
                      {new Date(order.createdAt).toLocaleDateString('uk-UA')}
                    </Link>
                  </td>
                  <td className="h-px">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex h-full items-center justify-end gap-1 whitespace-nowrap px-4 py-3 text-xs text-gray-400 transition-colors group-hover:text-blue-600 hover:text-blue-600"
                    >
                      Відкрити
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
