'use client';

import { useEffect } from 'react';
import { useRecentlyViewedStore, RecentProduct } from '@/store/recentlyViewed';

interface Props {
  product: RecentProduct;
}

/** Silently tracks the current product on mount. No visual output. */
export default function RecentlyViewedTracker({ product }: Props) {
  const add = useRecentlyViewedStore((s) => s.add);

  useEffect(() => {
    add(product);
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
