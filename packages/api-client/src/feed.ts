import type { Post, FeedFilters } from '@sportsphere/types/feed.js';
import { createApiClient } from './index.js';

export function createFeedApi(client: ReturnType<typeof createApiClient>) {
  return {
    list: (filters?: FeedFilters) => {
      const params = new URLSearchParams();
      if (filters?.type)   params.set('type', filters.type);
      if (filters?.sport)  params.set('sport', filters.sport);
      if (filters?.cursor) params.set('cursor', filters.cursor);
      if (filters?.limit)  params.set('limit', String(filters.limit));
      const qs = params.toString();
      return client.get<{ posts: Post[]; nextCursor?: string }>(
        `/api/feed${qs ? `?${qs}` : ''}`,
      );
    },
    create: (body: { content?: string; media?: string[]; type?: string }) =>
      client.post<Post>('/api/posts', body),
    like:    (postId: string) => client.post<{ liked: boolean; count: number }>(`/api/likes`, { postId, action: 'like' }),
    unlike:  (postId: string) => client.post<{ liked: boolean; count: number }>(`/api/likes`, { postId, action: 'unlike' }),
  };
}

export type FeedApi = ReturnType<typeof createFeedApi>;
