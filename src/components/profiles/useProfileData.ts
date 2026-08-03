'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import type { ApiUser, ApiPost } from './types';

export function useProfileData(viewingHandle: string | undefined) {
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [userPosts, setUserPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!viewingHandle) return;
    setLoading(true);
    try {
      const res = await fetch(/api/users?handle=\);
      if (res.ok) {
        const data = await res.json();
        setApiUser(data);
        setViewingUser({
          id: data.id,
          name: data.name,
          handle: data.handle,
          avatar: data.avatarInitials,
          verified: data.isVerified,
          coverGradient: data.coverGradient,
          bio: data.bio || '',
          role: data.role,
          location: data.location || '',
          joined: data.registeredAt ? new Date(data.registeredAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
          followers: data.followerCount || 0,
          following: data.followingCount || 0,
          posts: data.postCount || 0,
          isFollowing: false,
        });
        const postsRes = await fetch(/api/feed?userId=\);
        if (postsRes.ok) setUserPosts(await postsRes.json());
      }
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [viewingHandle]);

  return { apiUser, userPosts, loading, refresh };
}
