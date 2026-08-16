// ─── Default KPI Weight Tables (per PositionGroup) ────────────────
//
// These are the SENSIBLE DEFAULTS shipped with the platform. Admins
// can OVERRIDE them at runtime via the KPIConfiguration + KPIWeight
// Prisma tables — no code redeploy needed.
//
// Weights sum to ~1.0 within each group. `pointsPerUnit` is the raw
// point value added per unit (a goal = +35, an assist = +18, etc.).
// Negative KPIs (yellows, reds, errors) use `negativePerUnit`.
//
// `maxContribution` caps the points any single KPI can contribute in
// a season — prevents specialists from inflating their score on one
// dimension (e.g. a keeper who only saves shots but can't distribute).

import type { PositionWeightTable, KpiWeight } from './types';

// ── Forward / Striker ──
// Goals & assists dominate, but chances created, conversion rate, and
// discipline (low fouls/yellows) all contribute.
const FWD_WEIGHTS: KpiWeight[] = [
  { key: 'goals',           label: 'Goals',           weight: 0.28, pointsPerUnit: 35,  maxContribution: 800 },
  { key: 'assists',         label: 'Assists',         weight: 0.18, pointsPerUnit: 18,  maxContribution: 450 },
  { key: 'shotsOnTarget',   label: 'Shots on Target', weight: 0.08, pointsPerUnit: 3,   maxContribution: 150 },
  { key: 'chancesCreated',  label: 'Chances Created', weight: 0.10, pointsPerUnit: 4,   maxContribution: 250 },
  { key: 'conversionRate',  label: 'Conversion Rate', weight: 0.10, pointsPerUnit: 80,  maxContribution: 200 }, // ratio * 100
  { key: 'duelsWon',        label: 'Duels Won %',     weight: 0.06, pointsPerUnit: 1.5, maxContribution: 100 },
  { key: 'motm',            label: 'Player of Match', weight: 0.08, pointsPerUnit: 50,  maxContribution: 400 },
  { key: 'appearances',     label: 'Matches Played',  weight: 0.05, pointsPerUnit: 8,   maxContribution: 250 },
  { key: 'rating',          label: 'Avg Rating',      weight: 0.07, pointsPerUnit: 30,  maxContribution: 250 }, // 6..10 → ratio
  // Discipline (negative):
  { key: 'yellowCards',     label: 'Yellow Cards',    weight: 0.00, pointsPerUnit: 0,   negativePerUnit: -8,  maxContribution: -100 },
  { key: 'redCards',        label: 'Red Cards',       weight: 0.00, pointsPerUnit: 0,   negativePerUnit: -25, maxContribution: -150 },
];

// ── Midfielder (general — sub-role adjustment applied separately) ──
// Balanced between creativity, defensive contribution, and discipline.
const MID_WEIGHTS: KpiWeight[] = [
  { key: 'assists',         label: 'Assists',         weight: 0.15, pointsPerUnit: 18,  maxContribution: 400 },
  { key: 'chancesCreated',  label: 'Chances Created', weight: 0.14, pointsPerUnit: 4,   maxContribution: 300 },
  { key: 'passAccuracy',    label: 'Pass Accuracy',   weight: 0.12, pointsPerUnit: 0.9, maxContribution: 200 },
  { key: 'keyPasses',       label: 'Key Passes',      weight: 0.10, pointsPerUnit: 3,   maxContribution: 250 },
  { key: 'tackles',         label: 'Tackles',         weight: 0.10, pointsPerUnit: 3,   maxContribution: 200 },
  { key: 'interceptions',   label: 'Interceptions',   weight: 0.09, pointsPerUnit: 3,   maxContribution: 200 },
  { key: 'duelsWon',        label: 'Duels Won %',     weight: 0.08, pointsPerUnit: 1.5, maxContribution: 120 },
  { key: 'goals',           label: 'Goals',           weight: 0.08, pointsPerUnit: 30,  maxContribution: 400 },
  { key: 'appearances',     label: 'Matches Played',  weight: 0.05, pointsPerUnit: 8,   maxContribution: 250 },
  { key: 'rating',          label: 'Avg Rating',      weight: 0.09, pointsPerUnit: 30,  maxContribution: 250 },
  { key: 'motm',            label: 'Player of Match', weight: 0.05, pointsPerUnit: 50,  maxContribution: 300 },
  // Discipline:
  { key: 'yellowCards',     label: 'Yellow Cards',    weight: 0.00, pointsPerUnit: 0,   negativePerUnit: -8,  maxContribution: -100 },
  { key: 'redCards',        label: 'Red Cards',       weight: 0.00, pointsPerUnit: 0,   negativePerUnit: -25, maxContribution: -150 },
];

// ── Defender ──
// Defensive contribution dominates. Goals/assists are bonus only.
const DEF_WEIGHTS: KpiWeight[] = [
  { key: 'tackles',         label: 'Tackles',         weight: 0.14, pointsPerUnit: 4,   maxContribution: 250 },
  { key: 'interceptions',   label: 'Interceptions',   weight: 0.13, pointsPerUnit: 4,   maxContribution: 250 },
  { key: 'duelsWon',        label: 'Duels Won %',     weight: 0.10, pointsPerUnit: 1.5, maxContribution: 150 },
  { key: 'aerialDuels',     label: 'Aerial Duels %',  weight: 0.08, pointsPerUnit: 1.5, maxContribution: 120 },
  { key: 'cleanSheets',     label: 'Clean Sheets',    weight: 0.18, pointsPerUnit: 25,  maxContribution: 500 },
  { key: 'passAccuracy',    label: 'Pass Accuracy',   weight: 0.07, pointsPerUnit: 0.9, maxContribution: 150 },
  { key: 'appearances',     label: 'Matches Played',  weight: 0.08, pointsPerUnit: 8,   maxContribution: 250 },
  { key: 'rating',          label: 'Avg Rating',      weight: 0.10, pointsPerUnit: 30,  maxContribution: 250 },
  // Bonus (low weight — defenders DO score but it's not the focus):
  { key: 'goals',           label: 'Goals',           weight: 0.04, pointsPerUnit: 30,  maxContribution: 200 },
  { key: 'assists',         label: 'Assists',         weight: 0.03, pointsPerUnit: 18,  maxContribution: 150 },
  { key: 'motm',            label: 'Player of Match', weight: 0.05, pointsPerUnit: 50,  maxContribution: 300 },
  // Discipline (heavily penalized for defenders):
  { key: 'yellowCards',     label: 'Yellow Cards',    weight: 0.00, pointsPerUnit: 0,   negativePerUnit: -10, maxContribution: -120 },
  { key: 'redCards',        label: 'Red Cards',       weight: 0.00, pointsPerUnit: 0,   negativePerUnit: -30, maxContribution: -180 },
];

// ── Goalkeeper ──
// Save %, clean sheets, and goals prevented dominate. Distribution
// and penalties saved are weighted but secondary.
const GK_WEIGHTS: KpiWeight[] = [
  { key: 'savePct',         label: 'Save %',          weight: 0.20, pointsPerUnit: 1.0, maxContribution: 250 }, // 0..100
  { key: 'cleanSheets',     label: 'Clean Sheets',    weight: 0.20, pointsPerUnit: 30,  maxContribution: 600 },
  { key: 'saves',           label: 'Saves',           weight: 0.14, pointsPerUnit: 2.5, maxContribution: 300 },
  { key: 'goalsConceded',  label: 'Goals Conceded',  weight: 0.00, pointsPerUnit: 0,   negativePerUnit: -6,  maxContribution: -250 },
  { key: 'penaltiesSaved',  label: 'Penalty Saves',   weight: 0.08, pointsPerUnit: 60,  maxContribution: 240 },
  { key: 'passAccuracy',    label: 'Distribution %',  weight: 0.06, pointsPerUnit: 0.8, maxContribution: 100 },
  { key: 'appearances',     label: 'Matches Played',  weight: 0.08, pointsPerUnit: 8,   maxContribution: 250 },
  { key: 'rating',          label: 'Avg Rating',      weight: 0.12, pointsPerUnit: 30,  maxContribution: 250 },
  { key: 'motm',            label: 'Player of Match', weight: 0.07, pointsPerUnit: 50,  maxContribution: 300 },
  { key: 'aerialDuels',     label: 'Claims %',        weight: 0.05, pointsPerUnit: 1.2, maxContribution: 100 },
  // Discipline (red cards hurt GKs more):
  { key: 'yellowCards',     label: 'Yellow Cards',    weight: 0.00, pointsPerUnit: 0,   negativePerUnit: -10, maxContribution: -100 },
  { key: 'redCards',        label: 'Red Cards',       weight: 0.00, pointsPerUnit: 0,   negativePerUnit: -40, maxContribution: -200 },
];

// ── Coach ──
// Win rate, PPG, player development, and tactical success.
const COACH_WEIGHTS: KpiWeight[] = [
  { key: 'wins',            label: 'Wins',            weight: 0.20, pointsPerUnit: 25,  maxContribution: 600 },
  { key: 'draws',           label: 'Draws',           weight: 0.05, pointsPerUnit: 8,   maxContribution: 150 },
  { key: 'pointsPerGame',   label: 'Points Per Game', weight: 0.20, pointsPerUnit: 40,  maxContribution: 400 },
  { key: 'cleanSheets',     label: 'Clean Sheets',    weight: 0.10, pointsPerUnit: 15,  maxContribution: 300 },
  { key: 'trophiesWon',     label: 'Trophies',        weight: 0.15, pointsPerUnit: 200, maxContribution: 1000 },
  { key: 'matchesManaged',  label: 'Matches Managed', weight: 0.05, pointsPerUnit: 4,   maxContribution: 300 },
  { key: 'rating',          label: 'Team Rating',     weight: 0.10, pointsPerUnit: 30,  maxContribution: 250 },
  { key: 'goalDifference',  label: 'Goal Difference', weight: 0.05, pointsPerUnit: 4,   maxContribution: 200 },
  // Negative (losses reduce but not heavily — losses are part of coaching):
  { key: 'losses',          label: 'Losses',          weight: 0.00, pointsPerUnit: 0,   negativePerUnit: -5,  maxContribution: -200 },
];

// ── Team ──
// Wins, points, goal difference, form.
const TEAM_WEIGHTS: KpiWeight[] = [
  { key: 'wins',          label: 'Wins',          weight: 0.22, pointsPerUnit: 25,  maxContribution: 700 },
  { key: 'points',        label: 'Points',        weight: 0.20, pointsPerUnit: 6,   maxContribution: 600 },
  { key: 'goalsFor',      label: 'Goals For',     weight: 0.10, pointsPerUnit: 5,   maxContribution: 300 },
  { key: 'cleanSheets',   label: 'Clean Sheets',  weight: 0.10, pointsPerUnit: 15,  maxContribution: 300 },
  { key: 'goalDifference',label: 'Goal Diff',     weight: 0.10, pointsPerUnit: 4,   maxContribution: 250 },
  { key: 'matchesPlayed', label: 'Matches',       weight: 0.05, pointsPerUnit: 4,   maxContribution: 200 },
  { key: 'rating',        label: 'Avg Rating',    weight: 0.13, pointsPerUnit: 30,  maxContribution: 300 },
  { key: 'form',          label: 'Recent Form',   weight: 0.10, pointsPerUnit: 15,  maxContribution: 250 },
  // Negative:
  { key: 'losses',        label: 'Losses',        weight: 0.00, pointsPerUnit: 0,   negativePerUnit: -5,  maxContribution: -200 },
  { key: 'goalsAgainst',  label: 'Goals Against', weight: 0.00, pointsPerUnit: 0,   negativePerUnit: -3,  maxContribution: -250 },
];

export const DEFAULT_WEIGHT_TABLES: Record<string, PositionWeightTable> = {
  FWD:    { group: 'FWD',    weights: FWD_WEIGHTS },
  MID:    { group: 'MID',    weights: MID_WEIGHTS },
  DEF:    { group: 'DEF',    weights: DEF_WEIGHTS },
  GK:     { group: 'GK',     weights: GK_WEIGHTS  },
  COACH:  { group: 'COACH',  weights: COACH_WEIGHTS },
  TEAM:   { group: 'TEAM',   weights: TEAM_WEIGHTS  },
};

export function getWeightTable(group: string): PositionWeightTable {
  return DEFAULT_WEIGHT_TABLES[group] ?? DEFAULT_WEIGHT_TABLES.FWD;
}

// ── Normalization ceilings (maxValue per KPI per group) ──
// Used to convert raw counts to 0..100 sub-scores for the UI breakdown.
// These are SEASON ceilings — if a player exceeds, they cap at 100.
export const NORMALIZATION_CEILINGS: Record<string, number> = {
  goals:           30,
  assists:         20,
  shotsOnTarget:   80,
  chancesCreated:  100,
  keyPasses:       80,
  tackles:         100,
  interceptions:   100,
  duelsWon:        100,  // already a %
  aerialDuels:     100,  // already a %
  cleanSheets:     25,
  saves:           150,
  savePct:         100,  // already a %
  goalsConceded:   40,
  penaltiesSaved:  8,
  passAccuracy:    100,  // already a %
  conversionRate:  100,  // already a %
  appearances:     40,
  rating:          10,   // 6..10 typical
  motm:            15,
  yellowCards:     15,
  redCards:        5,
  // Coach
  wins:            30,
  draws:           15,
  losses:          20,
  matchesManaged:  50,
  pointsPerGame:   3,    // 0..3
  trophiesWon:     10,
  goalDifference:  60,
  // Team
  points:          90,
  goalsFor:        90,
  goalsAgainst:    60,
  matchesPlayed:   40,
  form:            100,
};

export function normalize(rawValue: number, key: string): number {
  const ceiling = NORMALIZATION_CEILINGS[key] ?? 100;
  if (ceiling <= 0) return 0;
  return Math.max(0, Math.min(100, (rawValue / ceiling) * 100));
}
