/**
 * Match types — shared between MatchCard and ScoresTab
 * Re-exported so we don't duplicate.
 */

export interface MatchEvent {
  type: string;
  minute?: number;
  team?: 'home' | 'away';
  player?: string;
  playerName?: string;
  assistBy?: string;
  score?: string;
}

export interface Match {
  id: string;
  league: string;
  continent?: string;
  country?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: 'upcoming' | 'live' | 'finished' | 'postponed' | 'cancelled';
  minute?: number | null;
  venue?: string;
  kickoffAt: string;
  events?: MatchEvent[];
  homeLogo?: string;
  awayLogo?: string;
}

export interface Standing {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  logo?: string;
}

export interface StandingsResponse {
  league: string;
  standings: Standing[];
}

export type MatchStatus = 'live' | 'today' | 'upcoming' | 'results' | 'standings';

export const POPULAR_LEAGUES = [
  'English Premier League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'Champions League',
  'Europa League',
  'Conference League',
  'FA Cup',
  'Carabao Cup',
  'Copa del Rey',
  'Coppa Italia',
  'DFB Pokal',
] as const;
