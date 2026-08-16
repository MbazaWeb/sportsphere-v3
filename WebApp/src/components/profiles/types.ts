export interface ApiUser {
  id: string;
  name: string;
  handle: string;
  avatarInitials: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  isPro?: boolean;
  proSince?: string | null;
  coverGradient: string;
  bio: string;
  role: string;
  location: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
  registeredAt: string;
  countryOfOrigin?: string | null;
  city?: string | null;
  aboutMe?: string | null;
  roleProfile?: Record<string, unknown>;
  roleData?: Record<string, unknown>;
  verificationStatus: string;
}

export interface ApiPost {
  id: string;
  userId: string;
  content: string;
  postType: string;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  shareCount: string;
  createdAt: string;
}
