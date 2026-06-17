import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Мій акаунт',
  description: 'Управляйте своїм профілем, переглядайте замовлення та налаштування.',
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
