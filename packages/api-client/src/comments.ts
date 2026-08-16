import type { PublicUser } from '@sportsphere/types/auth';
import { createApiClient } from './index';

/**
 * Comments API
 * ------------
 */
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  likeCount: number;
  mentionedUserIds: string[];
  createdAt: string;
  user: PublicUser;
  replies: Comment[];
  viewerLiked?: boolean;
}

export interface CreateCommentBody {
  postId: string;
  content: string;
  parentId?: string | null;
  mentionedUserIds?: string[];
}

export function createCommentsApi(client: ReturnType<typeof createApiClient>) {
  return {
    /** GET /api/comments — list comments for a post */
    list: (postId: string) =>
      client.get<Comment[]>(`/api/comments?postId=${postId}`),

    /** POST /api/comments — create a comment or reply */
    create: (body: CreateCommentBody) =>
      client.post<Comment>('/api/comments', body),

    /** POST /api/comments/like — toggle like on a comment */
    toggleLike: (commentId: string) =>
      client.post<{ liked: boolean; likeCount: number }>('/api/comments/like', { commentId }),
  };
}

export type CommentsApi = ReturnType<typeof createCommentsApi>;
