// SportSphere — Application Constants
// Non-data constants only. User/match data lives in the database (prisma/seed.ts)
// and is served through API routes (/api/*)

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
] as const;

export const SPORTS_LIST = [
  'Football', 'Basketball', 'Tennis', 'Cricket', 'Rugby',
  'Boxing', 'MMA', 'F1', 'Athletics', 'Swimming',
  'Golf', 'Baseball', 'Volleyball', 'Handball', 'Cycling',
] as const;

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export type Sport = typeof SPORTS_LIST[number];
