'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Package, Phone, Undo2, User, Wrench } from 'lucide-react';
import { adminGetOrder, adminRedeemServiceItem } from '@/lib/api';
import { Order, OrderItem } from '@/types';
import {
  formatPrice,
  getServiceRedemptionLabel,
  getServiceRedemptionState,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  pluralUk,
  SERVICE_REDEMPTION_COLORS,
} from '@/lib/utils';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function RedeemRow({ item, onChange }: { item: OrderItem; onChange: (item: OrderItem) => void }) {
  const [pending, setPending] = useState(false);
  const state = getServiceRedemptionState(item);

  const redeem = async (delta: 1 | -1) => {
    const previous = item;
    setPending(true);
    onChange({
      ...item,
      redeemedCount: item.redeemedCount + delta,
      lastRedeemedAt: delta === 1 ? new Date().toISOString() : item.lastRedeemedAt,
    });
    try {
      const updated = await adminRedeemServiceItem(item.id, delta);
      onChange(updated);
      toast.success(delta === 1 ? 'Одиницю погашено' : 'Погашення скасовано');
    } catch {
      onChange(previous);
      toast.error('Не вдалося оновити стан послуги');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-gray-950">{item.name}</p>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${SERVICE_REDEMPTION_COLORS[state]}`}>
            {getServiceRedemptionLabel(item)}
          </span>
        </div>
        {item.variantName && <p className="mt-1 text-sm text-gray-500">{item.variantName}</p>}
        <p className="mt-2 font-mono text-sm text-gray-500">
          {item.quantity} шт. × {formatPrice(item.price)}
        </p>
        {item.lastRedeemedAt && (
          <p className="mt-1 text-xs text-gray-400">Востаннє погашено {formatDate(item.lastRedeemedAt)}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => redeem(-1)}
          disabled={pending || item.redeemedCount <= 0}
          title="Повернути одну"
          aria-label="Повернути одну"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => redeem(1)}
          disabled={pending || item.redeemedCount >= item.quantity}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
        >
          <Check className="h-4 w-4" />
          {item.redeemedCount >= item.quantity ? 'Погашено' : 'Погасити'}
        </button>
      </div>
    </div>
  );
}

export default function AdminRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetOrder(id)
      .then(setOrder)
      .catch(() => {
        toast.error('Не вдалося завантажити заявку');
        setOrder(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleItemChange = (updated: OrderItem) => {
    setOrder((current) => {
      if (!current) return current;
      return { ...current, items: current.items?.map((it) => (it.id === updated.id ? updated : it)) };
    });
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-500">Завантаження...</div>;
  }

  if (!order) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">
        Заявку не знайдено
      </div>
    );
  }

  const serviceItems = order.items?.filter((item) => item.serviceId) ?? [];
  const productItems = order.items?.filter((item) => !item.serviceId) ?? [];
  const productCount = productItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6 pb-10">
      <Link href="/admin/requests" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
        <ArrowLeft className="h-4 w-4" />
        Усі послуги клієнтів
      </Link>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-gray-950">Заявка #{order.orderNumber}</h1>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${ORDER_STATUS_COLORS[order.status]}`}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4" />
                {order.customerName}
              </span>
              <a href={`tel:${order.customerPhone}`} className="inline-flex items-center gap-2 hover:text-blue-600">
                <Phone className="h-4 w-4" />
                {order.customerPhone}
              </a>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {formatDate(order.createdAt)}
              </span>
            </div>
          </div>
          <Link
            href={`/admin/orders/${order.id}`}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Відкрити повне замовлення
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b bg-gray-50 px-5 py-4">
          <Wrench className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-gray-950">Послуги в заявці</h2>
        </div>
        {serviceItems.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-500">Послуг у цьому замовленні немає</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {serviceItems.map((item) => (
              <RedeemRow key={item.id} item={item} onChange={handleItemChange} />
            ))}
          </div>
        )}
      </section>

      {productItems.length > 0 && (
        <details className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <summary className="flex cursor-pointer items-center gap-3 bg-gray-50 px-5 py-4 text-sm font-semibold text-gray-700">
            <Package className="h-4 w-4 text-gray-400" />
            У замовленні також {productCount} {pluralUk(productCount, 'товар', 'товари', 'товарів')}
          </summary>
          <div className="divide-y divide-gray-100">
            {productItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                </div>
                <p className="text-gray-500">{item.quantity} шт. × {formatPrice(item.price)}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
