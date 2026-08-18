// SportSphere — feedData.ts
// This file now only re-exports shared types from @/types.
// All actual feed/user data comes from the API layer (/api/*).
// Components should use /api/users?handle= to fetch users dynamically.

export type { ViewingUser as FeedUser } from '@/types';
export { apiUserToViewing as mapApiUserToFeedUser } from '@/types';

// Helper to fetch a user by handle from the API
export async function fetchUserByHandle(handle: string) {
  try {
    const { apiFetch } = await import('@/lib/api');
    const res = await apiFetch(`/api/users?handle=${encodeURIComponent(handle)}`);
    if (!res.ok) return null;
    const user = await res.json();
    const { apiUserToViewing } = await import('@/types');
    return apiUserToViewing(user);
  } catch {
    return null;
  }
}
