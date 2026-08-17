import Link from 'next/link';
import { DashboardPeriod } from '@/types';

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 'today', label: 'Сьогодні' },
  { value: '7d', label: '7 днів' },
  { value: '30d', label: '30 днів' },
  { value: 'all', label: 'Увесь час' },
];

interface Props {
  current: DashboardPeriod;
}

export default function PeriodTabs({ current }: Props) {
  return (
    <nav aria-label="Період" className="max-w-full">
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border bg-white p-1 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PERIODS.map(({ value, label }) => {
          const isActive = current === value;
          return (
            <Link
              key={value}
              href={value === '7d' ? '/admin' : `/admin?period=${value}`}
              aria-current={isActive ? 'true' : undefined}
              className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
