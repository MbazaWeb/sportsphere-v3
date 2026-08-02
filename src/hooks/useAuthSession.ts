'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * On app mount, hydrate the auth store from the server-side session cookie
 * by calling /api/auth/me. If a valid session exists, the user is logged in
 * automatically; otherwise the store stays logged out.
 *
 * Call this once near the top of the React tree (in layout or root page).
 */
export function useAuthSession() {
  const setUserProfile = useAuthStore((s) => s.setUserProfile);
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as {
          user: ReturnType<typeof useAuthStore.getState>['userProfile'];
        };
        if (cancelled) return;
        if (data.user) {
          setUserProfile(data.user);
          setIsAuthenticated(true);
        } else {
          setUserProfile(null);
          setIsAuthenticated(false);
        }
      } catch {
        // Network errors → stay logged out
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
