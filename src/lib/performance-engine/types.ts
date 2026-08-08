// ─── Performance Engine — Shared Types ────────────────────────────
//
// All types used by the calculation engine. No Prisma imports here so
// the engine stays pure / unit-testable.

// ── Position groups ──
// Every PlayerProfile.position maps to exactly one PositionGroup.
// The group decides which KPIs are weighted and how heavily.
export type PositionGroup = 'GK' | 'DEF' | 'MID' | 'FWD' | 'COACH' | 'TEAM';

// ── Player types (drives category segmentation & difficulty) ──
export type PlayerType =
  | 'Professional'
  | 'Semi-Professional'
  | 'Amateur'
  | 'Academy'
  | 'Youth'
  | 'Retired';

// ── Performance tiers (S+ → D) ──
export type Tier = 'S+' | 'S' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'Unranked';

export interface TierMeta {
  tier: Tier;
  label: string;
  minScore: number; // inclusive
  color: string;   // tailwind text-* class
  bg: string;      // tailwind bg-* class
  border: string;  // tailwind border-* class
}

// ── Normalized KPI reading from typed profile ──
// Pulls raw values from PlayerProfile / CoachProfile / TeamProfile.
// `value` is the raw count, `max` is the normalization ceiling
// (per-position — e.g. 30 goals/season for FWD, 12 for MID).
export interface KPIReading {
  key: string;          // 'goals' | 'assists' | 'saves' | ...
  label: string;        // 'Goals'
  value: number;        // raw value (e.g. 18)
  maxValue: number;     // normalization ceiling (e.g. 30)
  category: KpiCategory;
  // Optional sample-size info used for data-confidence:
  matchesPlayed: number;
}

export type KpiCategory =
  | 'attacking'
  | 'creativity'
  | 'defensive'
  | 'gk'
  | 'discipline'
  | 'fitness'
  | 'teamwork'
  | 'form'
  | 'record'        // coach W/D/L
  | 'team-performance'; // team W/D/L

// ── Per-KPI weight (per position) ──
export interface KpiWeight {
  key: string;
  label: string;            // human-readable label
  weight: number;          // 0..1 share of total position weight (sums to 1.0)
  pointsPerUnit: number;   // raw points added per unit of value
  negativePerUnit?: number; // points subtracted per unit (for yellows, reds, errors)
  maxContribution?: number; // cap per match
}

// ── Per-position weight table ──
export interface PositionWeightTable {
  group: PositionGroup;
  weights: KpiWeight[];
}

// ── Recent form (rolling window of match scores) ──
export interface FormWindow {
  matchScores: number[]; // most-recent-last, e.g. [82, 79, 85, 88, 91]
  windowSize: number;    // typically 5
}

// ── Consistency computation inputs ──
export interface ConsistencyInput {
  matchScores: number[];          // last 10–20 match scores
  seasonAverage: number;
  careerAverage?: number;
}

// ── Recent form trend (for trendDirection) ──
export interface TrendResult {
  direction: 'up' | 'down' | 'stable';
  deltaPct: number; // signed
  label: string;    // 'Improving ↑' | 'Declining ↓' | 'Stable →'
}

// ── Decay inputs (per user's correction) ──
// The decay model differentiates between:
//   - Poor performance      → score reduction (NOT blanket point deduction)
//   - Verified inactivity   → controlled decay
//   - Injury / suspension   → little or no decay
//   - Strong performance    → meaningful gain
//   - Consistent performance→ multiplier / bonus
//   - Improvement           → separate improvement ranking
export type DecayStatus =
  | 'active'           // normal — decay applies on inactivity
  | 'decaying'         // currently losing points due to inactivity
  | 'paused-injury'    // little/no decay
  | 'paused-suspension'// little/no decay
  | 'retired'          // no decay, score frozen
  | 'transferred'      // brief pause during transfer window
  | 'offseason';       // reduced decay during competition offseason

export interface DecayInput {
  status: DecayStatus;
  daysSinceLastEvent: number;
  lastEventAt: Date | null;
  pauseReason?: string;
  pausedUntil?: Date | null;
}

// ── Final computed performance ──
export interface ComputedPerformance {
  // Raw sub-scores (0–100):
  weightedKpiScore: number;       // raw weighted KPI performance
  consistencyFactor: number;      // 0.7..1.15 multiplier (1.0 = neutral)
  recentFormFactor: number;       // 0.8..1.20 multiplier (1.0 = neutral)
  competitionFactor: number;      // 0.85..1.20 multiplier (difficulty)
  dataConfidenceFactor: number;   // 0.4..1.0 multiplier (sample size)

  // Final:
  performanceScore: number;       // 0–100 normalized
  totalPoints: number;            // running balance from transactions
  tier: Tier;
  tierMeta: TierMeta;

  // Sub-scores for UI:
  formScore: number;              // 0–100 (last 5)
  consistencyScore: number;       // 0–100
  improvementScore: number;       // 0–100 vs historical baseline
  trend: TrendResult;

  // Breakdown for "explainable" UI:
  kpiBreakdown: KpiBreakdownRow[];

  // Category bucket for ranking segmentation:
  categoryBucket: string;
}

export interface KpiBreakdownRow {
  key: string;
  label: string;
  value: number;
  rawValue: string;     // formatted for display: "18", "78%", "84%"
  category: KpiCategory;
  weight: number;       // applied weight
  contribution: number; // points contributed (signed)
  normalizedScore: number; // 0–100
}

// ── Improvement opportunity (computed by engine) ──
export interface ImprovementOpportunity {
  kpi: string;
  label: string;
  current: number;
  potential: number;     // realistic ceiling for peer group
  pointsGain: number;    // projected points gain if improved to potential
  rankGainEstimate: number; // projected rank improvement
}

// ── Next milestone (for competitive motivation UI) ──
export interface NextMilestone {
  nextRank: number;
  nextPointsTarget: number;
  pointsBehindNext: number;
  pointsAheadOfNext: number;
}

// ── Match-level event input (for verification & point calc) ──
export interface MatchEventInput {
  eventType: string;
  value: number;
  matchId?: string;
  competition?: string;
  competitionTier?: string;
  season?: string;
  opponentName?: string;
  opponentStrength?: number; // 0..1
  teamStrength?: number;     // 0..1
  matchDate: Date;
  source?: string;
}
