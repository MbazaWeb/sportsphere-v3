// ─── Performance Engine — Typed Profile Adapter ───────────────────
//
// Bridges the typed PlayerProfile / CoachProfile / TeamProfile tables
// (the source-of-truth KPI columns) to the KPIReading[] format the
// pure calculator consumes.
//
// This file is the ONLY place that knows about Prisma — the calculator
// itself stays pure / unit-testable.

// Local type aliases matching prisma/schema.prisma typed profile tables
// (Prisma client types used directly to avoid regeneration requirement)
type PlayerProfile = {
  userId: string; position?: string | null; secondaryPosition?: string | null;
  preferredFoot?: string | null; jerseyNumber?: string | null;
  height?: number | null; weight?: number | null;
  appearances?: number | null; starts?: number | null; minutes?: number | null;
  goals?: number | null; assists?: number | null; yellowCards?: number | null;
  redCards?: number | null; rating?: number | null; motm?: number | null;
  passAccuracy?: number | null; chancesCreated?: number | null;
  shots?: number | null; shotsOnTarget?: number | null;
  tackles?: number | null; interceptions?: number | null;
  duelsWon?: number | null; aerialDuels?: number | null;
  cleanSheets?: number | null; saves?: number | null; savePct?: number | null;
  goalsConceded?: number | null; penaltiesSaved?: number | null;
  playerType?: string | null; careerStatus?: string | null;
  currentClub?: string | null; nationalTeam?: string | null;
  marketValue?: string | null; form?: string | null; ranking?: string | null;
  [key: string]: unknown;
};
type CoachProfile = {
  userId: string; coachingRole?: string | null; currentTeam?: string | null;
  matchesManaged?: number | null; wins?: number | null; draws?: number | null;
  losses?: number | null; goalsFor?: number | null; goalsAgainst?: number | null;
  cleanSheets?: number | null; trophiesWon?: number | null;
  preferredFormation?: string | null; playingPhilosophy?: string | null;
  [key: string]: unknown;
};
type TeamProfile = {
  userId: string; nickname?: string | null; league?: string | null;
  matchesPlayed?: number | null; wins?: number | null; draws?: number | null;
  losses?: number | null; goalsFor?: number | null; goalsAgainst?: number | null;
  points?: number | null; position?: string | null; form?: string | null;
  [key: string]: unknown;
};
import type { KPIReading, PositionGroup, ComputedPerformance } from './types';
import { resolvePositionGroup } from './positions';
import {
  computePerformanceScore, computeImprovementOpportunities,
} from './calculator';

// ── Player → KPIReadings ──
//
// Pulls all KPIs from the typed PlayerProfile table. The calculator
// will pick the relevant ones based on position group (GK vs FWD etc.)
// — we don't filter here, just translate.
export function playerToReadings(p: PlayerProfile): KPIReading[] {
  const matchesPlayed = Number(p.appearances ?? 0);
  return [
    { key: 'goals',          label: 'Goals',          value: Number(p.goals ?? 0),         maxValue: 30,  category: 'attacking',    matchesPlayed },
    { key: 'assists',        label: 'Assists',        value: Number(p.assists ?? 0),       maxValue: 20,  category: 'creativity',   matchesPlayed },
    { key: 'shotsOnTarget',  label: 'Shots on Target',value: Number(p.shotsOnTarget ?? 0), maxValue: 80,  category: 'attacking',    matchesPlayed },
    { key: 'chancesCreated', label: 'Chances Created',value: Number(p.chancesCreated ?? 0),maxValue: 100, category: 'creativity',   matchesPlayed },
    { key: 'tackles',        label: 'Tackles',        value: Number(p.tackles ?? 0),       maxValue: 100, category: 'defensive',    matchesPlayed },
    { key: 'interceptions',  label: 'Interceptions',  value: Number(p.interceptions ?? 0), maxValue: 100, category: 'defensive',    matchesPlayed },
    { key: 'duelsWon',       label: 'Duels Won %',    value: Number(p.duelsWon ?? 0),      maxValue: 100, category: 'defensive',    matchesPlayed },
    { key: 'aerialDuels',    label: 'Aerial Duels %', value: Number(p.aerialDuels ?? 0),   maxValue: 100, category: 'defensive',    matchesPlayed },
    { key: 'cleanSheets',    label: 'Clean Sheets',   value: Number(p.cleanSheets ?? 0),   maxValue: 25,  category: 'gk',           matchesPlayed },
    { key: 'saves',          label: 'Saves',          value: Number(p.saves ?? 0),         maxValue: 150, category: 'gk',           matchesPlayed },
    { key: 'savePct',        label: 'Save %',         value: Number(p.savePct ?? 0),       maxValue: 100, category: 'gk',           matchesPlayed },
    { key: 'goalsConceded',  label: 'Goals Conceded', value: Number(p.goalsConceded ?? 0), maxValue: 40,  category: 'gk',           matchesPlayed },
    { key: 'penaltiesSaved', label: 'Penalty Saves',  value: Number(p.penaltiesSaved ?? 0),maxValue: 8,   category: 'gk',           matchesPlayed },
    { key: 'passAccuracy',   label: 'Pass Accuracy',  value: Number(p.passAccuracy ?? 0),  maxValue: 100, category: 'creativity',   matchesPlayed },
    { key: 'appearances',    label: 'Matches Played', value: matchesPlayed,                maxValue: 40,  category: 'fitness',      matchesPlayed },
    { key: 'rating',         label: 'Avg Rating',     value: Number(p.rating ?? 0),        maxValue: 10,  category: 'fitness',      matchesPlayed },
    { key: 'motm',           label: 'Player of Match',value: Number(p.motm ?? 0),          maxValue: 15,  category: 'fitness',      matchesPlayed },
    { key: 'yellowCards',    label: 'Yellow Cards',   value: Number(p.yellowCards ?? 0),   maxValue: 15,  category: 'discipline',   matchesPlayed },
    { key: 'redCards',       label: 'Red Cards',      value: Number(p.redCards ?? 0),      maxValue: 5,   category: 'discipline',   matchesPlayed },
    // Derived:
    {
      key: 'conversionRate', label: 'Conversion Rate',
      value: Number(p.shots ?? 0) > 0
        ? (Number(p.goals ?? 0) / Number(p.shots ?? 0)) * 100
        : 0,
      maxValue: 100, category: 'attacking', matchesPlayed,
    },
  ];
}

// ── Coach → KPIReadings ──
export function coachToReadings(c: CoachProfile): KPIReading[] {
  const matches = Number(c.matchesManaged ?? 0);
  return [
    { key: 'wins',           label: 'Wins',            value: Number(c.wins ?? 0),          maxValue: 30,  category: 'record', matchesPlayed: matches },
    { key: 'draws',          label: 'Draws',           value: Number(c.draws ?? 0),         maxValue: 15,  category: 'record', matchesPlayed: matches },
    { key: 'losses',         label: 'Losses',          value: Number(c.losses ?? 0),        maxValue: 20,  category: 'record', matchesPlayed: matches },
    { key: 'matchesManaged', label: 'Matches Managed', value: matches,                      maxValue: 50,  category: 'record', matchesPlayed: matches },
    { key: 'pointsPerGame',  label: 'Points Per Game', value: Number(c.pointsPerGame ?? 0), maxValue: 3,   category: 'record', matchesPlayed: matches },
    { key: 'cleanSheets',    label: 'Clean Sheets',    value: Number(c.cleanSheets ?? 0),   maxValue: 25,  category: 'record', matchesPlayed: matches },
    { key: 'trophiesWon',    label: 'Trophies',        value: Number(c.trophiesWon ?? 0),   maxValue: 10,  category: 'record', matchesPlayed: matches },
    {
      key: 'goalDifference', label: 'Goal Difference',
      value: Number(c.goalsFor ?? 0) - Number(c.goalsAgainst ?? 0),
      maxValue: 60, category: 'record', matchesPlayed: matches,
    },
    { key: 'rating',         label: 'Team Rating',     value: 0,                            maxValue: 10,  category: 'record', matchesPlayed: matches },
  ];
}

// ── Team → KPIReadings ──
export function teamToReadings(t: TeamProfile): KPIReading[] {
  const matches = Number(t.matchesPlayed ?? 0);
  return [
    { key: 'wins',          label: 'Wins',          value: Number(t.wins ?? 0),          maxValue: 30, category: 'team-performance', matchesPlayed: matches },
    { key: 'points',        label: 'Points',        value: Number(t.points ?? 0),        maxValue: 90, category: 'team-performance', matchesPlayed: matches },
    { key: 'goalsFor',      label: 'Goals For',     value: Number(t.goalsFor ?? 0),      maxValue: 90, category: 'team-performance', matchesPlayed: matches },
    { key: 'goalsAgainst',  label: 'Goals Against', value: Number(t.goalsAgainst ?? 0),  maxValue: 60, category: 'team-performance', matchesPlayed: matches },
    { key: 'cleanSheets',   label: 'Clean Sheets',  value: 0,                            maxValue: 25, category: 'team-performance', matchesPlayed: matches },
    { key: 'matchesPlayed', label: 'Matches',       value: matches,                      maxValue: 40, category: 'team-performance', matchesPlayed: matches },
    { key: 'rating',        label: 'Avg Rating',    value: 0,                            maxValue: 10, category: 'team-performance', matchesPlayed: matches },
    {
      key: 'form', label: 'Recent Form',
      value: parseFormString(t.form),
      maxValue: 100, category: 'team-performance', matchesPlayed: matches,
    },
    {
      key: 'goalDifference', label: 'Goal Diff',
      value: Number(t.goalsFor ?? 0) - Number(t.goalsAgainst ?? 0),
      maxValue: 60, category: 'team-performance', matchesPlayed: matches,
    },
  ];
}

// Form string like "WWDLW" → 0..100 score (W=100, D=50, L=0, avg)
function parseFormString(form?: string | null): number {
  if (!form) return 0;
  const cleaned = form.replace(/[^WDL]/gi, '').toUpperCase().slice(-5);
  if (!cleaned) return 0;
  const scores: number[] = cleaned.split('').map((c): number => c === 'W' ? 100 : c === 'D' ? 50 : 0);
  return scores.reduce((s, v) => s + v, 0) / scores.length;
}

// ── Compute full performance from a typed profile ──
//
// This is the high-level entrypoint used by the persistence layer
// and the profile UI. It takes a typed profile and produces a full
// ComputedPerformance (without rank — rank is computed separately
// by the ranking runner because it requires querying all peers).

export interface ComputeFromProfileInput {
  player?: PlayerProfile | null;
  coach?: CoachProfile | null;
  team?: TeamProfile | null;
  role: string;
  // Match-score history (from PerformanceEvent aggregation):
  recentMatchScores: number[];
  seasonAverage: number;
  careerAverage?: number;
  competitionTier?: string | null;
  country?: string | null;
  region?: string | null;
  competition?: string | null;
  ageGroup?: string | null;
  decayStatus?: string;
  daysSinceLastEvent?: number;
  lastEventAt?: Date | null;
  kpiOverrides?: Record<string, { weight?: number; pointsPerUnit?: number }>;
}

export function computePerformanceFromTypedProfile(
  input: ComputeFromProfileInput,
): ComputedPerformance | null {
  let group: PositionGroup;
  let readings: KPIReading[];
  let position: string | null = null;
  let matchesPlayed = 0;

  if (input.role === 'player' && input.player) {
    position = input.player.position ?? null;
    group = resolvePositionGroup(position);
    readings = playerToReadings(input.player);
    matchesPlayed = Number(input.player.appearances ?? 0);
  } else if (input.role === 'coach' && input.coach) {
    group = 'COACH';
    readings = coachToReadings(input.coach);
    matchesPlayed = Number(input.coach.matchesManaged ?? 0);
  } else if (input.role === 'team' && input.team) {
    group = 'TEAM';
    readings = teamToReadings(input.team);
    matchesPlayed = Number(input.team.matchesPlayed ?? 0);
  } else {
    return null;
  }

  const computed = computePerformanceScore({
    group,
    position,
    readings,
    matchesPlayed,
    formWindow: { matchScores: input.recentMatchScores, windowSize: 5 },
    consistencyInput: {
      matchScores: input.recentMatchScores,
      seasonAverage: input.seasonAverage || 50,
      careerAverage: input.careerAverage,
    },
    competitionTier: input.competitionTier,
    decayInput: {
      status: (input.decayStatus as any) ?? 'active',
      daysSinceLastEvent: input.daysSinceLastEvent ?? 0,
      lastEventAt: input.lastEventAt ?? null,
    },
    seasonAverage: input.seasonAverage || 50,
    careerAverage: input.careerAverage,
    kpiOverrides: input.kpiOverrides,
  });

  // Attach improvement opportunities
  const opportunities = computeImprovementOpportunities(computed.kpiBreakdown);
  (computed as any).improvementOpportunities = opportunities;

  return computed;
}
