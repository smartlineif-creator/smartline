'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, Wrench } from 'lucide-react';
import { adminGetAllOrders } from '@/lib/api';
import { Order, OrderStatus } from '@/types';
import { formatPrice, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, pluralUk } from '@/lib/utils';
import SortableTh from '@/components/admin/SortableTh';
import { useTableSort, compareText, compareNumber, compareDate, type SortComparators } from '@/lib/useTableSort';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${ORDER_STATUS_COLORS[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

type RequestSortColumn = 'number' | 'customer' | 'services' | 'total' | 'status' | 'date';

function serviceCount(order: Order) {
  return order.items?.filter((i) => i.serviceId).reduce((n, i) => n + i.quantity, 0) ?? 0;
}

const REQUEST_COMPARATORS: SortComparators<RequestSortColumn, Order> = {
  number: (a, b) => compareNumber(a.orderNumber, b.orderNumber),
  customer: (a, b) => compareText(a.customerName, b.customerName),
  services: (a, b) => compareNumber(serviceCount(a), serviceCount(b)),
  total: (a, b) => compareNumber(Number(a.totalAmount), Number(b.totalAmount)),
  status: (a, b) => compareText(ORDER_STATUS_LABELS[a.status], ORDER_STATUS_LABELS[b.status]),
  date: (a, b) => compareDate(a.createdAt, b.createdAt),
};

export default function AdminRequestsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    adminGetAllOrders({ page: '1', limit: '200' })
      .then((res) => {
        const requests = res.data.filter((o) => o.items?.some((item) => item.serviceId));
        setOrders(requests);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      String(o.orderNumber).includes(q)
    );
  });

  const { sorted, column, direction, onSort } = useTableSort(filtered, REQUEST_COMPARATORS);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-gray-950">
          <Wrench className="h-6 w-6 text-blue-600" />
          Заявки на послуги
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {loading ? '...' : `${orders.length} ${pluralUk(orders.length, 'замовлення', 'замовлення', 'замовлень')} із послугами`}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative mb-5 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ім'я, телефон, №..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <SortableTh column="number" active={column} direction={direction} onSort={onSort} className="pb-3 !px-0 text-xs font-semibold uppercase tracking-wider">№</SortableTh>
                <SortableTh column="customer" active={column} direction={direction} onSort={onSort} className="pb-3 !px-0 text-xs font-semibold uppercase tracking-wider">Клієнт</SortableTh>
                <SortableTh column="services" active={column} direction={direction} onSort={onSort} className="pb-3 !px-0 text-xs font-semibold uppercase tracking-wider">Послуги</SortableTh>
                <SortableTh column="total" active={column} direction={direction} onSort={onSort} className="pb-3 !px-0 text-xs font-semibold uppercase tracking-wider">Сума</SortableTh>
                <SortableTh column="status" active={column} direction={direction} onSort={onSort} className="pb-3 !px-0 text-xs font-semibold uppercase tracking-wider">Статус</SortableTh>
                <SortableTh column="date" active={column} direction={direction} onSort={onSort} className="pb-3 !px-0 text-xs font-semibold uppercase tracking-wider">Дата</SortableTh>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-gray-400">Завантаження...</td>
                </tr>
              )}
              {!loading && sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-gray-400">Заявок немає</td>
                </tr>
              )}
              {sorted.map((order) => {
                const serviceItems = order.items?.filter((i) => i.serviceId) ?? [];
                return (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    className="group cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 pr-4 font-mono text-xs text-gray-500">#{order.orderNumber}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.customerPhone}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-0.5">
                        {serviceItems.map((item, i) => (
                          <span key={i} className="flex items-center gap-1 text-xs text-blue-700">
                            <Wrench className="h-3 w-3 shrink-0 opacity-70" />
                            {item.name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{formatPrice(Number(order.totalAmount))}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-500">{formatDate(order.createdAt)}</td>
                    <td className="py-3" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center gap-1 text-xs text-gray-400 transition-colors group-hover:text-blue-600 hover:text-blue-600"
                      >
                        Відкрити <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
