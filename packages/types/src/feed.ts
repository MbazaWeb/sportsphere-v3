/**
 * Feed + content shared types
 */

export type PostType = 'POST' | 'PREDICTION' | 'POLL' | 'HIGHLIGHT';

export interface PostAuthor {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl?: string | null;
  role: string;
  isVerified: boolean;
  isPro: boolean;
}

export interface PostMedia {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  durationSec?: number;
}

export interface Post {
  id: string;
  author: PostAuthor;
  type: PostType;
  content?: string;
  media: PostMedia[];
  createdAt: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  // Type-specific payloads
  prediction?: PredictionPayload;
  poll?: PollPayload;
}

export interface PredictionPayload {
  matchId: string;
  matchLabel: string;
  predictedScoreHome: number;
  predictedScoreAway: number;
  confidence: number;          // 0-1
  result: 'PENDING' | 'CORRECT' | 'INCORRECT' | 'PARTIAL';
  pointsAwarded?: number;
}

export interface PollPayload {
  question: string;
  options: PollOption[];
  totalVotes: number;
  votedOptionId?: string;
  expiresAt?: string;
}

export interface PollOption {
  id: string;
  label: string;
  voteCount: number;
  votePercentage: number;       // 0-100
}

export interface Comment {
  id: string;
  postId: string;
  author: PostAuthor;
  content: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  parentId?: string | null;     // for threaded replies
}

export interface FeedFilters {
  type?: PostType;
  sport?: string;
  cursor?: string;
  limit?: number;
}
