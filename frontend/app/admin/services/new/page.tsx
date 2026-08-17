'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ServiceForm from '@/components/admin/ServiceForm';

export default function AdminServiceNewPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/services" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Послуги
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-950">Нова послуга</h1>
      </div>
      <ServiceForm />
    </div>
  );
}
