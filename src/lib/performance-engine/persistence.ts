// ─── Performance Engine — Persistence Layer ───────────────────────
//
// Prisma-backed functions. The pure calculator (calculator.ts) does
// the math; this file persists results to PerformanceProfile,
// PerformancePointTransaction, PerformanceSnapshot, etc.
//
// Public API:
//   getPerformanceProfile(userId)         → cached current state
//   recalcPerformanceProfile(userId)      → recompute from typed profile + events
//   recordPerformanceEvent(input)         → ingest a verified event, ledger points
//   runDailyDecay()                       → cron: applies controlled decay
//   runDailySnapshot()                    → cron: stores trend snapshots
//   recomputeRankings(categoryBucket)     → cron: re-ranks everyone in a bucket
//
// All point changes go through PerformancePointTransaction — never
// direct UPDATE on PerformanceProfile.totalPoints.

import { db } from '@/lib/db';
import { safeJsonParse } from '@/lib/json';
import { computePerformanceFromTypedProfile } from './adapter';
import { computeDecay, computeImprovementOpportunities } from './calculator';
import { resolvePositionGroup, resolveAgeGroup } from './positions';
import { buildCategoryBucket } from './calculator';
import type { ComputedPerformance } from './types';

// ─── Fetch cached profile ────────────────────────────────────
export async function getPerformanceProfile(userId: string) {
  return db.performanceProfile.findUnique({
    where: { userId },
  });
}

// ─── Fetch cached profile WITH recent activity (for UI) ──────
export async function getPerformanceProfileWithActivity(userId: string) {
  const [profile, events, transactions, snapshots] = await Promise.all([
    db.performanceProfile.findUnique({ where: { userId } }),
    db.performanceEvent.findMany({
      where: { userId },
      orderBy: { matchDate: 'desc' },
      take: 20,
    }),
    db.performancePointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.performanceSnapshot.findMany({
      where: { userId },
      orderBy: { capturedAt: 'desc' },
      take: 30,
    }),
  ]);
  return { profile, events, transactions, snapshots };
}

// ─── Recompute PerformanceProfile for one user ───────────────
//
// Pulls:
//   - the typed profile row (PlayerProfile / CoachProfile / TeamProfile)
//   - the user's basic info (role, country, region, position)
//   - last 20 verified events (for recent form & consistency)
//
// Then calls the pure calculator and persists the result.
// Does NOT compute rank — that's done by recomputeRankings().
export async function recalcPerformanceProfile(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      playerProfile: true, coachProfile: true, teamProfile: true,
      performanceProfile: true,
    },
  });
  if (!user) return;

  // Only players, coaches, teams have performance profiles
  if (!['player', 'coach', 'team'].includes(user.role)) return;

  // Fetch last 20 verified events for form/consistency
  const events = await db.performanceEvent.findMany({
    where: { userId, verificationStatus: 'verified' },
    orderBy: { matchDate: 'desc' },
    take: 20,
  });

  // Reconstruct match scores from event points (simplified: each event's
  // pointsCalculated * 5 = match score for that match; aggregate per matchId).
  const matchScores: number[] = [];
  const matchScoreMap = new Map<string, number>();
  for (const e of events) {
    const key = e.matchId ?? e.id;
    matchScoreMap.set(key, (matchScoreMap.get(key) ?? 50) + (e.pointsCalculated * 2));
  }
  for (const v of matchScoreMap.values()) {
    matchScores.push(Math.max(0, Math.min(100, v)));
  }
  // Most recent first → reverse for the calculator (it expects chronological)
  matchScores.reverse();

  // Season & career averages from snapshots
  const snapshots = await db.performanceSnapshot.findMany({
    where: { userId },
    orderBy: { capturedAt: 'desc' },
    take: 60,
  });
  const seasonAverage = snapshots.length > 0
    ? snapshots.reduce((s, x) => s + x.performanceScore, 0) / snapshots.length
    : 50;
  const careerAverage = undefined; // TODO: pull from older snapshots

  // Determine decay status
  const lastEventAt = events[0]?.matchDate ?? null;
  const daysSinceLastEvent = lastEventAt
    ? Math.floor((Date.now() - lastEventAt.getTime()) / (1000 * 60 * 60 * 24))
    : 365;

  // Pull existing decay pause info
  const existing = user.performanceProfile;
  const decayStatus = existing?.decayStatus ?? 'active';

  // Compute via the adapter
  const computed = computePerformanceFromTypedProfile({
    player: user.playerProfile,
    coach: user.coachProfile,
    team: user.teamProfile,
    role: user.role,
    recentMatchScores: matchScores,
    seasonAverage,
    careerAverage,
    competitionTier: existing?.competitionTier,
    country: user.currentCountry ?? user.nationality ?? null,
    region: user.region ?? null,
    competition: null,
    ageGroup: resolveAgeGroup(user.dateOfBirth),
    decayStatus,
    daysSinceLastEvent,
    lastEventAt,
  });
  if (!computed) return;

  // Get current total points from the ledger (sum of verified transactions)
  const ledger = await db.performancePointTransaction.aggregate({
    _sum: { amount: true },
    where: { userId, verified: true },
  });
  const totalPoints = Math.max(0, Math.round(ledger._sum.amount ?? 0));

  // Compute decay multiplier (applied to score, not points)
  const decay = computeDecay({
    status: decayStatus as any,
    daysSinceLastEvent,
    lastEventAt,
    pauseReason: existing?.decayPauseReason ?? undefined,
    pausedUntil: existing?.decayPausedUntil ?? null,
  });
  const finalScore = Math.round(
    computed.performanceScore * decay.multiplier * 10,
  ) / 10;
  const tierMeta = (await import('./tiers')).tierForScore(finalScore);

  // Improvement opportunities
  const opportunities = computeImprovementOpportunities(computed.kpiBreakdown);

  // Category bucket
  const group = user.role === 'player'
    ? resolvePositionGroup(user.playerProfile?.position)
    : (user.role === 'coach' ? 'COACH' : 'TEAM');
  const categoryBucket = buildCategoryBucket(
    group, existing?.competitionTier,
    user.currentCountry ?? user.nationality ?? undefined,
    user.region ?? undefined, undefined,
    resolveAgeGroup(user.dateOfBirth),
  );

  // Upsert PerformanceProfile
  await db.performanceProfile.upsert({
    where: { userId },
    create: {
      userId,
      performanceScore: finalScore,
      totalPoints,
      tier: tierMeta.tier,
      formScore: computed.formScore,
      consistencyScore: computed.consistencyScore,
      trendDirection: computed.trend.direction,
      trendDelta: computed.trend.deltaPct,
      improvementScore: computed.improvementScore,
      categoryBucket,
      position: user.playerProfile?.position ?? null,
      playerType: user.playerProfile?.playerType ?? null,
      competitionTier: existing?.competitionTier ?? null,
      ageGroup: resolveAgeGroup(user.dateOfBirth),
      dataConfidence: computed.dataConfidenceFactor,
      decayStatus: decay.status,
      lastEventAt,
      lastCalculatedAt: new Date(),
      improvementOpportunities: opportunities as any,
    },
    update: {
      performanceScore: finalScore,
      totalPoints,
      tier: tierMeta.tier,
      formScore: computed.formScore,
      consistencyScore: computed.consistencyScore,
      trendDirection: computed.trend.direction,
      trendDelta: computed.trend.deltaPct,
      improvementScore: computed.improvementScore,
      categoryBucket,
      position: user.playerProfile?.position ?? null,
      playerType: user.playerProfile?.playerType ?? null,
      dataConfidence: computed.dataConfidenceFactor,
      decayStatus: decay.status,
      lastEventAt,
      lastCalculatedAt: new Date(),
      improvementOpportunities: opportunities as any,
    },
  });
}

// ─── Record a verified performance event ─────────────────────
//
// Ingests an event, computes points (using the KPI weight table),
// writes a PerformancePointTransaction, and triggers a recalc.
//
// This is the ONLY path that adds points to a user's balance.

export interface RecordEventInput {
  userId: string;
  eventType: string;       // 'goal' | 'assist' | 'save' | 'clean-sheet' | ...
  kpiKey?: string;         // 'goals' | 'assists' | ... (matches KPIConfiguration)
  value?: number;          // count, default 1
  matchId?: string;
  competition?: string;
  competitionTier?: string;
  season?: string;
  opponentName?: string;
  opponentStrength?: number;
  teamStrength?: number;
  matchDate: Date;
  source?: string;
  sourceUserId?: string;
  notes?: string;
}

export async function recordPerformanceEvent(input: RecordEventInput): Promise<void> {
  // Fetch KPIConfiguration for the kpiKey to get point values
  const kpiConfig = input.kpiKey
    ? await db.kPIConfiguration.findUnique({ where: { kpiKey: input.kpiKey } })
    : null;

  // Compute points: positive or negative
  const pointsPerUnit = kpiConfig?.positivePointsPerUnit ?? defaultPointsForEventType(input.eventType);
  const negativePerUnit = kpiConfig?.negativePointsPerUnit ?? 0;
  const isNegative = negativePerUnit !== 0 && pointsPerUnit === 0;
  const rawPoints = (isNegative ? negativePerUnit : pointsPerUnit) * (input.value ?? 1);

  // Apply difficulty multiplier
  const competition = input.competitionTier?.toLowerCase() ?? '';
  let difficulty = 1.0;
  if (competition === 'pro' || competition === 'professional') difficulty = 1.10;
  else if (competition === 'amateur') difficulty = 0.92;
  else if (competition === 'youth' || competition.includes('u1')) difficulty = 0.88;

  // Opponent strength swing
  if (typeof input.opponentStrength === 'number') {
    difficulty += (input.opponentStrength - 0.5) * 0.20;
  }
  difficulty = Math.max(0.85, Math.min(1.20, difficulty));

  const finalPoints = Math.round(rawPoints * difficulty);

  // Get current balance
  const current = await db.performanceProfile.findUnique({ where: { userId: input.userId } });
  const balanceBefore = current?.totalPoints ?? 0;
  const balanceAfter = balanceBefore + finalPoints;

  // Create event + transaction in a single transaction
  await db.$transaction(async (tx) => {
    const event = await tx.performanceEvent.create({
      data: {
        userId: input.userId,
        kpiConfigId: kpiConfig?.id ?? null,
        eventType: input.eventType,
        value: input.value ?? 1,
        matchId: input.matchId,
        competition: input.competition,
        competitionTier: input.competitionTier,
        season: input.season,
        opponentName: input.opponentName,
        opponentStrength: input.opponentStrength,
        teamStrength: input.teamStrength,
        matchDate: input.matchDate,
        source: input.source ?? 'manual',
        sourceUserId: input.sourceUserId,
        verificationStatus: input.source === 'official' || input.source === 'api-provider' ? 'verified' : 'pending',
        verifiedAt: input.source === 'official' || input.source === 'api-provider' ? new Date() : null,
        pointsCalculated: finalPoints,
        notes: input.notes,
      },
    });

    // Only write a point transaction if the event is verified
    if (event.verificationStatus === 'verified') {
      await tx.performancePointTransaction.create({
        data: {
          userId: input.userId,
          eventId: event.id,
          transactionType: 'event',
          amount: finalPoints,
          balanceBefore,
          balanceAfter,
          reason: buildReasonString(input, finalPoints),
          reasonCode: input.eventType,
          verified: true,
        },
      });
    }

    // Auto-flag anomaly: more than 5 events of same type for same user in same match
    if (input.matchId) {
      const dupCount = await tx.performanceEvent.count({
        where: {
          userId: input.userId, matchId: input.matchId,
          eventType: input.eventType,
        },
      });
      if (dupCount > 5) {
        await tx.performanceAnomaly.create({
          data: {
            userId: input.userId,
            eventType: input.eventType,
            matchId: input.matchId,
            anomalyType: 'duplicate-event',
            severity: 'high',
            description: `${dupCount} "${input.eventType}" events recorded for user ${input.userId} in match ${input.matchId}`,
            evidence: { count: dupCount, threshold: 5 },
          },
        });
      }
    }
  });

  // Trigger recalc (only if event was verified)
  if (input.source === 'official' || input.source === 'api-provider') {
    await recalcPerformanceProfile(input.userId);
  }
}

function defaultPointsForEventType(eventType: string): number {
  const map: Record<string, number> = {
    'goal':           35,
    'assist':         18,
    'save':           2.5,
    'clean-sheet':    25,
    'penalty-save':   60,
    'motm':           50,
    'match-win':      25,
    'match-draw':     8,
    'yellow-card':    0,    // uses negativePerUnit
    'red-card':       0,
    'goals-conceded': 0,
    'match-loss':     0,
  };
  return map[eventType] ?? 0;
}

function buildReasonString(input: RecordEventInput, points: number): string {
  const sign = points >= 0 ? '+' : '';
  const opp = input.opponentName ? ` vs ${input.opponentName}` : '';
  const comp = input.competition ? ` (${input.competition})` : '';
  return `${sign}${points} ${input.eventType}${opp}${comp}`;
}

// ─── Daily decay runner (cron) ───────────────────────────────
//
// Per user's correction: applies CONTROLLED decay to POINTS via the
// ledger (transparent, auditable) — NOT a silent UPDATE.
// Decay is SKIPPED entirely for paused-injury / paused-suspension /
// retired statuses.

export async function runDailyDecay(): Promise<{ processed: number; decayed: number }> {
  const candidates = await db.performanceProfile.findMany({
    where: {
      decayStatus: { in: ['active', 'decaying'] },
      lastEventAt: { lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    },
    select: { userId: true, totalPoints: true, lastEventAt: true, decayStatus: true },
  });

  let decayed = 0;
  for (const c of candidates) {
    if (!c.lastEventAt) continue;
    const days = Math.floor((Date.now() - c.lastEventAt.getTime()) / (1000 * 60 * 60 * 24));
    const decay = computeDecay({
      status: c.decayStatus as any,
      daysSinceLastEvent: days,
      lastEventAt: c.lastEventAt,
    });
    if (decay.multiplier >= 1.0) continue;

    // Convert decay multiplier to point deduction (capped at 1% of total points per day)
    const deduction = Math.min(
      Math.round(c.totalPoints * 0.01),
      Math.round(c.totalPoints * (1 - decay.multiplier) * 0.05),
    );
    if (deduction <= 0) continue;

    const balanceAfter = Math.max(0, c.totalPoints - deduction);
    await db.performancePointTransaction.create({
      data: {
        userId: c.userId,
        transactionType: 'decay',
        amount: -deduction,
        balanceBefore: c.totalPoints,
        balanceAfter,
        reason: `Inactivity decay: -${deduction} (${days} days since last event)`,
        reasonCode: 'decay-inactivity',
        verified: true,
      },
    });
    await db.performanceProfile.update({
      where: { userId: c.userId },
      data: { totalPoints: balanceAfter, decayStatus: 'decaying' },
    });
    decayed++;
  }

  return { processed: candidates.length, decayed };
}

// ─── Daily snapshot runner (cron) ────────────────────────────
export async function runDailySnapshot(): Promise<{ captured: number }> {
  const profiles = await db.performanceProfile.findMany({
    select: {
      userId: true, performanceScore: true, totalPoints: true,
      formScore: true, consistencyScore: true, rankGlobal: true,
      rankCategory: true, tier: true,
    },
  });

  const now = new Date();
  await db.performanceSnapshot.createMany({
    data: profiles.map((p) => ({
      userId: p.userId,
      capturedAt: now,
      period: 'daily',
      performanceScore: p.performanceScore,
      totalPoints: p.totalPoints,
      formScore: p.formScore,
      consistencyScore: p.consistencyScore,
      rankGlobal: p.rankGlobal,
      rankCategory: p.rankCategory,
      tier: p.tier,
    })),
  });

  return { captured: profiles.length };
}

// ─── Recompute rankings for a category bucket ────────────────
//
// Re-ranks everyone in the same bucket by totalPoints desc.
// Updates rankCategory + rankGlobal + rankMovement.
export async function recomputeRankings(categoryBucket?: string): Promise<void> {
  const where = categoryBucket ? { categoryBucket } : {};
  const profiles = await db.performanceProfile.findMany({
    where,
    orderBy: { totalPoints: 'desc' },
    select: { userId: true, totalPoints: true, categoryBucket: true, rankCategory: true },
  });

  let rank = 1;
  for (const p of profiles) {
    const prevRank = p.rankCategory;
    await db.performanceProfile.update({
      where: { userId: p.userId },
      data: {
        rankCategory: rank,
        rankMovement: prevRank ? prevRank - rank : 0,
      },
    });
    rank++;
  }
}
