// SportSphere — Store bridge
// Mock data lives in prisma/seed.ts and API routes, not here.

export { useAuthStore } from './authStore';
export { useNavigationStore } from './navigationStore';
export { useUIStore } from './uiStore';
export type { UserProfile, ProfileTypeId } from './authStore';
export type { TabId, HomeSubTab, ScoresSubTab, ActivitySubTab } from './navigationStore';
export type { MockUserData } from './uiStore';

export const ADVANCED_ROLES = [
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

export const SPORTS_LIST = [
  'Football','Basketball','Tennis','Cricket','Rugby',
  'Boxing','MMA','F1','Athletics','Swimming',
  'Golf','Baseball','Volleyball','Handball','Cycling',
];

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ─── Unified selector hook (legacy surface) ────────────────────
import { useAuthStore } from './authStore';
import { useNavigationStore } from './navigationStore';
import { useUIStore } from './uiStore';

type S =
  ReturnType<typeof useAuthStore.getState> &
  ReturnType<typeof useNavigationStore.getState> &
  ReturnType<typeof useUIStore.getState>;

export function useAppStore<T>(selector: (state: S) => T): T {
  const auth = useAuthStore();
  const nav  = useNavigationStore();
  const ui   = useUIStore();
  return selector({ ...auth, ...nav, ...ui } as S);
}
