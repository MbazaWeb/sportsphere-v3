import { createApiClient } from './index';

/**
 * Performance API
 * ---------------
 * Server returns an object with: user, profile, events, transactions, snapshots, categorySize, percentile.
 */
export type PerformanceTier =
  | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Elite' | 'Unranked';

export interface PerformanceProfile {
  id: string;
  userId: string;
  performanceScore: number;
  totalPoints: number;
  tier: PerformanceTier | string;
  formScore: number;
  consistencyScore: number;
  improvementScore: number;
  rankGlobal: number;
  rankCategory: number;
  rankForm: number;
  rankSeason: number;
  rankCareer: number;
  rankImprovement: number;
  rankConsistency: number;
  rankMovement: number;
  categoryBucket: string;
  position: string | null;
  playerType: string | null;
  lastEventAt: string | null;
  updatedAt: string;
}

export interface PerformanceEvent {
  id: string;
  userId: string;
  eventType: string;
  matchId?: string | null;
  description: string;
  pointsDelta: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  eventDate: string;
  createdAt: string;
}

export interface PerformancePointTransaction {
  id: string;
  userId: string;
  eventType: string;
  pointsDelta: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface PerformanceResponse {
  user: {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string | null;
    role: string;
    position: string | null;
    playerType: string | null;
    country: string | null;
  };
  profile: PerformanceProfile | null;
  events: PerformanceEvent[];
  transactions: PerformancePointTransaction[];
  snapshots: unknown[];
  categorySize: number;
  percentile: number | null;
}

export function createPerformanceApi(client: ReturnType<typeof createApiClient>) {
  return {
    /** GET /api/performance/[userId] — full performance card data */
    getProfile: (userId: string) =>
      client.get<PerformanceResponse>(`/api/performance/${userId}`),
    /** Optional: force a recompute (admin/debug only — heavy) */
    recalcProfile: (userId: string) =>
      client.get<PerformanceResponse>(`/api/performance/${userId}?recalc=1`),
  };
}

export type PerformanceApi = ReturnType<typeof createPerformanceApi>;
