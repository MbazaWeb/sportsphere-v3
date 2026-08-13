/**
 * Performance Engine shared types
 * Mirrors src/lib/performance-engine/types.ts
 */

import type { PlayerPosition } from './user';

export type KPIRole = 'PLAYER' | 'COACH' | 'TEAM';

export type KPICategory =
  | 'Attacking'
  | 'Possession'
  | 'Defending'
  | 'Goalkeeping'
  | 'Discipline'
  | 'Set Pieces'
  | 'Results'
  | 'Form'
  | 'Defense'
  | 'Attack';

export type CompetitionTier =
  | 'WORLD_CUP'
  | 'CONTINENTAL'
  | 'DOMESTIC_TOP'
  | 'DOMESTIC_LOWER'
  | 'YOUTH'
  | 'FRIENDLY';

export type EventType = 'MATCH' | 'SEASON' | 'CAREER' | 'TOURNAMENT' | 'TRAINING';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FLAGGED';

export type PerformanceTier =
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND'
  | 'ELITE';

export interface KPIWeight {
  id: string;
  code: string;
  label: string;
  category: KPICategory;
  role: KPIRole;
  position?: PlayerPosition | null;
  weight: number;       // 0-10
  isPositive: boolean;  // true = higher is better
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceMetric {
  id: string;
  eventId: string;
  kpiCode: string;
  kpiLabel: string;
  value: number;
  source: 'MANUAL' | 'API' | 'IMPORTED';
  verified: boolean;
}

export interface PerformanceEvent {
  id: string;
  userId: string;
  type: EventType;
  competition?: string;
  season?: string;
  matchLabel?: string;
  matchDate?: string;
  metrics: PerformanceMetric[];
  verificationStatus: VerificationStatus;
  reviewedBy?: string | null;
  reviewerNotes?: string | null;
  anomalyFlags?: string[];
  submittedAt: string;
  reviewedAt?: string | null;
}

export interface PerformancePointTransaction {
  id: string;
  userId: string;
  eventId: string;
  kpiCode: string;
  points: number;        // signed — negative for penalties
  multiplier: number;
  reason: string;
  createdAt: string;
}

export interface PerformanceProfile {
  userId: string;
  totalPoints: number;
  tier: PerformanceTier;
  tierProgress: number;       // 0-1 toward next tier
  consistencyScore: number;   // 0-1
  formScore: number;          // 0-1
  confidenceLevel: number;    // 0-1
  lastEventDate?: string | null;
  lastCalculationAt?: string | null;
  decayFactor: number;        // 0-1 — applied during inactivity
}

export interface PerformanceSnapshot {
  id: string;
  userId: string;
  date: string;               // ISO date (YYYY-MM-DD)
  totalPoints: number;
  tier: PerformanceTier;
  consistencyScore: number;
  formScore: number;
}

export interface RankingEntry {
  userId: string;
  rank: number;
  totalPoints: number;
  displayName: string;
  handle: string;
  avatarUrl?: string | null;
  role: string;
  position?: PlayerPosition | null;
  tier: PerformanceTier;
  changeFromPrevious?: number | null;  // signed — +N or -N
}

export interface RankingSnapshot {
  id: string;
  category: string;            // e.g. 'OVERALL', 'FORM', 'IMPROVEMENT', 'CONSISTENCY'
  scope: string;               // e.g. 'GLOBAL', 'POSITION:GK', 'COUNTRY:KE'
  entries: RankingEntry[];
  calculatedAt: string;
}
