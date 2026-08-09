/**
 * User + Profile shared types
 * Mirrors Prisma User model + typed role profiles
 */

import type { UserRole } from './auth';

export interface BaseUser {
  id: string;
  email: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  role: UserRole;
  isPro: boolean;
  isVerified: boolean;
  createdAt: string;
}

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface PlayerProfile {
  userId: string;
  position: PlayerPosition;
  shirtNumber?: number | null;
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH' | null;
  heightCm?: number | null;
  weightKg?: number | null;
  nationality?: string | null;
  currentClubId?: string | null;
  currentClubName?: string | null;
  marketValue?: number | null;
}

export interface CoachProfile {
  userId: string;
  specialization?: string | null;
  licenses?: string[];
  currentTeamId?: string | null;
  currentTeamName?: string | null;
  preferredFormation?: string | null;
}

export interface TeamProfile {
  teamId: string;
  name: string;
  shortName?: string;
  foundedYear?: number | null;
  stadium?: string | null;
  city?: string | null;
  country?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
}

export type ProfileKind =
  | 'player'
  | 'coach'
  | 'team'
  | 'agent'
  | 'scout'
  | 'journalist'
  | 'analyst'
  | 'academy'
  | 'commentator'
  | 'creator'
  | 'venue'
  | 'league'
  | 'competition'
  | 'organization'
  | 'business'
  | 'community'
  | 'commercial-partner';

export interface ProfileTabConfig {
  id: string;
  label: string;
  icon?: string;
}

export interface ProfileConfig {
  kind: ProfileKind;
  label: string;
  tabs: ProfileTabConfig[];
}
