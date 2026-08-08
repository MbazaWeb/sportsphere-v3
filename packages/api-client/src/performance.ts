import type {
  PerformanceProfile,
  PerformanceEvent,
  PerformancePointTransaction,
} from '@sportsphere/types/performance.js';
import { createApiClient } from './index.js';

export function createPerformanceApi(client: ReturnType<typeof createApiClient>) {
  return {
    getProfile:    (userId: string) =>
      client.get<{ profile: PerformanceProfile; recentEvents: PerformanceEvent[]; recentTransactions: PerformancePointTransaction[] }>(
        `/api/performance/${userId}`,
      ),
    getEvents:     (userId: string) =>
      client.get<{ events: PerformanceEvent[] }>(`/api/performance/${userId}/events`),
    getTransactions: (userId: string, limit = 20) =>
      client.get<{ transactions: PerformancePointTransaction[] }>(
        `/api/performance/${userId}/transactions?limit=${limit}`,
      ),
  };
}

export type PerformanceApi = ReturnType<typeof createPerformanceApi>;
