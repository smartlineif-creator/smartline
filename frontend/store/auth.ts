'use client';

import { create } from 'zustand';
import { User } from '@/types';
import { getMe, logout as apiLogout } from '@/lib/api';

interface AuthStore {
  user: User | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  fetchUser: async () => {
    try {
      set({ loading: true });
      const user = await getMe();
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    await apiLogout().catch(() => {});
    set({ user: null });
  },

  setUser: (user) => set({ user }),
}));
