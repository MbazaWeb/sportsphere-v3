/**
 * Mobile auth store — Zustand
 * ---------------------------
 * Mirrors the web src/store/authStore.ts API so screens can read
 * `useAuthStore(s => s.user)` the same way.
 *
 * The JWT is stored in expo-secure-store (via lib/api.ts setToken).
 * On app boot, RootLayout calls fetchMe() to rehydrate the session.
 */

import { create } from 'zustand';
import type { AuthSession, PublicUser } from '@sportsphere/types/auth';
import * as SecureStore from 'expo-secure-store';

import { authApi, setToken, refreshCachedToken } from './api';

const JWT_KEY = 'sportsphere.jwt';

interface AuthState {
  session: AuthSession | null;
  /** Convenience accessor for the current user (or null). */
  user: PublicUser | null;
  loading: boolean;
  error: string | null;
  /** True once fetchMe has been called at least once (boot gate). */
  initialized: boolean;

  fetchMe: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    handle: string;
    password: string;
    sports?: string[];
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: false,
  error: null,
  initialized: false,

  fetchMe: async () => {
    set({ loading: true, error: null });
    try {
      // Make sure the api-client has the latest cached token before calling /me.
      await refreshCachedToken();
      const res = await authApi.me();
      // The server returns { user: PublicUser | null } OR PublicUser directly.
      const user = (res as any)?.user ?? (res as any);
      if (user) {
        const token = await getCachedToken();
        if (token) {
          set({
            session: { user, token, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 },
            user,
            loading: false,
            initialized: true,
          });
          return;
        }
      }
      // No user or no token — clear session.
      set({ session: null, user: null, loading: false, initialized: true });
    } catch (err: any) {
      if (err?.status === 401) {
        set({ session: null, user: null, loading: false, error: null, initialized: true });
      } else {
        set({
          session: null,
          user: null,
          loading: false,
          error: err?.message ?? 'Failed to load session',
          initialized: true,
        });
      }
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await authApi.login({ email, password });
      await setToken(res.token);
      set({
        session: { user: res.user, token: res.token, expiresAt: res.expiresAt },
        user: res.user,
        loading: false,
      });
    } catch (err: any) {
      const message = err?.details?.error ?? err?.message ?? 'Login failed';
      set({ loading: false, error: message });
      throw err;
    }
  },

  register: async ({ name, email, handle, password, sports }) => {
    set({ loading: true, error: null });
    try {
      const res = await authApi.register({ name, email, handle, password, sports });
      await setToken(res.token);
      set({
        session: { user: res.user, token: res.token, expiresAt: res.expiresAt },
        user: res.user,
        loading: false,
      });
    } catch (err: any) {
      const message = err?.details?.error ?? err?.message ?? 'Registration failed';
      set({ loading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch {}
    await setToken(null);
    set({ session: null, user: null });
  },

  clearError: () => set({ error: null }),
}));

// Helper to read the cached token from SecureStore without circular import.
async function getCachedToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(JWT_KEY);
  } catch {
    return null;
  }
}
