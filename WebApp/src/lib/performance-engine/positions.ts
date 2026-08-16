// ─── Position → PositionGroup mapping ─────────────────────────────
//
// The PlayerProfile.position field uses FIFA-style position codes
// (GK, RB, CB, LB, CDM, CM, CAM, RW, LW, ST). The performance engine
// works on 4 position GROUPS, not 10 positions — KPI weights are
// defined per-group, not per-position.
//
// Midfielder sub-roles (CDM/CM/CAM/RW/LW) get a sub-weight adjustment
// inside the MID table — see MIDFIELD_SUBROLE_ADJUSTMENTS below.

import type { PositionGroup } from './types';

// Full position code → group
export const POSITION_GROUPS: Record<string, PositionGroup> = {
  GK:  'GK',

  // Defenders
  RB:  'DEF',
  CB:  'DEF',
  LB:  'DEF',
  RWB: 'DEF',
  LWB: 'DEF',

  // Midfielders
  CDM: 'MID',
  CM:  'MID',
  CAM: 'MID',
  RM:  'MID',
  LM:  'MID',

  // Wingers (we group them with MID for engine purposes; sub-role
  // adjustment below pulls attacking weight up)
  RW:  'MID',
  LW:  'MID',

  // Forwards
  ST:  'FWD',
  CF:  'FWD',
  SS:  'FWD', // second striker
};

// ── Midfielder sub-role weight shifts ──
// Within MID, a CDM should weight defensive KPIs higher than a CAM.
// These multipliers NUDGE the base MID weights — they don't replace.
export const MIDFIELD_SUBROLE_ADJUSTMENTS: Record<
  string,
  { attacking: number; creativity: number; defensive: number }
> = {
  CDM: { attacking: 0.6, creativity: 0.8, defensive: 1.4 },
  CM:  { attacking: 1.0, creativity: 1.0, defensive: 1.0 },
  CAM: { attacking: 1.3, creativity: 1.4, defensive: 0.6 },
  RM:  { attacking: 1.1, creativity: 1.1, defensive: 0.9 },
  LM:  { attacking: 1.1, creativity: 1.1, defensive: 0.9 },
  RW:  { attacking: 1.4, creativity: 1.0, defensive: 0.5 },
  LW:  { attacking: 1.4, creativity: 1.0, defensive: 0.5 },
};

export function resolvePositionGroup(position?: string | null): PositionGroup {
  if (!position) return 'FWD'; // safe default
  const trimmed = position.trim().toUpperCase();
  return POSITION_GROUPS[trimmed] ?? 'FWD';
}

export function isGoalkeeper(position?: string | null): boolean {
  return resolvePositionGroup(position) === 'GK';
}

export function isDefender(position?: string | null): boolean {
  return resolvePositionGroup(position) === 'DEF';
}

export function isMidfielder(position?: string | null): boolean {
  return resolvePositionGroup(position) === 'MID';
}

export function isForward(position?: string | null): boolean {
  return resolvePositionGroup(position) === 'FWD';
}

// ── Age group resolution ──
// Used for ranking segmentation (U13 / U15 / U17 / U20 / Senior).
// Falls back to "Senior" if no DOB or DOB is missing.
export function resolveAgeGroup(dateOfBirth?: Date | null): string {
  if (!dateOfBirth) return 'Senior';
  const now = new Date();
  const ageMs = now.getTime() - new Date(dateOfBirth).getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  if (ageYears < 13) return 'U13';
  if (ageYears < 15) return 'U15';
  if (ageYears < 17) return 'U17';
  if (ageYears < 20) return 'U20';
  return 'Senior';
}
