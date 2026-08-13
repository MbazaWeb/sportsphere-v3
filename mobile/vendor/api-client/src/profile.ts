import type { PublicUser } from '@sportsphere/types/auth';
import { createApiClient } from './index';

/**
 * Profile API
 * -----------
 * - GET /api/profile         — own profile (auth required)
 * - GET /api/profile?handle= — public profile by handle
 */
export function createProfileApi(client: ReturnType<typeof createApiClient>) {
  return {
    /** Get the current user's full profile (auth required) */
    me: () => client.get<PublicUser>('/api/profile'),
    /** Get a public profile by handle (e.g. '@marcusrashford') */
    getByHandle: (handle: string) =>
      client.get<PublicUser>(`/api/profile?handle=${encodeURIComponent(handle)}`),
    /** Get a public profile by user id */
    getById: (userId: string) =>
      client.get<PublicUser>(`/api/users/${userId}`),
  };
}

export type ProfileApi = ReturnType<typeof createProfileApi>;
