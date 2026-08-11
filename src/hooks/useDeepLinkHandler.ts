'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { apiFetch } from '@/lib/api';
import { apiUserToViewing } from '@/types';

export function useDeepLinkHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const setViewingPostId = useUIStore((s) => s.setViewingPostId);

  useEffect(() => {
    const userId = searchParams.get('user');
    const postId = searchParams.get('post');

    if (userId) {
      // Fetch user and open profile
      apiFetch(`/api/users/${userId}`)
        .then(res => res.json())
        .then(user => {
          if (user && !user.error) {
            setViewingUser(apiUserToViewing(user));
            // Clear the param without refreshing
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete('user');
            router.replace(`/?${newParams.toString()}`);
          }
        })
        .catch(err => console.error('Failed to resolve deep linked user:', err));
    }

    if (postId) {
      setViewingPostId(postId);
      // Clear the param without refreshing
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('post');
      router.replace(`/?${newParams.toString()}`);
    }
  }, [searchParams, setViewingUser, setViewingPostId, router]);
}
