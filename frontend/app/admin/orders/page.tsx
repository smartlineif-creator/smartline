'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, Package, Search } from 'lucide-react';
import { adminGetAllOrders } from '@/lib/api';
import { Order, OrderStatus } from '@/types';
import { formatPrice, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, pluralUk } from '@/lib/utils';
import { MultiSelect } from '@/components/ui/multi-select';
import SortableTh from '@/components/admin/SortableTh';
import { useTableSort, compareText, compareNumber, compareDate, type SortComparators } from '@/lib/useTableSort';
import AdminPageHint from '@/components/admin/AdminPageHint';
import StatStrip from '@/components/admin/StatStrip';

const STATUSES: OrderStatus[] = ['NEW', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getItemsCount(order: Order) {
  return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
}

type OrderSortColumn = 'number' | 'customer' | 'items' | 'total' | 'status' | 'date';

const ORDER_COMPARATORS: SortComparators<OrderSortColumn, Order> = {
  number: (a, b) => compareNumber(a.orderNumber, b.orderNumber),
  customer: (a, b) => compareText(a.customerName, b.customerName),
  items: (a, b) => compareNumber(getItemsCount(a), getItemsCount(b)),
  total: (a, b) => compareNumber(Number(a.totalAmount), Number(b.totalAmount)),
  status: (a, b) => compareText(ORDER_STATUS_LABELS[a.status], ORDER_STATUS_LABELS[b.status]),
  date: (a, b) => compareDate(a.createdAt, b.createdAt),
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);

  useEffect(() => {
    adminGetAllOrders({ page: '1', limit: '100' })
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    return {
      total: orders.length,
      newOrders: orders.filter((order) => order.status === 'NEW').length,
      inProgress: orders.filter((order) => ['CONFIRMED', 'SHIPPED'].includes(order.status)).length,
      revenue,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statuses.length === 0 || statuses.includes(order.status);
      const matchesQuery = !normalizedQuery || [
        String(order.orderNumber),
        order.customerName,
        order.customerPhone,
        order.customerEmail || '',
        order.ttn || '',
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, statuses]);

  const { sorted, column, direction, onSort } = useTableSort(filteredOrders, ORDER_COMPARATORS);

  return (
    <div className="space-y-6">
      <AdminPageHint
        storageKey="orders"
        tips={[
          { text: 'Фільтруйте замовлення за статусом кнопками вгорі: Нове → Підтверджено → Відправлено → Доставлено.' },
          { text: 'Клікніть на замовлення, щоб відкрити деталі, змінити статус та ввести ТТН для відстеження.' },
          { text: 'Скасування замовлення автоматично повертає залишок товарів на склад.' },
          { text: 'Пошук — за номером замовлення (#123), іменем або email покупця.' },
        ]}
      />
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">Замовлення</h1>
          <p className="mt-1 text-sm text-gray-500">
            Обробка покупок, статусів, доставки та складу замовлення.
          </p>
        </div>
      </div>

      <StatStrip
        items={[
          { label: 'Всього', value: stats.total },
          { label: 'Нові', value: stats.newOrders, needsAction: true },
          { label: 'В роботі', value: stats.inProgress },
          { label: 'Сума', value: formatPrice(stats.revenue) },
        ]}
      />

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Пошук по номеру, покупцю, телефону, email або ТТН"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
          </div>
          <MultiSelect
            className="w-full lg:w-64"
            values={statuses}
            onChange={(v) => setStatuses(v as OrderStatus[])}
            placeholder="Усі статуси"
            options={STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] }))}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <SortableTh column="number" active={column} direction={direction} onSort={onSort} className="px-5 py-4">Замовлення</SortableTh>
                <SortableTh column="customer" active={column} direction={direction} onSort={onSort} className="px-5 py-4">Покупець</SortableTh>
                <SortableTh column="items" active={column} direction={direction} onSort={onSort} className="px-5 py-4">Товари</SortableTh>
                <SortableTh column="total" active={column} direction={direction} onSort={onSort} className="px-5 py-4">Сума</SortableTh>
                <SortableTh column="status" active={column} direction={direction} onSort={onSort} className="px-5 py-4">Статус</SortableTh>
                <SortableTh column="date" active={column} direction={direction} onSort={onSort} className="px-5 py-4">Дата</SortableTh>
                <th className="px-5 py-4 text-right font-semibold">Дія</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">Завантаження...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">Замовлень за цими умовами немає</td>
                </tr>
              ) : sorted.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                  className="group cursor-pointer transition hover:bg-blue-50/40"
                >
                  <td className="px-5 py-4">
                    <p className="font-mono text-base font-semibold text-gray-950">#{order.orderNumber}</p>
                    {order.ttn && <p className="mt-1 text-xs text-gray-500">ТТН {order.ttn}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-950">{order.customerName}</p>
                    <p className="mt-1 font-mono text-xs text-gray-500">{order.customerPhone}</p>
                    {order.customerEmail && <p className="mt-1 truncate text-xs text-gray-500">{order.customerEmail}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Package className="h-4 w-4 text-gray-400" />
                      {getItemsCount(order)} {pluralUk(getItemsCount(order), 'товар', 'товари', 'товарів')}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-950">{formatPrice(order.totalAmount)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(order.createdAt)}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-gray-400 transition-colors group-hover:text-blue-600 hover:text-blue-600"
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
