import type { Post } from '@sportsphere/types/feed';
import { createApiClient } from './index';

/**
 * Posts API
 * ---------
 * Create + like + share + bookmark. Delegates to /api/posts and /api/likes.
 */
export interface CreatePostBody {
  content: string;
  postType?: 'post' | 'photo' | 'video' | 'spotlight' | 'poll' | 'prediction' | 'highlight';
  mediaUrls?: string[];
  teamTag?: string;
  playerTag?: string;
  hashtags?: string[];
  location?: string;
  isBreaking?: boolean;
  poll?: { question: string; options: string[]; durationHours?: number };
  prediction?: {
    homeTeam: string;
    awayTeam: string;
    predictedHome: number;
    predictedAway: number;
    confidence?: 'low' | 'medium' | 'high';
  };
}

export function createPostsApi(client: ReturnType<typeof createApiClient>) {
  return {
    /** POST /api/posts — create a new post (auth required) */
    create: (body: CreatePostBody) => client.post<Post>('/api/posts', body),
    /** POST /api/likes — toggle like on a post (auth required) */
    toggleLike: (postId: string) =>
      client.post<{ liked: boolean; likeCount: number }>('/api/likes', { postId }),
  };
}

export type PostsApi = ReturnType<typeof createPostsApi>;
