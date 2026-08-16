// ─── Seed: KPI Configuration defaults ────────────────────────────
//
// Run after applying the Phase 5 migration to populate the
// KPIConfiguration table with sensible defaults. Without this, the
// engine uses the hardcoded defaults in `kpi-weights.ts` (which is
// fine), but having rows in KPIConfiguration lets admins tweak weights
// from the admin UI without redeploying.
//
// Usage:
//   npx tsx prisma/seed-kpi-config.ts
//
// Idempotent — safe to re-run; will upsert each row.

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const DEFAULT_KPIS: Array<{
  kpiKey: string;
  label: string;
  category: string;
  appliesToRoles: string[];
  appliesToPositions: string[];
  positivePointsPerUnit: number;
  negativePointsPerUnit: number;
  maxContributionPerMatch: number;
  maxContributionPerSeason: number;
  minValue: number;
  maxValue: number;
  description: string;
}> = [
  // ── Attacking ──
  { kpiKey: 'goals', label: 'Goals', category: 'attacking',
    appliesToRoles: ['player'], appliesToPositions: ['FWD', 'MID', 'DEF'],
    positivePointsPerUnit: 35, negativePointsPerUnit: 0,
    maxContributionPerMatch: 105, maxContributionPerSeason: 800,
    minValue: 0, maxValue: 30,
    description: 'Goals scored. Higher weight for forwards, lower for defenders.' },
  { kpiKey: 'shotsOnTarget', label: 'Shots on Target', category: 'attacking',
    appliesToRoles: ['player'], appliesToPositions: ['FWD', 'MID'],
    positivePointsPerUnit: 3, negativePointsPerUnit: 0,
    maxContributionPerMatch: 12, maxContributionPerSeason: 150,
    minValue: 0, maxValue: 80,
    description: 'Shots on target — measures attacking threat.' },
  { kpiKey: 'conversionRate', label: 'Conversion Rate', category: 'attacking',
    appliesToRoles: ['player'], appliesToPositions: ['FWD'],
    positivePointsPerUnit: 80, negativePointsPerUnit: 0,
    maxContributionPerMatch: 80, maxContributionPerSeason: 200,
    minValue: 0, maxValue: 100,
    description: 'Goals / shots ratio × 100.' },

  // ── Creativity ──
  { kpiKey: 'assists', label: 'Assists', category: 'creativity',
    appliesToRoles: ['player'], appliesToPositions: ['FWD', 'MID', 'DEF'],
    positivePointsPerUnit: 18, negativePointsPerUnit: 0,
    maxContributionPerMatch: 54, maxContributionPerSeason: 450,
    minValue: 0, maxValue: 20,
    description: 'Assists — final pass before a goal.' },
  { kpiKey: 'chancesCreated', label: 'Chances Created', category: 'creativity',
    appliesToRoles: ['player'], appliesToPositions: ['FWD', 'MID'],
    positivePointsPerUnit: 4, negativePointsPerUnit: 0,
    maxContributionPerMatch: 16, maxContributionPerSeason: 250,
    minValue: 0, maxValue: 100,
    description: 'Key passes leading to a shot.' },
  { kpiKey: 'passAccuracy', label: 'Pass Accuracy', category: 'creativity',
    appliesToRoles: ['player'], appliesToPositions: ['MID', 'DEF', 'GK'],
    positivePointsPerUnit: 0.9, negativePointsPerUnit: 0,
    maxContributionPerMatch: 90, maxContributionPerSeason: 200,
    minValue: 0, maxValue: 100,
    description: 'Completed passes / total passes × 100.' },

  // ── Defensive ──
  { kpiKey: 'tackles', label: 'Tackles', category: 'defensive',
    appliesToRoles: ['player'], appliesToPositions: ['DEF', 'MID'],
    positivePointsPerUnit: 4, negativePointsPerUnit: 0,
    maxContributionPerMatch: 16, maxContributionPerSeason: 250,
    minValue: 0, maxValue: 100,
    description: 'Successful tackles.' },
  { kpiKey: 'interceptions', label: 'Interceptions', category: 'defensive',
    appliesToRoles: ['player'], appliesToPositions: ['DEF', 'MID'],
    positivePointsPerUnit: 4, negativePointsPerUnit: 0,
    maxContributionPerMatch: 16, maxContributionPerSeason: 250,
    minValue: 0, maxValue: 100,
    description: 'Interceptions of opponent passes.' },
  { kpiKey: 'duelsWon', label: 'Duels Won %', category: 'defensive',
    appliesToRoles: ['player'], appliesToPositions: ['DEF', 'MID', 'FWD'],
    positivePointsPerUnit: 1.5, negativePointsPerUnit: 0,
    maxContributionPerMatch: 100, maxContributionPerSeason: 150,
    minValue: 0, maxValue: 100,
    description: 'Duels won percentage.' },
  { kpiKey: 'aerialDuels', label: 'Aerial Duels %', category: 'defensive',
    appliesToRoles: ['player'], appliesToPositions: ['DEF', 'GK'],
    positivePointsPerUnit: 1.5, negativePointsPerUnit: 0,
    maxContributionPerMatch: 100, maxContributionPerSeason: 120,
    minValue: 0, maxValue: 100,
    description: 'Aerial duels won percentage.' },

  // ── Goalkeeper ──
  { kpiKey: 'saves', label: 'Saves', category: 'gk',
    appliesToRoles: ['player'], appliesToPositions: ['GK'],
    positivePointsPerUnit: 2.5, negativePointsPerUnit: 0,
    maxContributionPerMatch: 25, maxContributionPerSeason: 300,
    minValue: 0, maxValue: 150,
    description: 'Shots saved.' },
  { kpiKey: 'savePct', label: 'Save %', category: 'gk',
    appliesToRoles: ['player'], appliesToPositions: ['GK'],
    positivePointsPerUnit: 1.0, negativePointsPerUnit: 0,
    maxContributionPerMatch: 100, maxContributionPerSeason: 250,
    minValue: 0, maxValue: 100,
    description: 'Saves / shots on target faced × 100.' },
  { kpiKey: 'cleanSheets', label: 'Clean Sheets', category: 'gk',
    appliesToRoles: ['player'], appliesToPositions: ['GK', 'DEF'],
    positivePointsPerUnit: 30, negativePointsPerUnit: 0,
    maxContributionPerMatch: 30, maxContributionPerSeason: 600,
    minValue: 0, maxValue: 25,
    description: 'Matches with no goals conceded.' },
  { kpiKey: 'penaltiesSaved', label: 'Penalty Saves', category: 'gk',
    appliesToRoles: ['player'], appliesToPositions: ['GK'],
    positivePointsPerUnit: 60, negativePointsPerUnit: 0,
    maxContributionPerMatch: 180, maxContributionPerSeason: 240,
    minValue: 0, maxValue: 8,
    description: 'Penalties saved.' },
  { kpiKey: 'goalsConceded', label: 'Goals Conceded', category: 'gk',
    appliesToRoles: ['player'], appliesToPositions: ['GK', 'DEF'],
    positivePointsPerUnit: 0, negativePointsPerUnit: -6,
    maxContributionPerMatch: -18, maxContributionPerSeason: -250,
    minValue: 0, maxValue: 40,
    description: 'Goals conceded (penalty KPI).' },

  // ── Discipline (negative) ──
  { kpiKey: 'yellowCards', label: 'Yellow Cards', category: 'discipline',
    appliesToRoles: ['player'], appliesToPositions: [],
    positivePointsPerUnit: 0, negativePointsPerUnit: -8,
    maxContributionPerMatch: -16, maxContributionPerSeason: -120,
    minValue: 0, maxValue: 15,
    description: 'Yellow cards — small point penalty per card.' },
  { kpiKey: 'redCards', label: 'Red Cards', category: 'discipline',
    appliesToRoles: ['player'], appliesToPositions: [],
    positivePointsPerUnit: 0, negativePointsPerUnit: -25,
    maxContributionPerMatch: -50, maxContributionPerSeason: -180,
    minValue: 0, maxValue: 5,
    description: 'Red cards — significant point penalty.' },

  // ── Fitness / Form ──
  { kpiKey: 'appearances', label: 'Matches Played', category: 'fitness',
    appliesToRoles: ['player'], appliesToPositions: [],
    positivePointsPerUnit: 8, negativePointsPerUnit: 0,
    maxContributionPerMatch: 8, maxContributionPerSeason: 250,
    minValue: 0, maxValue: 40,
    description: 'Match appearances — rewards availability.' },
  { kpiKey: 'rating', label: 'Average Rating', category: 'fitness',
    appliesToRoles: ['player'], appliesToPositions: [],
    positivePointsPerUnit: 30, negativePointsPerUnit: 0,
    maxContributionPerMatch: 30, maxContributionPerSeason: 250,
    minValue: 0, maxValue: 10,
    description: 'Average match rating (typically 6.0–10.0).' },
  { kpiKey: 'motm', label: 'Player of the Match', category: 'fitness',
    appliesToRoles: ['player'], appliesToPositions: [],
    positivePointsPerUnit: 50, negativePointsPerUnit: 0,
    maxContributionPerMatch: 50, maxContributionPerSeason: 400,
    minValue: 0, maxValue: 15,
    description: 'Man of the Match awards.' },

  // ── Coach ──
  { kpiKey: 'wins', label: 'Wins', category: 'record',
    appliesToRoles: ['coach'], appliesToPositions: [],
    positivePointsPerUnit: 25, negativePointsPerUnit: 0,
    maxContributionPerMatch: 25, maxContributionPerSeason: 600,
    minValue: 0, maxValue: 30,
    description: 'Matches won as coach.' },
  { kpiKey: 'losses', label: 'Losses', category: 'record',
    appliesToRoles: ['coach'], appliesToPositions: [],
    positivePointsPerUnit: 0, negativePointsPerUnit: -5,
    maxContributionPerMatch: -5, maxContributionPerSeason: -200,
    minValue: 0, maxValue: 20,
    description: 'Matches lost as coach (mild penalty).' },
  { kpiKey: 'pointsPerGame', label: 'Points Per Game', category: 'record',
    appliesToRoles: ['coach'], appliesToPositions: [],
    positivePointsPerUnit: 40, negativePointsPerUnit: 0,
    maxContributionPerMatch: 120, maxContributionPerSeason: 400,
    minValue: 0, maxValue: 3,
    description: 'League points per game (0–3 scale).' },
  { kpiKey: 'trophiesWon', label: 'Trophies', category: 'record',
    appliesToRoles: ['coach'], appliesToPositions: [],
    positivePointsPerUnit: 200, negativePointsPerUnit: 0,
    maxContributionPerMatch: 200, maxContributionPerSeason: 1000,
    minValue: 0, maxValue: 10,
    description: 'Trophies won as coach.' },

  // ── Team ──
  { kpiKey: 'points', label: 'Points', category: 'team-performance',
    appliesToRoles: ['team'], appliesToPositions: [],
    positivePointsPerUnit: 6, negativePointsPerUnit: 0,
    maxContributionPerMatch: 6, maxContributionPerSeason: 600,
    minValue: 0, maxValue: 90,
    description: 'League points (team).' },
];

async function main() {
  console.log(`Seeding ${DEFAULT_KPIS.length} KPI configurations...`);

  for (const kpi of DEFAULT_KPIS) {
    await db.kPIConfiguration.upsert({
      where: { kpiKey: kpi.kpiKey },
      create: kpi,
      update: {
        label: kpi.label,
        category: kpi.category,
        appliesToRoles: kpi.appliesToRoles,
        appliesToPositions: kpi.appliesToPositions,
        positivePointsPerUnit: kpi.positivePointsPerUnit,
        negativePointsPerUnit: kpi.negativePointsPerUnit,
        maxContributionPerMatch: kpi.maxContributionPerMatch,
        maxContributionPerSeason: kpi.maxContributionPerSeason,
        minValue: kpi.minValue,
        maxValue: kpi.maxValue,
        description: kpi.description,
      },
    });
    console.log(`  ✓ ${kpi.kpiKey}`);
  }

  console.log('\nDone. KPI configuration seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
