'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Mail,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  Save,
  Truck,
  User,
} from 'lucide-react';
import { adminGetOrder, adminUpdateOrderStatus } from '@/lib/api';
import { Order, OrderStatus } from '@/types';
import { formatPrice, ORDER_STATUS_LABELS } from '@/lib/utils';

const STATUSES: OrderStatus[] = ['NEW', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getStatusTone(status: OrderStatus) {
  if (status === 'NEW') return 'bg-blue-50 text-blue-700 ring-blue-200';
  if (status === 'CONFIRMED') return 'bg-amber-50 text-amber-700 ring-amber-200';
  if (status === 'SHIPPED') return 'bg-orange-50 text-orange-700 ring-orange-200';
  if (status === 'DELIVERED') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  return 'bg-red-50 text-red-700 ring-red-200';
}

function normalizeRecord(value: unknown): Array<[string, string]> {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== null && item !== undefined && item !== '')
    .map(([key, item]) => [key, typeof item === 'object' ? JSON.stringify(item) : String(item)]);
}

function labelFromKey(key: string) {
  const labels: Record<string, string> = {
    method: 'Спосіб',
    city: 'Місто',
    cityName: 'Місто',
    warehouse: 'Відділення',
    warehouseName: 'Відділення',
    address: 'Адреса',
    paymentMethod: 'Оплата',
    provider: 'Сервіс',
    comment: 'Коментар',
  };
  return labels[key] || key;
}

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<OrderStatus>('NEW');
  const [ttn, setTtn] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadOrder = () => {
    setLoading(true);
    adminGetOrder(orderId)
      .then((data) => {
        setOrder(data);
        setStatus(data.status);
        setTtn(data.ttn || '');
        setAdminNote(((data as any).adminNote as string) || '');
      })
      .catch(() => {
        toast.error('Не вдалося завантажити замовлення');
        setOrder(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    queueMicrotask(loadOrder);
  }, [orderId]);

  const deliveryRows = useMemo(() => normalizeRecord(order?.delivery), [order?.delivery]);
  const paymentRows = useMemo(() => normalizeRecord(order?.payment), [order?.payment]);
  const itemsCount = order?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const updated = await adminUpdateOrderStatus(order.id, {
        status,
        ttn: ttn.trim(),
        adminNote: adminNote.trim(),
      });
      setOrder((current) => current ? { ...current, ...updated, ttn: updated.ttn } : updated);
      toast.success('Замовлення оновлено');
    } catch {
      toast.error('Не вдалося оновити замовлення');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-500">Завантаження...</div>;
  }

  if (!order) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">
        Замовлення не знайдено
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
        <ArrowLeft className="h-4 w-4" />
        Усі замовлення
      </Link>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-gray-950">Замовлення #{order.orderNumber}</h1>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusTone(order.status)}`}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {formatDate(order.createdAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Package className="h-4 w-4" />
                {itemsCount} товарів
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50 px-5 py-4 xl:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Сума</p>
            <p className="mt-1 text-3xl font-bold text-gray-950">{formatPrice(order.totalAmount)}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b bg-gray-50 px-5 py-4">
              <ReceiptText className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-gray-950">Що замовив покупець</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item) => (
                <div key={item.id} className="grid gap-4 px-5 py-4 md:grid-cols-[76px_1fr_auto] md:items-center">
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-gray-100">
                    {item.product?.images?.[0]?.url ? (
                      <Image src={item.product.images[0].url} alt={item.name} fill className="object-contain p-2" sizes="76px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-950">{item.name}</p>
                    {item.variantName && <p className="mt-1 text-sm text-gray-500">{item.variantName}</p>}
                    <p className="mt-2 font-mono text-sm text-gray-500">
                      {item.quantity} шт. × {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="text-lg font-semibold text-gray-950 md:text-right">
                    {formatPrice(Number(item.price) * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h2 className="font-semibold text-gray-950">Доставка</h2>
              </div>
              <div className="space-y-3">
                {deliveryRows.length ? deliveryRows.map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-0">
                    <span className="text-sm text-gray-500">{labelFromKey(key)}</span>
                    <span className="max-w-[220px] text-right text-sm font-medium text-gray-900">{value}</span>
                  </div>
                )) : <p className="text-sm text-gray-500">Дані доставки не вказані</p>}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <ReceiptText className="h-5 w-5 text-blue-600" />
                <h2 className="font-semibold text-gray-950">Оплата</h2>
              </div>
              <div className="space-y-3">
                {paymentRows.length ? paymentRows.map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4 border-b border-gray-100 pb-2 last:border-0">
                    <span className="text-sm text-gray-500">{labelFromKey(key)}</span>
                    <span className="max-w-[220px] text-right text-sm font-medium text-gray-900">{value}</span>
                  </div>
                )) : <p className="text-sm text-gray-500">Дані оплати не вказані</p>}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <User className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-gray-950">Покупець</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Імʼя</p>
                <p className="mt-1 font-semibold text-gray-950">{order.customerName}</p>
              </div>
              <a href={`tel:${order.customerPhone}`} className="flex items-center gap-3 rounded-xl border bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-white">
                <Phone className="h-4 w-4 text-blue-600" />
                {order.customerPhone}
              </a>
              {order.customerEmail && (
                <a href={`mailto:${order.customerEmail}`} className="flex items-center gap-3 rounded-xl border bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-white">
                  <Mail className="h-4 w-4 text-blue-600" />
                  {order.customerEmail}
                </a>
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Truck className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-gray-950">Керування</h2>
            </div>

            <label className="text-sm font-medium text-gray-700">Статус</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {STATUSES.map((item) => {
                const active = status === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setStatus(item)}
                    className={`rounded-xl px-3 py-2 text-sm font-medium ring-1 transition ${
                      active ? getStatusTone(item) : 'bg-white text-gray-600 ring-gray-200 hover:ring-blue-200'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[item]}
                  </button>
                );
              })}
            </div>

            <label className="mt-5 block text-sm font-medium text-gray-700">ТТН Нової Пошти</label>
            <input
              value={ttn}
              onChange={(event) => setTtn(event.target.value)}
              placeholder="59000000000000"
              className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />

            <label className="mt-5 block text-sm font-medium text-gray-700">Нотатка менеджера</label>
            <textarea
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              rows={4}
              placeholder="Наприклад: клієнт просив дзвінок після 18:00"
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
          </section>
        </aside>
      </div>

      <div className="fixed bottom-0 left-56 right-0 z-20 border-t bg-white/95 px-6 py-3 shadow-[0_-16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="ml-auto flex max-w-6xl items-center justify-end gap-3">
          <Link href="/admin/orders" className="inline-flex h-11 items-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Назад
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Збереження...' : 'Зберегти зміни'}
          </button>
        </div>
      </div>
    </div>
  );
}
