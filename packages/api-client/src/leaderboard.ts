import type { PublicUser } from '@sportsphere/types/auth';
import { createApiClient } from './index';

/**
 * Leaderboard API
 * ---------------
 * Server returns an array of entries directly (not wrapped in {entries}).
 * Each entry is the public user shape + performance fields.
 *
 * Query params:
 *   - role: 'player' | 'coach' | 'team' (filter)
 *   - position: 'GK' | 'DEF' | 'MID' | 'FWD' (player position)
 *   - playerType: 'Professional' | 'Amateur'
 *   - dimension: 'overall' | 'form' | 'season' | 'career' | 'improvement' | 'consistency'
 *   - limit: 1-50
 */
export interface LeaderboardEntry extends PublicUser {
  rank: number;
  points: number;
  performanceScore: number;
  tier: string;
  formScore: number;
  consistencyScore: number;
  improvementScore: number;
  rankMovement: number;
  categoryBucket: string;
  position: string | null;
  playerType: string | null;
  lastEventAt: string | null;
}

export type LeaderboardDimension =
  | 'overall'
  | 'form'
  | 'season'
  | 'career'
  | 'improvement'
  | 'consistency';

export function createLeaderboardApi(client: ReturnType<typeof createApiClient>) {
  return {
    list: (params: {
      role?: string;
      position?: string;
      playerType?: string;
      dimension?: LeaderboardDimension;
      limit?: number;
    } = {}) => {
      const search = new URLSearchParams();
      if (params.role)       search.set('role', params.role);
      if (params.position)   search.set('position', params.position);
      if (params.playerType) search.set('playerType', params.playerType);
      if (params.dimension)  search.set('dimension', params.dimension);
      if (params.limit)      search.set('limit', String(params.limit));
      return client.get<LeaderboardEntry[]>(`/api/leaderboard?${search.toString()}`);
    },
  };
}

export type LeaderboardApi = ReturnType<typeof createLeaderboardApi>;
