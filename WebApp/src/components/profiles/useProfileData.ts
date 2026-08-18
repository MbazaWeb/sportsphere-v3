
'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import type { ApiUser, ApiPost } from './types';

function pickUser(data: any): any | null {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  if (data.user && typeof data.user === 'object') return data.user;
  if (data.id || data.name || data.handle) return data;
  return null;
}

export function useProfileData(viewingHandle: string | undefined) {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const viewingId = useUIStore((s) => s.viewingUser?.id);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUserId = useAuthStore((s) => s.userProfile?.id);
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [userPosts, setUserPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!viewingHandle && !viewingId) return;
    setLoading(true);
    try {
      let data: any = null;
      if (viewingId) {
        const res = await apiFetch(`/api/profile?id=${encodeURIComponent(viewingId)}`);
        if (res.ok) data = pickUser(await res.json());
      }
      if (!data && viewingHandle) {
        const res = await apiFetch(`/api/profile?handle=${encodeURIComponent(viewingHandle)}`);
        if (res.ok) data = pickUser(await res.json());
      }
      if (!data && viewingHandle) {
        const res = await apiFetch(`/api/users?handle=${encodeURIComponent(viewingHandle)}`);
        if (res.ok) data = pickUser(await res.json());
      }
      if (!data && viewingId) {
        const res = await apiFetch(`/api/users?q=${encodeURIComponent(viewingId)}`);
        if (res.ok) data = pickUser(await res.json());
      }
      if (!data) {
        setLoading(false);
        return;
      }
      setApiUser(data);

      let isFollowing = false;
      if (isAuthenticated && currentUserId && data.id !== currentUserId) {
        try {
          const st = await apiFetch(`/api/follows/status?targetUserId=${data.id}`);
          if (st.ok) {
            const j = await st.json();
            isFollowing = !!(j.following || j.isFan);
          }
        } catch { /* ignore */ }
      }

      const initials = data.avatarInitials || (data.name ? String(data.name).slice(0, 2).toUpperCase() : 'SS');
      setViewingUser({
        id: data.id,
        name: data.name || 'SportSphere',
        handle: data.handle || '',
        avatar: data.avatarUrl || initials,
        avatarUrl: data.avatarUrl || null,
        verified: data.isVerified,
        isPro: data.isPro,
        proSince: data.proSince,
        coverGradient: data.coverGradient || 'from-emerald-600 to-emerald-900',
        coverUrl: data.coverUrl || null,
        bio: data.bio || '',
        role: data.role || 'fan',
        location: data.location || '',
        joined: data.registeredAt ? new Date(data.registeredAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
        followers: data.followerCount || data.fanCount || 0,
        following: data.followingCount || 0,
        posts: data.postCount || 0,
        isFollowing,
      });

      if (data.id) {
        const postsRes = await apiFetch(`/api/feed?userId=${data.id}`);
        if (postsRes.ok) {
          const posts = await postsRes.json();
          setUserPosts(Array.isArray(posts) ? posts : []);
        }
      }
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, [viewingHandle, viewingId, setViewingUser, isAuthenticated, currentUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { apiUser, userPosts, loading, refresh };
}
