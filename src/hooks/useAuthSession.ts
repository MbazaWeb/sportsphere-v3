'use client';
import { apiFetch } from '@/lib/api';
import { useEffect } from 'react';
import { useAuthStore, type UserProfile } from '@/store/authStore';

/**
 * Hydrate auth from /api/auth/me on mount (and when tab regains focus).
 */
function normalizeUser(raw: any): UserProfile | null {
  if (!raw || !raw.id) return null;
  return {
    id: raw.id,
    name: raw.name || '',
    email: raw.email || '',
    handle: raw.handle || '',
    avatar: raw.avatar || raw.avatarInitials || (raw.name ? String(raw.name).slice(0, 2).toUpperCase() : '?'),
    avatarUrl: raw.avatarUrl ?? null,
    role: raw.role || 'fan',
    verificationStatus: raw.verificationStatus || 'none',
    bio: raw.bio || '',
    sportsFollowing: raw.sportsFollowing || [],
    registeredAt: raw.registeredAt || new Date().toISOString(),
    roleData: raw.roleData || {},
    isVerified: !!raw.isVerified,
    emailVerified: !!raw.emailVerified,
    isPro: !!raw.isPro,
    proSince: raw.proSince ?? null,
    proTier: raw.proTier ?? null,
    followerCount: raw.followerCount ?? 0,
    followingCount: raw.followingCount ?? 0,
    postCount: raw.postCount ?? 0,
    location: raw.location || '',
    coverGradient: raw.coverGradient,
    coverUrl: raw.coverUrl ?? null,
    roleId: raw.roleId,
    roleTypeId: raw.roleTypeId,
    roleName: raw.roleName,
    typeName: raw.typeName,
    typedProfile: raw.typedProfile,
    roleProfile: raw.roleProfile,
    sports: raw.sports,
  } as UserProfile;
}

export function useAuthSession() {
  const setUserProfile = useAuthStore((s) => s.setUserProfile);
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const res = await apiFetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) {
            setUserProfile(null);
            setIsAuthenticated(false);
            setHydrated(true);
          }
          return;
        }
        const data = await res.json();
        const user = normalizeUser(data.user || data);
        if (cancelled) return;
        if (user) {
          setUserProfile(user);
          setIsAuthenticated(true);
        } else {
          setUserProfile(null);
          setIsAuthenticated(false);
        }
      } catch {
        /* stay as-is on network error */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    hydrate();
    const onFocus = () => { hydrate(); };
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [setUserProfile, setIsAuthenticated, setHydrated]);
}
