import { createApiClient } from './index';

/**
 * Follows API
 * -----------
 * Toggle follow state for a user.
 */
export function createFollowsApi(client: ReturnType<typeof createApiClient>) {
  return {
    /** POST /api/follows — toggle follow on a user (auth required) */
    toggle: (targetUserId: string) =>
      client.post<{ following: boolean; followerCount: number }>(
        '/api/follows',
        { targetUserId },
      ),
  };
}

export type FollowsApi = ReturnType<typeof createFollowsApi>;
