// ============================================================
// SportSphere — Shared Domain Types
// Single source of truth. Import from here, not from store.
// ============================================================

export type TabId = 'home' | 'scores' | 'create' | 'activity' | 'profile';
export type HomeSubTab = 'for-you' | 'trending' | 'spotlight';
export type ScoresSubTab = 'live' | 'today' | 'upcoming' | 'results' | 'standings';
export type ActivitySubTab = 'all' | 'social' | 'sports' | 'messages';

export type RegistrationStep = 'choose' | 'simple' | 'advanced-role' | 'advanced-form' | 'complete';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export type ProfileTypeId =
  | 'team'
  | 'competition'
  | 'match'
  | 'player'
  | 'coach'
  | 'stadium'
  | 'venue'
  | 'academy'
  | 'community'
  | 'organization'
  | 'business'
  | 'journalist'
  | 'analyst'
  | 'creator'
  | 'scout'
  | 'referee'
  | 'fan';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatar: string;
  role: ProfileTypeId;
  verificationStatus: VerificationStatus;
  bio: string;
  sportsFollowing: string[];
  registeredAt: string;
  roleData: Record<string, string>;
}

export interface MockUserData {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  role: string;
  location: string;
  joined: string;
  followers: number;
  following: number;
  posts: number;
  isVerified: boolean;
  isFollowing: boolean;
  coverGradient: string;
}

// API user shape — matches DB User model output from /api/users
export interface ApiUser {
  id: string;
  name: string;
  handle: string;
  avatarInitials: string;
  isVerified: boolean;
  coverGradient: string;
  bio: string;
  role: string;
  location: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  registeredAt: string;
  verificationStatus: string;
}

// ViewingUser — used by uiStore when opening a profile overlay
// Maps from ApiUser shape for display
export interface ViewingUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;       // avatarInitials
  verified: boolean;    // isVerified
  coverGradient: string;
  bio: string;
  role: string;
  location: string;
  joined: string;       // registeredAt formatted
  followers: number;    // followerCount
  following: number;    // followingCount
  posts: number;        // postCount
  isFollowing: boolean; // local state — not in DB yet
}

// Helper to map ApiUser → ViewingUser
export function apiUserToViewing(u: ApiUser, isFollowing = false): ViewingUser {
  return {
    id: u.id,
    name: u.name,
    handle: u.handle,
    avatar: u.avatarInitials || u.name.slice(0, 2).toUpperCase(),
    verified: u.isVerified,
    coverGradient: u.coverGradient || 'from-emerald-600 to-emerald-900',
    bio: u.bio || '',
    role: u.role || 'fan',
    location: u.location || '',
    joined: u.registeredAt ? new Date(u.registeredAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
    followers: u.followerCount || 0,
    following: u.followingCount || 0,
    posts: u.postCount || 0,
    isFollowing,
  };
}
