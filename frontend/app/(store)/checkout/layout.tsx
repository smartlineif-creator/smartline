import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Оформлення замовлення',
  description: 'Завершіть оформлення вашого замовлення в SmartLine.',
  robots: 'noindex',
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
