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
