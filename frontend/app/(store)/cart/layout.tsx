import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Кошик',
  description: 'Перегляньте товари у вашому кошику та оформіть замовлення.',
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
