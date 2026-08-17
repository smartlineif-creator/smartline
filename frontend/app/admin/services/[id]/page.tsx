'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { adminGetService } from '@/lib/api';
import { Service } from '@/types';
import ServiceForm from '@/components/admin/ServiceForm';

export default function AdminServiceEditPage() {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetService(id)
      .then(setService)
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/services" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Послуги
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-950">
          {loading ? 'Завантаження...' : (service?.name ?? 'Не знайдено')}
        </h1>
      </div>

      {loading && (
        <div className="text-sm text-gray-500">Завантаження...</div>
      )}
      {!loading && service && <ServiceForm initial={service} />}
      {!loading && !service && (
        <p className="text-red-400 text-sm">Послугу не знайдено</p>
      )}
    </div>
  );
}
