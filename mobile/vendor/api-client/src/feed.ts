import type { Post, FeedFilters } from '@sportsphere/types/feed';
import { createApiClient } from './index';

/**
 * Feed API
 * --------
 * The server's GET /api/feed returns a Post[] directly (not wrapped in {posts}).
 * Filters:
 *   - type: 'for-you' | 'trending' | 'spotlight' (default: 'for-you')
 *   - userId: filter by author
 *   - q: search query
 */
export function createFeedApi(client: ReturnType<typeof createApiClient>) {
  return {
    list: (filters?: FeedFilters & { type?: string; userId?: string; q?: string }) => {
      const params = new URLSearchParams();
      const type = filters?.type ?? 'for-you';
      params.set('type', type);
      if (filters?.sport)  params.set('sport', filters.sport);
      if (filters?.cursor) params.set('cursor', filters.cursor);
      if (filters?.limit)  params.set('limit', String(filters.limit));
      if ((filters as any)?.userId) params.set('userId', (filters as any).userId);
      if ((filters as any)?.q)      params.set('q', (filters as any).q);
      const qs = params.toString();
      return client.get<Post[]>(`/api/feed${qs ? `?${qs}` : ''}`);
    },
    /** Get a single post by id (with comments + likes hydrated) */
    getById: (postId: string) =>
      client.get<Post>(`/api/posts/${postId}`),
  };
}

export type FeedApi = ReturnType<typeof createFeedApi>;
