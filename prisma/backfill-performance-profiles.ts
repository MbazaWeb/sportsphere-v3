// ─── Backfill: PerformanceProfile for existing Pro users ──────────
//
// Phase 5 backfill script. After applying the Phase 5 migration, run
// this to create a PerformanceProfile row for every existing Pro user
// (player / coach / team) based on their typed profile data.
//
// This does NOT create PerformanceEvents or PointTransactions — those
// require verified match data which we don't have historically. The
// performance score is computed from the typed profile's KPI columns
// directly (which is the same source the engine uses).
//
// After backfill, run `recomputeRankings()` to populate rankCategory.
//
// Usage:
//   npx tsx prisma/backfill-performance-profiles.ts
//
// Idempotent — safe to re-run; uses upsert.

import { PrismaClient } from '@prisma/client';
import { computePerformanceFromTypedProfile, resolvePositionGroup, resolveAgeGroup, buildCategoryBucket, tierForScore } from '../WebApp/src/lib/performance-engine';

const db = new PrismaClient();

async function main() {
  console.log('Backfilling PerformanceProfile rows for existing Pro users...');

  const users = await db.user.findMany({
    where: { role: { in: ['player', 'coach', 'team'] } },
    include: {
      playerProfile: true,
      coachProfile: true,
      teamProfile: true,
    },
  });

  console.log(`Found ${users.length} Pro users (player/coach/team).`);

  let created = 0;
  let skipped = 0;

  for (const user of users) {
    const computed = computePerformanceFromTypedProfile({
      player: user.playerProfile,
      coach: user.coachProfile,
      team: user.teamProfile,
      role: user.role,
      recentMatchScores: [], // no historical events
      seasonAverage: 50,
      careerAverage: undefined,
      competitionTier: null,
      country: user.currentCountry ?? user.nationality ?? null,
      region: user.region ?? null,
      ageGroup: resolveAgeGroup(user.dateOfBirth),
      decayStatus: 'active',
      daysSinceLastEvent: 0,
      lastEventAt: null,
    });
    if (!computed) {
      skipped++;
      continue;
    }

    const group = user.role === 'player'
      ? resolvePositionGroup(user.playerProfile?.position)
      : (user.role === 'coach' ? 'COACH' : 'TEAM');

    const categoryBucket = buildCategoryBucket(
      group, null,
      user.currentCountry ?? user.nationality ?? undefined,
      user.region ?? undefined, undefined,
      resolveAgeGroup(user.dateOfBirth),
    );

    // Compute initial total points from the KPI breakdown contributions
    // (this gives every user a non-zero starting balance so leaderboards
    //  aren't empty until events are recorded):
    const initialPoints = Math.round(
      computed.kpiBreakdown.reduce((sum, b) => sum + b.contribution, 0) * 10,
    );

    await db.performanceProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        performanceScore: computed.performanceScore,
        totalPoints: Math.max(0, initialPoints),
        tier: computed.tier,
        formScore: computed.formScore,
        consistencyScore: computed.consistencyScore,
        trendDirection: computed.trend.direction,
        trendDelta: computed.trend.deltaPct,
        improvementScore: computed.improvementScore,
        categoryBucket,
        position: user.playerProfile?.position ?? null,
        playerType: user.playerProfile?.playerType ?? null,
        competitionTier: null,
        ageGroup: resolveAgeGroup(user.dateOfBirth),
        dataConfidence: computed.dataConfidenceFactor,
        decayStatus: 'active',
        lastCalculatedAt: new Date(),
        improvementOpportunities: (computed as any).improvementOpportunities ?? [],
      },
      update: {
        performanceScore: computed.performanceScore,
        tier: computed.tier,
        formScore: computed.formScore,
        consistencyScore: computed.consistencyScore,
        trendDirection: computed.trend.direction,
        trendDelta: computed.trend.deltaPct,
        improvementScore: computed.improvementScore,
        categoryBucket,
        position: user.playerProfile?.position ?? null,
        playerType: user.playerProfile?.playerType ?? null,
        dataConfidence: computed.dataConfidenceFactor,
        lastCalculatedAt: new Date(),
        improvementOpportunities: (computed as any).improvementOpportunities ?? [],
      },
    });

    // Create an initial "backfill" point transaction so the ledger is auditable
    if (initialPoints > 0) {
      const existing = await db.performancePointTransaction.findFirst({
        where: { userId: user.id, transactionType: 'recalibration', reasonCode: 'backfill-initial' },
      });
      if (!existing) {
        await db.performancePointTransaction.create({
          data: {
            userId: user.id,
            transactionType: 'recalibration',
            amount: initialPoints,
            balanceBefore: 0,
            balanceAfter: initialPoints,
            reason: 'Initial backfill from typed profile KPIs',
            reasonCode: 'backfill-initial',
            verified: true,
          },
        });
      }
    }

    created++;
    if (created % 25 === 0) {
      console.log(`  processed ${created}/${users.length}`);
    }
  }

  console.log(`\nDone.`);
  console.log(`  Created/updated: ${created}`);
  console.log(`  Skipped (no typed profile): ${skipped}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Run recomputeRankings() to populate rankCategory`);
  console.log(`  2. Set up cron for runDailySnapshot() + runDailyDecay()`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
