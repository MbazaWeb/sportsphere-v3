// SportSphere — Feed User Type
// Shared type used by uiStore for viewingUser. This is the minimal type needed.

export interface FeedUser {
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
  coverGradient: string;
  bio: string;
  role: string;
  location: string;
  joined: string;
  followers: number;
  following: number;
  posts: number;
  isFollowing: boolean;
}
