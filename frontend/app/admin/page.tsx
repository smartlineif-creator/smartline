import { adminGetOrderStats, adminGetProductCount, adminGetAllOrders } from '@/lib/api';
import { formatPrice, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/utils';
import AdminPageHint from '@/components/admin/AdminPageHint';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [stats, productCount, recentOrders] = await Promise.all([
    adminGetOrderStats().catch(() => ({ todayOrders: 0, newOrders: 0, todayRevenue: 0 })),
    adminGetProductCount().catch(() => ({ count: 0 })),
    adminGetAllOrders({ limit: '10', page: '1' }).catch(() => ({ data: [], total: 0, page: 1, limit: 10 })),
  ]);

  const cards = [
    { label: 'Замовлень сьогодні', value: stats.todayOrders, color: 'bg-blue-50 text-blue-700' },
    { label: 'Нових замовлень', value: stats.newOrders, color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Виручка сьогодні', value: formatPrice(stats.todayRevenue), color: 'bg-green-50 text-green-700' },
    { label: 'Всього товарів', value: productCount.count, color: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <div>
      <AdminPageHint
        storageKey="dashboard"
        tips={[
          { text: 'Тут зведені ключові метрики: замовлення сьогодні, нові замовлення, виручка і загальна кількість товарів.' },
          { text: 'Таблиця внизу показує останні 10 замовлень. Клікніть на рядок, щоб відкрити деталі.' },
          { text: 'Для детальнішої роботи переходьте у відповідні розділи через меню зліва.' },
          { text: 'Довідка по всіх розділах — у пункті меню "Довідка" внизу зліва.' },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6">Дашборд</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={`${card.color} rounded-xl p-4`}>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-sm mt-1 opacity-70">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Останні замовлення</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Покупець', 'Сума', 'Статус', 'Дата'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentOrders.data.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Замовлень ще немає</td></tr>
              ) : recentOrders.data.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">#{order.orderNumber}</td>
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(order.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString('uk-UA')}
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
