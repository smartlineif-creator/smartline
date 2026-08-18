'use client';

import { useEffect } from 'react';
import { ensureSession } from '@/lib/api';

/** Renders nothing — re-mints the access token on mount if it expired while the tab was closed. */
export function SessionBootstrap() {
  useEffect(() => {
    void ensureSession();
  }, []);
  return null;
}
