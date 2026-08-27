import type { Metadata } from 'next';

// Personal wishlist — a title for the tab, and kept out of the search index.
export const metadata: Metadata = {
  title: 'Обране',
  robots: { index: false, follow: false },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
