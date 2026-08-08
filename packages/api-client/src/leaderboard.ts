import type { RankingEntry } from '@sportsphere/types/performance.js';
import type { RankingCategory, RankingScope } from '@sportsphere/types/ranking.js';
import { createApiClient } from './index.js';

export function createLeaderboardApi(client: ReturnType<typeof createApiClient>) {
  return {
    list: (params: { category: RankingCategory; scope?: RankingScope; limit?: number }) => {
      const search = new URLSearchParams();
      search.set('category', params.category);
      if (params.scope) search.set('scope', params.scope);
      if (params.limit) search.set('limit', String(params.limit));
      return client.get<{ entries: RankingEntry[]; updatedAt: string }>(
        `/api/leaderboard?${search.toString()}`,
      );
    },
  };
}

export type LeaderboardApi = ReturnType<typeof createLeaderboardApi>;
