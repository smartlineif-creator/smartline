'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Package,
  Search,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { adminGetAllOrders } from '@/lib/api';
import { Order, OrderStatus } from '@/types';
import { formatPrice, ORDER_STATUS_LABELS } from '@/lib/utils';

const STATUSES: Array<'ALL' | OrderStatus> = ['ALL', 'NEW', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getItemsCount(order: Order) {
  return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
}

function getStatusTone(status: OrderStatus) {
  if (status === 'NEW') return 'bg-blue-50 text-blue-700 ring-blue-200';
  if (status === 'CONFIRMED') return 'bg-amber-50 text-amber-700 ring-amber-200';
  if (status === 'SHIPPED') return 'bg-orange-50 text-orange-700 ring-orange-200';
  if (status === 'DELIVERED') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  return 'bg-red-50 text-red-700 ring-red-200';
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | OrderStatus>('ALL');

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
      const matchesStatus = status === 'ALL' || order.status === status;
      const matchesQuery = !normalizedQuery || [
        String(order.orderNumber),
        order.customerName,
        order.customerPhone,
        order.customerEmail || '',
        order.ttn || '',
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">Замовлення</h1>
          <p className="mt-1 text-sm text-gray-500">
            Обробка покупок, статусів, доставки та складу замовлення.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Всього', value: stats.total, icon: ShoppingCart, tone: 'bg-blue-50 text-blue-700' },
          { label: 'Нові', value: stats.newOrders, icon: Clock3, tone: 'bg-amber-50 text-amber-700' },
          { label: 'В роботі', value: stats.inProgress, icon: Truck, tone: 'bg-orange-50 text-orange-700' },
          { label: 'Сума', value: formatPrice(stats.revenue), icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-950">{item.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

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
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((item) => {
              const active = status === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStatus(item)}
                  className={`h-10 rounded-xl px-4 text-sm font-medium transition ${
                    active ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-700'
                  }`}
                >
                  {item === 'ALL' ? 'Усі' : ORDER_STATUS_LABELS[item]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">Замовлення</th>
                <th className="px-5 py-4 text-left font-semibold">Покупець</th>
                <th className="px-5 py-4 text-left font-semibold">Товари</th>
                <th className="px-5 py-4 text-left font-semibold">Сума</th>
                <th className="px-5 py-4 text-left font-semibold">Статус</th>
                <th className="px-5 py-4 text-left font-semibold">Дата</th>
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
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="group transition hover:bg-blue-50/40">
                  <td className="px-5 py-4">
                    <Link href={`/admin/orders/${order.id}`} className="block">
                      <p className="font-mono text-base font-semibold text-gray-950">#{order.orderNumber}</p>
                      {order.ttn && <p className="mt-1 text-xs text-gray-500">ТТН {order.ttn}</p>}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/admin/orders/${order.id}`} className="block">
                      <p className="font-medium text-gray-950">{order.customerName}</p>
                      <p className="mt-1 font-mono text-xs text-gray-500">{order.customerPhone}</p>
                      {order.customerEmail && <p className="mt-1 truncate text-xs text-gray-500">{order.customerEmail}</p>}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/admin/orders/${order.id}`} className="flex items-center gap-2 text-gray-700">
                      <Package className="h-4 w-4 text-gray-400" />
                      {getItemsCount(order)} товарів
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-950">{formatPrice(order.totalAmount)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusTone(order.status)}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(order.createdAt)}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-4 font-medium text-gray-700 transition hover:border-blue-200 hover:bg-white hover:text-blue-700"
                    >
                      Відкрити
                      <ArrowRight className="h-4 w-4" />
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
