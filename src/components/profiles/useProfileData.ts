'use client';
import { apiFetch } from '@/lib/api';

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import type { ApiUser, ApiPost } from './types';

export function useProfileData(viewingHandle: string | undefined) {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUserId = useAuthStore((s) => s.userProfile?.id);
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [userPosts, setUserPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!viewingHandle) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/users?handle=${encodeURIComponent(viewingHandle)}`);
      if (res.ok) {
        const data = await res.json();
        setApiUser(data);

        // Check if current user is following this user
        let isFollowing = false;
        if (isAuthenticated && currentUserId && data.id !== currentUserId) {
          try {
            const followCheck = await apiFetch(`/api/follows?userId=${currentUserId}&type=following`);
            if (followCheck.ok) {
              const followingList = await followCheck.json();
              isFollowing = Array.isArray(followingList) && followingList.some((u: any) => u.id === data.id);
            }
          } catch { /* ignore */ }
        }

        setViewingUser({
          id: data.id,
          name: data.name,
          handle: data.handle,
          avatar: data.avatarUrl || data.avatarInitials || (data.name ? data.name.slice(0, 2).toUpperCase() : '??'),
          avatarUrl: data.avatarUrl || null,
          verified: data.isVerified,
          isPro: data.isPro,
          proSince: data.proSince,
          coverGradient: data.coverGradient || 'from-emerald-600 to-emerald-900',
          bio: data.bio || '',
          role: data.role || 'fan',
          location: data.location || '',
          joined: data.registeredAt ? new Date(data.registeredAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
          followers: data.followerCount || 0,
          following: data.followingCount || 0,
          posts: data.postCount || 0,
          isFollowing,
        });

        const postsRes = await apiFetch(`/api/feed?userId=${data.id}`);
        if (postsRes.ok) setUserPosts(await postsRes.json());
      }
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, [viewingHandle, setViewingUser, isAuthenticated, currentUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { apiUser, userPosts, loading, refresh };
}
