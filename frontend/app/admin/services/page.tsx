'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminGetServices, adminUpdateService, adminDeleteService } from '@/lib/api';
import { Service } from '@/types';
import { Plus, Trash2, AlertTriangle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice, getServiceDisplayPrice, STATE_BADGE } from '@/lib/utils';
import SortableTh from '@/components/admin/SortableTh';
import { useTableSort, compareText, compareNumber, type SortComparators } from '@/lib/useTableSort';

type ServiceSortColumn = 'name' | 'slug' | 'price' | 'status';

/** Sort on exactly the number the column renders, so the order never contradicts the value. */
function effectivePrice(s: Service) {
  return getServiceDisplayPrice(s).amount;
}

const SERVICE_COMPARATORS: SortComparators<ServiceSortColumn, Service> = {
  name: (a, b) => compareText(a.name, b.name),
  slug: (a, b) => compareText(a.slug, b.slug),
  price: (a, b) => compareNumber(effectivePrice(a), effectivePrice(b)),
  status: (a, b) => compareNumber(Number(b.isActive), Number(a.isActive)),
};

export default function AdminServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const { sorted, column, direction, onSort } = useTableSort(services, SERVICE_COMPARATORS);

  const load = () => adminGetServices().then(setServices).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleToggleActive = async (s: Service) => {
    try {
      await adminUpdateService(s.id, { isActive: !s.isActive });
      load();
    } catch {
      toast.error('Помилка');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminDeleteService(deleteTarget.id);
      toast.success('Видалено');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('Помилка видалення');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">Послуги</h1>
          <p className="mt-1 text-sm text-gray-500">{services.length} послуг</p>
        </div>
        <Link
          href="/admin/services/new"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Нова послуга
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <SortableTh column="name" active={column} direction={direction} onSort={onSort} className="text-xs font-semibold uppercase tracking-wider">Назва</SortableTh>
              <SortableTh column="slug" active={column} direction={direction} onSort={onSort} className="text-xs font-semibold uppercase tracking-wider">Slug</SortableTh>
              <SortableTh column="price" active={column} direction={direction} onSort={onSort} className="text-xs font-semibold uppercase tracking-wider">Ціна</SortableTh>
              <SortableTh column="status" active={column} direction={direction} onSort={onSort} className="text-xs font-semibold uppercase tracking-wider">Статус</SortableTh>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Дії</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((s) => (
              <tr key={s.id} onClick={() => router.push(`/admin/services/${s.id}`)} className="group cursor-pointer hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.slug}</td>
                <td className="px-4 py-3 text-gray-700">
                  {(() => {
                    const { amount, prefix } = getServiceDisplayPrice(s);
                    return (
                      <>
                        {prefix && <span className="mr-1 text-xs text-gray-400">{prefix}</span>}
                        {formatPrice(amount)}
                      </>
                    );
                  })()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleActive(s); }}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ring-1 ${
                      s.isActive
                        ? `${STATE_BADGE.on} hover:bg-emerald-100`
                        : `${STATE_BADGE.off} hover:bg-gray-100`
                    }`}
                  >
                    {s.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {s.isActive ? 'Активна' : 'Прихована'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setDeleteTarget(s)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/admin/services/${s.id}`}
                    className="inline-flex items-center gap-1 text-xs text-gray-400 transition-colors group-hover:text-blue-600 hover:text-blue-600"
                  >
                    Відкрити <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {services.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">Послуги ще не додані</div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-gray-900">Видалити послугу?</h3>
            <p className="mb-6 text-sm text-gray-500">«{deleteTarget.name}» буде видалено назавжди.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Скасувати
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
