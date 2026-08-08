/**
 * Mobile auth store — Zustand
 * ---------------------------
 * Mirrors the web src/store/authStore.ts API so screens can read
 * `useAuthStore(s => s.user)` the same way.
 */

import { create } from 'zustand';
import type { AuthSession } from '@sportsphere/types/auth';

import { authApi, setToken } from './api';

interface AuthState {
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  fetchMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: false,
  error: null,

  fetchMe: async () => {
    set({ loading: true, error: null });
    try {
      const res = await authApi.me();
      set({ session: { user: res.user, token: res.token, expiresAt: res.expiresAt }, loading: false });
    } catch (err: any) {
      // 401 = not logged in; treat as no session rather than an error
      if (err?.status === 401) {
        set({ session: null, loading: false, error: null });
      } else {
        set({ session: null, loading: false, error: err?.message ?? 'Failed to load session' });
      }
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await authApi.login({ email, password });
      await setToken(res.token);
      set({ session: { user: res.user, token: res.token, expiresAt: res.expiresAt }, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err?.message ?? 'Login failed' });
      throw err;
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch {}
    await setToken(null);
    set({ session: null });
  },

  clearError: () => set({ error: null }),
}));
