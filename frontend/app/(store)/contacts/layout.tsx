import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Контакти',
  description: 'Зв\'яжіться з нами — телефон, email та адреса SmartLine.',
};

export default function ContactsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
