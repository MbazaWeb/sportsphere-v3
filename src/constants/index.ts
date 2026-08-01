// ============================================================
// SportSphere — Application Constants
// Not state. Not components. Pure data that never changes.
// ============================================================

import type { ProfileTypeId, MockUserData } from '@/types';

// ─── Role Definitions ──────────────────────────────────────
export const ADVANCED_ROLES: {
  id: ProfileTypeId;
  label: string;
  description: string;
}[] = [
  { id: 'team',         label: 'Team',         description: 'Register a sports team or club' },
  { id: 'player',       label: 'Player',       description: 'Register as a professional player' },
  { id: 'coach',        label: 'Coach',        description: 'Register as a coach or manager' },
  { id: 'referee',      label: 'Referee',      description: 'Register as a match official' },
  { id: 'journalist',   label: 'Journalist',   description: 'Register as a sports journalist' },
  { id: 'analyst',      label: 'Analyst',      description: 'Register as a sports analyst' },
  { id: 'creator',      label: 'Creator',      description: 'Register as a content creator' },
  { id: 'scout',        label: 'Scout',        description: 'Register as a talent scout' },
  { id: 'stadium',      label: 'Stadium',      description: 'Register a stadium or arena' },
  { id: 'academy',      label: 'Academy',      description: 'Register a sports academy' },
  { id: 'community',    label: 'Community',    description: 'Register a fan community' },
  { id: 'organization', label: 'Organization', description: 'Register a sports organization' },
  { id: 'business',     label: 'Business',     description: 'Register a sports business' },
];

// ─── Sports List ───────────────────────────────────────────
export const SPORTS_LIST = [
  'Football', 'Basketball', 'Tennis', 'Cricket', 'Rugby',
  'Boxing', 'MMA', 'F1', 'Athletics', 'Swimming',
  'Golf', 'Baseball', 'Volleyball', 'Handball', 'Cycling',
] as const;

export type Sport = typeof SPORTS_LIST[number];

// ─── Mock Users ────────────────────────────────────────────
// Temporary: will be replaced by API calls to /api/v1/users
export const MOCK_USERS: Record<string, MockUserData> = {
  '@davidmbaza': {
    id: 'u1', name: 'David Mbaza', handle: '@davidmbaza', avatar: 'DM',
    bio: 'Football is life. Man Utd till I die. Predictions guru.',
    role: 'Sports Fan', location: 'Kampala, Uganda', joined: 'Jan 2024',
    followers: 1200, following: 345, posts: 52, isVerified: false, isFollowing: true,
    coverGradient: 'from-red-600 via-red-500 to-red-800',
  },
  '@sportsphere': {
    id: 'u2', name: 'SportSphere Official', handle: '@sportsphere', avatar: 'SS',
    bio: 'The official SportSphere account. Breaking news, features, and updates from the world of sports.',
    role: 'Official Account', location: 'London, UK', joined: 'Dec 2023',
    followers: 4580000, following: 120, posts: 2340, isVerified: true, isFollowing: false,
    coverGradient: 'from-emerald-600 via-green-500 to-emerald-900',
  },
  '@sarahchen': {
    id: 'u3', name: 'Sarah Chen', handle: '@sarahchen', avatar: 'SC',
    bio: 'Arsenal season ticket holder. Football photographer. Match day vlogs every week.',
    role: 'Creator', location: 'London, UK', joined: 'Mar 2024',
    followers: 34500, following: 412, posts: 189, isVerified: true, isFollowing: false,
    coverGradient: 'from-pink-600 via-violet-500 to-purple-900',
  },
  '@footballdaily': {
    id: 'u4', name: 'Football Daily', handle: '@footballdaily', avatar: 'FD',
    bio: 'Your daily dose of football news, transfers, and analysis.',
    role: 'Journalist', location: 'Manchester, UK', joined: 'Feb 2024',
    followers: 1200000, following: 89, posts: 3450, isVerified: true, isFollowing: false,
    coverGradient: 'from-teal-600 via-cyan-500 to-teal-900',
  },
  '@marcusj': {
    id: 'u5', name: 'Marcus Johnson', handle: '@marcusj', avatar: 'MJ',
    bio: 'Premier League obsessed. Stats nerd. Occasional hot takes.',
    role: 'Sports Fan', location: 'Lagos, Nigeria', joined: 'Apr 2024',
    followers: 8900, following: 567, posts: 234, isVerified: false, isFollowing: true,
    coverGradient: 'from-blue-600 via-indigo-500 to-blue-900',
  },
  '@goalsdaily': {
    id: 'u6', name: 'Goal Highlights HD', handle: '@goalsdaily', avatar: 'GH',
    bio: 'Every goal, every game, every highlight. 4K quality.',
    role: 'Creator', location: 'Dubai, UAE', joined: 'Jan 2024',
    followers: 2100000, following: 45, posts: 3800, isVerified: true, isFollowing: false,
    coverGradient: 'from-yellow-600 via-amber-500 to-orange-800',
  },
  '@skillzhd': {
    id: 'u7', name: 'Skillz HD', handle: '@skillzhd', avatar: 'SH',
    bio: 'Skills compilation channel. Dribbling, free kicks, and tricks.',
    role: 'Creator', location: 'Madrid, Spain', joined: 'Feb 2024',
    followers: 890000, following: 23, posts: 1200, isVerified: true, isFollowing: false,
    coverGradient: 'from-purple-600 via-violet-500 to-purple-900',
  },
  '@goonercam': {
    id: 'u8', name: 'Gooner Cam', handle: '@goonercam', avatar: 'GC',
    bio: 'Arsenal match reactions and fan POV content.',
    role: 'Creator', location: 'London, UK', joined: 'May 2024',
    followers: 145000, following: 67, posts: 456, isVerified: false, isFollowing: false,
    coverGradient: 'from-red-600 via-rose-500 to-red-900',
  },
  '@gkunion': {
    id: 'u9', name: 'GK Union', handle: '@gkunion', avatar: 'GU',
    bio: 'The goalkeeper community. Saves, tips, and training drills.',
    role: 'Community', location: 'Global', joined: 'Mar 2024',
    followers: 67800, following: 234, posts: 890, isVerified: true, isFollowing: false,
    coverGradient: 'from-lime-600 via-green-500 to-emerald-800',
  },
  '@techniqueking': {
    id: 'u10', name: 'Technique King', handle: '@techniqueking', avatar: 'TK',
    bio: 'Football technique breakdowns and tutorials.',
    role: 'Analyst', location: 'Paris, France', joined: 'Jun 2024',
    followers: 234000, following: 89, posts: 567, isVerified: true, isFollowing: false,
    coverGradient: 'from-sky-600 via-cyan-500 to-blue-900',
  },
  '@laligahd': {
    id: 'u11', name: 'LaLiga HD', handle: '@laligahd', avatar: 'LH',
    bio: 'Official LaLiga highlights and match coverage.',
    role: 'Creator', location: 'Barcelona, Spain', joined: 'Jan 2024',
    followers: 3400000, following: 34, posts: 2100, isVerified: true, isFollowing: false,
    coverGradient: 'from-orange-600 via-red-500 to-red-900',
  },
};

export function getMockUser(handle: string): MockUserData | undefined {
  return MOCK_USERS[handle];
}

// ─── Formatting Utilities ──────────────────────────────────
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
