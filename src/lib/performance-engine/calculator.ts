// ─── Performance Calculator ───────────────────────────────────────
//
// The core engine. Pure functions only — no DB, no Prisma. The
// persistence layer (recalcProfile, leaderboards, decay runner) lives
// in `persistence.ts` and CALLS these pure functions.
//
// Pipeline (per user's spec §13):
//   Raw KPI → position-specific weighting → league normalization
//           → difficulty adjustment → consistency factor
//           → recent form factor → performance points
//           → performance score → ranking
//
// Decay model (per user's correction at end of message):
//   * Poor performance      → score reduction (NOT blanket point deduction)
//   * Verified inactivity   → controlled decay (small daily decay)
//   * Injury / suspension   → little or no decay (status-driven pause)
//   * Strong performance    → meaningful gain (full credit + bonus)
//   * Consistent performance→ multiplier / bonus (consistencyFactor > 1.0)
//   * Improvement           → separate improvement ranking (not a multiplier)

import type {
  ComputedPerformance, ConsistencyInput, DecayInput, FormWindow,
  ImprovementOpportunity, KPIReading, KpiBreakdownRow, NextMilestone,
  TrendResult, PositionGroup, TierMeta,
} from './types';
import { getWeightTable, normalize } from './kpi-weights';
import { MIDFIELD_SUBROLE_ADJUSTMENTS } from './positions';
import { tierForScore } from './tiers';

// ────────────────────────────────────────────────────────────────
// 1. Weighted KPI Score (0–100)
// ────────────────────────────────────────────────────────────────
//
// For each KPI in the position's weight table:
//   normalizedScore = normalize(rawValue, key)  // 0..100
//   contribution    = normalizedScore * weight  // weighted share
//
// Sub-role adjustments (CDM/CAM/RW/LW) multiply the weight per category.
// Returns the SUM of weighted contributions (also 0..100 by construction
// since weights sum to ~1.0).

interface WeightedKpiResult {
  score: number;                 // 0..100
  breakdown: KpiBreakdownRow[];
}

export function computeWeightedKpiScore(
  group: PositionGroup,
  position: string | null | undefined,
  readings: KPIReading[],
  // Optional overrides from KPIConfiguration / KPIWeight tables (admin):
  overrides?: Record<string, { weight?: number; pointsPerUnit?: number }>,
): WeightedKpiResult {
  const table = getWeightTable(group);
  const subAdj = group === 'MID'
    ? MIDFIELD_SUBROLE_ADJUSTMENTS[(position ?? '').trim().toUpperCase()]
    : undefined;

  const breakdown: KpiBreakdownRow[] = [];
  let score = 0;
  let weightSum = 0;

  for (const w of table.weights) {
    // Apply sub-role adjustment for MID category weights
    let weight = w.weight;
    if (subAdj) {
      const cat = categorizeKpi(w.key);
      if (cat === 'attacking')   weight *= subAdj.attacking;
      else if (cat === 'creativity') weight *= subAdj.creativity;
      else if (cat === 'defensive')  weight *= subAdj.defensive;
    }
    // Apply admin overrides
    if (overrides?.[w.key]?.weight !== undefined) weight = overrides[w.key]!.weight!;
    if (overrides?.[w.key]?.pointsPerUnit !== undefined) {
      // pointsPerUnit override doesn't change weight
    }

    const reading = readings.find((r) => r.key === w.key);
    const rawValue = reading?.value ?? 0;
    const normScore = normalize(rawValue, w.key);

    // Signed contribution: positive KPIs add; negative KPIs (yellows, reds,
    // errors, goalsConceded) subtract from score.
    const isNegative = (w.negativePerUnit ?? 0) !== 0;
    const contribution = isNegative
      ? -Math.min(100, normScore) * weight * 0.5  // penalty KPIs cap at -50% of weight
      : normScore * weight;

    score += contribution;
    weightSum += weight;

    breakdown.push({
      key: w.key,
      label: w.label,
      value: rawValue,
      rawValue: formatRawValue(rawValue, w.key),
      category: categorizeKpi(w.key),
      weight,
      contribution: Math.round(contribution * 10) / 10,
      normalizedScore: Math.round(normScore * 10) / 10,
    });
  }

  // Normalize to 0..100 in case weights drifted off 1.0 due to overrides
  const finalScore = weightSum > 0 ? (score / weightSum) * 1.0 : 0;

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    breakdown: breakdown.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
  };
}

function categorizeKpi(key: string): KPIReading['category'] {
  switch (key) {
    case 'goals': case 'shotsOnTarget': case 'conversionRate':
      return 'attacking';
    case 'assists': case 'chancesCreated': case 'keyPasses': case 'passAccuracy':
      return 'creativity';
    case 'tackles': case 'interceptions': case 'duelsWon': case 'aerialDuels':
      return 'defensive';
    case 'saves': case 'savePct': case 'cleanSheets': case 'penaltiesSaved':
    case 'goalsConceded':
      return 'gk';
    case 'yellowCards': case 'redCards':
      return 'discipline';
    case 'appearances': case 'rating': case 'motm':
      return 'fitness';
    case 'wins': case 'draws': case 'losses': case 'matchesManaged':
    case 'pointsPerGame': case 'trophiesWon': case 'goalDifference':
      return 'record';
    case 'points': case 'goalsFor': case 'goalsAgainst': case 'matchesPlayed': case 'form':
      return 'team-performance';
    default:
      return 'fitness';
  }
}

function formatRawValue(value: number, key: string): string {
  if (key === 'savePct' || key === 'passAccuracy' || key === 'conversionRate' ||
      key === 'duelsWon' || key === 'aerialDuels' || key === 'form') {
    return `${value.toFixed(1)}%`;
  }
  if (key === 'rating') return value.toFixed(2);
  if (key === 'pointsPerGame') return value.toFixed(2);
  return String(Math.round(value));
}

// ────────────────────────────────────────────────────────────────
// 2. Consistency Factor
// ────────────────────────────────────────────────────────────────
//
// Computes the inverse of match-score variability. A player who scores
// [82, 79, 85, 88, 91, 80, 84, 86, 83, 87] is more consistent than
// one who scores [95, 50, 88, 30, 92, 75, 20, 90, 60, 85].
//
// Returns a multiplier in [0.7 .. 1.15]:
//   - Very consistent (low std-dev) → 1.15 (BONUS, per user's spec)
//   - Average                        → 1.00 (neutral)
//   - Highly inconsistent            → 0.70 (penalty, NOT point deduction)
//
// Note: this is a SCORE multiplier, not a point deduction. Inconsistent
// players simply get a lower score from the same raw KPIs — they don't
// lose previously-earned points. This matches the user's correction.

export function computeConsistency(input: ConsistencyInput): {
  factor: number; score: number;
} {
  const { matchScores, seasonAverage } = input;
  if (!matchScores.length) {
    return { factor: 0.7, score: 0 };
  }

  const mean = matchScores.reduce((s, v) => s + v, 0) / matchScores.length;
  const variance = matchScores.reduce((s, v) => s + (v - mean) ** 2, 0) / matchScores.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (lower = more consistent)
  const cv = mean > 0 ? stdDev / mean : 1;

  // Consistency score (0..100): cv=0 → 100, cv=0.3 → 50, cv=0.6 → 0
  const consistencyScore = Math.max(0, Math.min(100, 100 * (1 - cv / 0.6)));

  // Factor: cv=0 → 1.15 (bonus), cv=0.3 → 1.0 (neutral), cv=0.6 → 0.7 (penalty)
  const factor = Math.max(0.7, Math.min(1.15, 1.15 - (cv / 0.6) * 0.45));

  // Also factor in season average vs matchScores mean (detect "recent form collapse"):
  // If recent matchScores average is much lower than season average, dampen factor.
  const recentVsSeason = seasonAverage > 0 ? mean / seasonAverage : 1;
  const adjustedFactor = factor * Math.max(0.85, Math.min(1.05, recentVsSeason));

  return {
    factor: Math.round(adjustedFactor * 100) / 100,
    score: Math.round(consistencyScore * 10) / 10,
  };
}

// ────────────────────────────────────────────────────────────────
// 3. Recent Form Factor
// ────────────────────────────────────────────────────────────────
//
// Form is computed from the last 5 match scores. A player on a hot
// streak gets up to +20% bonus; a player in a slump gets up to -20%.
//
// The factor is a multiplier in [0.80 .. 1.20].
// It is NOT a point deduction — slumping players just get a lower
// score from the same KPIs, and they recover automatically when form
// returns. This matches the user's correction.

export function computeRecentForm(form: FormWindow): {
  factor: number; score: number; trend: TrendResult;
} {
  const scores = form.matchScores.slice(-form.windowSize);
  if (!scores.length) {
    return {
      factor: 0.85, score: 0,
      trend: { direction: 'stable', deltaPct: 0, label: 'No matches yet' },
    };
  }

  const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
  const formScore = Math.max(0, Math.min(100, avg));

  // Factor: formScore=90 → 1.20, formScore=50 → 1.0, formScore=10 → 0.80
  const factor = Math.max(0.80, Math.min(1.20, 0.80 + (formScore / 100) * 0.40));

  // Trend: compare last 3 vs previous 2 (or first half vs second half)
  let trend: TrendResult;
  if (scores.length >= 3) {
    const recent = scores.slice(-3);
    const earlier = scores.slice(0, -3);
    const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
    const earlierAvg = earlier.length > 0
      ? earlier.reduce((s, v) => s + v, 0) / earlier.length
      : recentAvg;
    const deltaPct = earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;
    if (deltaPct > 5) {
      trend = { direction: 'up', deltaPct: Math.round(deltaPct * 10) / 10, label: 'Improving ↑' };
    } else if (deltaPct < -5) {
      trend = { direction: 'down', deltaPct: Math.round(deltaPct * 10) / 10, label: 'Declining ↓' };
    } else {
      trend = { direction: 'stable', deltaPct: Math.round(deltaPct * 10) / 10, label: 'Stable →' };
    }
  } else {
    trend = { direction: 'stable', deltaPct: 0, label: 'Insufficient data' };
  }

  return {
    factor: Math.round(factor * 100) / 100,
    score: Math.round(formScore * 10) / 10,
    trend,
  };
}

// ────────────────────────────────────────────────────────────────
// 4. Competition Difficulty Factor
// ────────────────────────────────────────────────────────────────
//
// Performance against stronger opponents is worth more. The competition
// tier (pro / semi-pro / amateur / youth) and the opponent strength
// both feed in.
//
// Returns a multiplier in [0.85 .. 1.20].
//   - Pro league + top opponent → 1.20
//   - Amateur league + weak opponent → 0.85

export function computeCompetitionFactor(
  competitionTier?: string | null,
  opponentStrength?: number,  // 0..1
  teamStrength?: number,      // 0..1
): number {
  let factor = 1.0;

  // League tier base
  switch ((competitionTier ?? '').toLowerCase()) {
    case 'pro': case 'professional': case 'pro-plus':
      factor = 1.10; break;
    case 'semi-pro': case 'semi-professional':
      factor = 1.00; break;
    case 'amateur':
      factor = 0.92; break;
    case 'youth': case 'academy': case 'u13': case 'u15': case 'u17': case 'u20':
      factor = 0.88; break;
    default:
      factor = 1.00;
  }

  // Opponent difficulty (0..1 → ±0.10 swing)
  if (typeof opponentStrength === 'number') {
    const swing = (opponentStrength - 0.5) * 0.20; // -0.10 .. +0.10
    factor += swing;
  }

  // If team is much weaker than opponent, performance is worth MORE
  // (you're punching above your weight):
  if (typeof teamStrength === 'number' && typeof opponentStrength === 'number') {
    const diff = opponentStrength - teamStrength; // positive = uphill
    factor += diff * 0.10; // ±0.10 swing
  }

  return Math.max(0.85, Math.min(1.20, Math.round(factor * 100) / 100));
}

// ────────────────────────────────────────────────────────────────
// 5. Data Confidence Factor
// ────────────────────────────────────────────────────────────────
//
// Small sample sizes are penalized. A player with 2 matches cannot
// rank above a player with 30 matches at the same KPI levels.
//
// Returns a multiplier in [0.40 .. 1.00].
//   - 0 matches  → 0.40 (still ranked, but heavily dampened)
//   - 5 matches  → 0.65
//   - 10 matches → 0.85
//   - 20+ matches → 1.00

export function computeDataConfidence(matchesPlayed: number): number {
  if (matchesPlayed <= 0) return 0.40;
  if (matchesPlayed >= 20) return 1.00;
  // Linear interpolation 0.40 → 1.00 across 0..20
  const factor = 0.40 + (matchesPlayed / 20) * 0.60;
  return Math.round(factor * 100) / 100;
}

// ────────────────────────────────────────────────────────────────
// 6. Decay Adjustment (user's corrected model)
// ────────────────────────────────────────────────────────────────
//
// Per the user's clarification:
//   - Poor performance      → score reduction (handled by Recent Form factor)
//   - Verified inactivity   → controlled decay (small daily multiplier)
//   - Injury / suspension   → little or no decay (pause)
//   - Strong performance    → meaningful gain (handled by Form factor bonus)
//   - Consistent performance→ multiplier/bonus (handled by Consistency factor)
//   - Improvement           → separate ranking (not a multiplier)
//
// This function returns a multiplicative decay applied to the FINAL
// performance score (not points). The user's TOTAL POINTS only decay
// via the explicit PerformancePointTransaction ledger — never silently.
//
// Returns { multiplier, status }.

export interface DecayResult {
  multiplier: number;       // 0.85..1.00
  status: string;
  daysSinceLastEvent: number;
  notes: string;
}

export function computeDecay(input: DecayInput): DecayResult {
  const { status, daysSinceLastEvent, lastEventAt } = input;
  const days = daysSinceLastEvent;

  // Paused states — NO decay:
  if (status === 'paused-injury') {
    return { multiplier: 1.0, status, daysSinceLastEvent: days,
      notes: 'Decay paused due to injury' };
  }
  if (status === 'paused-suspension') {
    return { multiplier: 1.0, status, daysSinceLastEvent: days,
      notes: 'Decay paused due to suspension' };
  }
  if (status === 'retired') {
    return { multiplier: 1.0, status, daysSinceLastEvent: days,
      notes: 'Retired — score frozen' };
  }
  if (status === 'transferred') {
    return { multiplier: 0.98, status, daysSinceLastEvent: days,
      notes: 'Mild decay during transfer window' };
  }
  if (status === 'offseason') {
    // Reduced decay during offseason
    const decay = Math.min(0.10, days * 0.001); // 0.1% per day, max 10%
    return { multiplier: 1.0 - decay, status, daysSinceLastEvent: days,
      notes: `Offseason decay: -${(decay * 100).toFixed(1)}%` };
  }

  // Active decay (controlled):
  //   - Days 0–14: no decay (grace period)
  //   - Days 15–60: 0.2% per day (slow decay)
  //   - Days 60–180: 0.4% per day (moderate)
  //   - Days 180+: 0.6% per day (sustained inactivity)
  // Maximum cumulative decay capped at 15% — never aggressive.
  if (days <= 14) {
    return { multiplier: 1.0, status: 'active', daysSinceLastEvent: days,
      notes: 'Active — no decay (grace period)' };
  }
  let decay = 0;
  if (days <= 60) decay = (days - 14) * 0.002;
  else if (days <= 180) decay = (60 - 14) * 0.002 + (days - 60) * 0.004;
  else decay = (60 - 14) * 0.002 + (180 - 60) * 0.004 + (days - 180) * 0.006;
  decay = Math.min(0.15, decay); // hard cap at 15%

  return {
    multiplier: Math.round((1.0 - decay) * 1000) / 1000,
    status: days > 14 ? 'decaying' : 'active',
    daysSinceLastEvent: days,
    notes: `Inactivity decay: -${(decay * 100).toFixed(1)}% over ${days} days`,
  };
}

// ────────────────────────────────────────────────────────────────
// 7. Improvement Score (separate ranking, per user's spec)
// ────────────────────────────────────────────────────────────────
//
// Compares current form score vs career/season historical baseline.
// Returns 0..100. Players improving FAST relative to their own past
// get higher scores — this is a SEPARATE ranking dimension, not a
// multiplier on the main score.

export function computeImprovementScore(
  currentFormScore: number,
  seasonAverage: number,
  careerAverage?: number,
): number {
  if (!seasonAverage && !careerAverage) return 50; // neutral
  const baseline = careerAverage && careerAverage > 0
    ? (seasonAverage * 0.5 + careerAverage * 0.5)
    : seasonAverage;
  if (baseline <= 0) return 50;
  const delta = currentFormScore - baseline;
  // delta=0 → 50, delta=+20 → 90, delta=-20 → 10
  const score = 50 + delta * 2;
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

// ────────────────────────────────────────────────────────────────
// 8. Composite Performance Score (per user's spec §17)
// ────────────────────────────────────────────────────────────────
//
//   Performance Score =
//       Weighted KPI Performance
//     × Consistency Factor
//     × Recent Form Factor
//     × Competition Factor
//     × Data Confidence Factor
//     × Decay Multiplier
//
// All factors are multipliers centered on ~1.0, so the final score
// stays in 0..100 (clamped).

export interface ComputeScoreInput {
  group: PositionGroup;
  position: string | null | undefined;
  readings: KPIReading[];
  matchesPlayed: number;
  formWindow: FormWindow;
  consistencyInput: ConsistencyInput;
  competitionTier?: string | null;
  opponentStrength?: number;
  teamStrength?: number;
  decayInput: DecayInput;
  seasonAverage: number;
  careerAverage?: number;
  // Optional admin overrides (from KPIWeight Prisma table):
  kpiOverrides?: Record<string, { weight?: number; pointsPerUnit?: number }>;
}

export function computePerformanceScore(input: ComputeScoreInput): ComputedPerformance {
  // 1. Weighted KPI score
  const kpiResult = computeWeightedKpiScore(
    input.group, input.position, input.readings, input.kpiOverrides,
  );

  // 2. Consistency
  const consistency = computeConsistency(input.consistencyInput);

  // 3. Recent form
  const form = computeRecentForm(input.formWindow);

  // 4. Competition difficulty
  const competition = computeCompetitionFactor(
    input.competitionTier, input.opponentStrength, input.teamStrength,
  );

  // 5. Data confidence
  const confidence = computeDataConfidence(input.matchesPlayed);

  // 6. Decay
  const decay = computeDecay(input.decayInput);

  // 7. Improvement score (separate)
  const improvementScore = computeImprovementScore(
    form.score, input.seasonAverage, input.careerAverage,
  );

  // 8. Composite
  let score = kpiResult.score
    * consistency.factor
    * form.factor
    * competition
    * confidence
    * decay.multiplier;

  score = Math.max(0, Math.min(100, Math.round(score * 10) / 10));

  const tierMeta = tierForScore(score);

  return {
    weightedKpiScore: Math.round(kpiResult.score * 10) / 10,
    consistencyFactor: consistency.factor,
    recentFormFactor: form.factor,
    competitionFactor: competition,
    dataConfidenceFactor: confidence,
    performanceScore: score,
    totalPoints: 0, // set by persistence layer from PointTransaction ledger
    tier: tierMeta.tier,
    tierMeta,
    formScore: form.score,
    consistencyScore: consistency.score,
    improvementScore,
    trend: form.trend,
    kpiBreakdown: kpiResult.breakdown,
    categoryBucket: buildCategoryBucket(input.group, input.competitionTier),
  };
}

// ────────────────────────────────────────────────────────────────
// 9. Category Bucket (for ranking segmentation)
// ────────────────────────────────────────────────────────────────
//
// Builds a stable bucket key like "amateur-GK-tanzania" or
// "pro-FWD-tanzania-premier-league". Users are ranked within their
// bucket — never across incomparable categories (per user's spec §11).

export function buildCategoryBucket(
  group: PositionGroup,
  competitionTier?: string | null,
  country?: string | null,
  region?: string | null,
  competition?: string | null,
  ageGroup?: string | null,
): string {
  const parts: string[] = [group];
  if (competitionTier) parts.push(competitionTier.toLowerCase());
  if (ageGroup && ageGroup !== 'Senior') parts.push(ageGroup.toLowerCase());
  if (country) parts.push(country.toLowerCase());
  if (region) parts.push(region.toLowerCase());
  if (competition) parts.push(competition.toLowerCase().replace(/\s+/g, '-'));
  return parts.filter(Boolean).join('-');
}

// ────────────────────────────────────────────────────────────────
// 10. Improvement Opportunities (per user's spec §23)
// ────────────────────────────────────────────────────────────────
//
// Identifies the weakest KPIs and projects the points gain if the
// user improved them to their peer-group median. The projection is
// clearly labeled as an estimate, not a guarantee.

export function computeImprovementOpportunities(
  breakdown: KpiBreakdownRow[],
  estimatedPointsPerScorePoint: number = 12, // ~12 points per 1-point score gain
): ImprovementOpportunity[] {
  // Focus on positive KPIs only (not yellows/reds — those are different advice)
  const positive = breakdown.filter((b) => b.contribution >= 0 && b.weight > 0);

  // Sort by lowest normalized score (biggest improvement potential)
  const sorted = positive.sort((a, b) => a.normalizedScore - b.normalizedScore);

  return sorted.slice(0, 4).map((b) => {
    const gap = Math.max(0, 75 - b.normalizedScore); // target 75 (decent, not elite)
    const pointsGain = Math.round(gap * b.weight * estimatedPointsPerScorePoint);
    const rankGainEstimate = Math.round(pointsGain / 15); // rough: 15 pts ≈ 1 rank
    return {
      kpi: b.key,
      label: b.label,
      current: b.value,
      potential: Math.round(b.value + (gap / 100) * (b.value || 10)),
      pointsGain,
      rankGainEstimate,
    };
  });
}

// ────────────────────────────────────────────────────────────────
// 11. Next Milestone (per user's spec §24)
// ────────────────────────────────────────────────────────────────
//
// Given the user's current rank and points, find the user directly
// ahead and compute the gap.

export function computeNextMilestone(
  currentRank: number,
  currentPoints: number,
  // Sorted list (highest points first) of peers in the same category bucket:
  peers: Array<{ userId: string; points: number; rank: number }>,
  currentUserPoints: number,
): NextMilestone {
  // Find the user directly ahead (rank-1) in the peers list
  const ahead = peers.find((p) => p.rank === currentRank - 1);
  // Find the user directly behind (rank+1)
  const behind = peers.find((p) => p.rank === currentRank + 1);

  return {
    nextRank: ahead?.rank ?? Math.max(1, currentRank - 1),
    nextPointsTarget: ahead?.points ?? currentPoints + 50,
    pointsBehindNext: ahead ? Math.max(0, ahead.points - currentUserPoints) : 0,
    pointsAheadOfNext: behind ? Math.max(0, currentUserPoints - behind.points) : 0,
  };
}

// ─── Public API ──────────────────────────────────────────────
export type {
  ComputedPerformance, KPIReading, KpiBreakdownRow, TierMeta,
  ImprovementOpportunity, NextMilestone, TrendResult,
};
