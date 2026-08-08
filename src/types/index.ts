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
  emailVerified?: boolean;
  bio: string;
  sportsFollowing: string[];
  registeredAt: string;
  roleData: Record<string, string>;
  roleId?: string;
  roleTypeId?: string;
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

// API user shape — matches DB User model output from /api/users and /api/feed
export interface ApiUser {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string | null;
  avatarInitials: string | null;
  isVerified: boolean;
  emailVerified?: boolean;
  coverGradient: string;
  bio: string | null;
  role: string;
  location: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
  registeredAt: string;
  verificationStatus: string;
  roleId?: string;
  roleTypeId?: string;
}

// ViewingUser — used by uiStore when opening a profile overlay
// Maps from ApiUser shape for display. `avatar` may be a URL (rendered as <img>)
// or a 2-letter initial string (rendered as text).
export interface ViewingUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;       // avatarUrl OR avatarInitials (caller decides how to render)
  avatarUrl?: string | null; // raw URL when available, for <img src>
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
// Preserves avatarUrl when present so callers can render a real <img>;
// falls back to initials (and then to the first 2 letters of the name) for
// the text-avatar path.
export function apiUserToViewing(u: ApiUser, isFollowing = false): ViewingUser {
  const fallback = u.avatarInitials || (u.name ? u.name.slice(0, 2).toUpperCase() : '??');
  return {
    id: u.id,
    name: u.name,
    handle: u.handle,
    avatar: u.avatarUrl || fallback,
    avatarUrl: u.avatarUrl || null,
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
