'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Tag, ShoppingCart, Users,
  Star, Image, Percent, LogOut, LayoutTemplate, HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const NAV = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Товари', icon: Package },
  { href: '/admin/categories', label: 'Категорії', icon: Tag },
  { href: '/admin/orders', label: 'Замовлення', icon: ShoppingCart },
  { href: '/admin/users', label: 'Клієнти', icon: Users },
  { href: '/admin/promotions', label: 'Акції', icon: Percent },
  { href: '/admin/banners', label: 'Банери', icon: Image },
  { href: '/admin/reviews', label: 'Відгуки', icon: Star },
  { href: '/admin/homepage', label: 'Головна сторінка', icon: LayoutTemplate },
  { href: '/admin/help', label: 'Довідка', icon: HelpCircle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const router = useRouter();

  if (pathname === '/admin/login') return <>{children}</>;

  const handleLogout = async () => {
    await logout();
    toast.success('Ви вийшли');
    router.push('/admin/login');
  };

  return (
    <div className="admin-panel flex h-screen bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-gray-300 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-700">
          <Link href="/admin" className="text-white font-bold text-lg">
            SmartLine Admin
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <NavLink key={href} href={href} label={label} icon={Icon} pathname={pathname} />
          ))}
        </nav>
        <div className="p-2 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-800 hover:text-white w-full transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Вийти
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
}) {
  const isActive = href === '/admin'
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5',
        isActive
          ? 'bg-blue-600 text-white'
          : 'hover:bg-gray-800 hover:text-white',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}
