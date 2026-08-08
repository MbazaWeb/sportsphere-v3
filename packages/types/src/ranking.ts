/**
 * Ranking + leaderboard shared types
 */

import type { PerformanceTier } from './performance.js';
import type { PlayerPosition } from './user.js';

export type RankingCategory =
  | 'OVERALL'
  | 'FORM'
  | 'IMPROVEMENT'
  | 'CONSISTENCY';

export type RankingScope =
  | 'GLOBAL'
  | `POSITION:${PlayerPosition}`
  | `COUNTRY:${string}`
  | `ROLE:${string}`;

export interface RankingHistoryPoint {
  date: string;
  rank: number;
  points: number;
}

export interface LeaderboardFilters {
  category: RankingCategory;
  scope: RankingScope;
  limit?: number;
  cursor?: string;
}
