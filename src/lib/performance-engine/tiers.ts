// ─── Performance Tiers ────────────────────────────────────────────
//
// Maps a 0–100 performance score to a tier label (S+ → D) plus the
// Tailwind color classes used by the Performance UI.

import type { Tier, TierMeta } from './types';

export const TIERS: TierMeta[] = [
  { tier: 'S+', label: 'Elite',          minScore: 92, color: 'text-amber-300',  bg: 'bg-amber-400/10',   border: 'border-amber-400/50' },
  { tier: 'S',  label: 'Outstanding',    minScore: 85, color: 'text-amber-400',  bg: 'bg-amber-500/10',   border: 'border-amber-500/50' },
  { tier: 'A+', label: 'Excellent',      minScore: 78, color: 'text-emerald-300',bg: 'bg-emerald-400/10', border: 'border-emerald-400/50' },
  { tier: 'A',  label: 'Very Good',      minScore: 70, color: 'text-emerald-400',bg: 'bg-emerald-500/10', border: 'border-emerald-500/50' },
  { tier: 'B+', label: 'Good',           minScore: 62, color: 'text-blue-300',   bg: 'bg-blue-400/10',    border: 'border-blue-400/50' },
  { tier: 'B',  label: 'Average',        minScore: 52, color: 'text-blue-400',   bg: 'bg-blue-500/10',    border: 'border-blue-500/50' },
  { tier: 'C',  label: 'Developing',     minScore: 38, color: 'text-slate-300',  bg: 'bg-slate-400/10',   border: 'border-slate-400/50' },
  { tier: 'D',  label: 'Below Average',  minScore: 1,  color: 'text-rose-300',   bg: 'bg-rose-400/10',    border: 'border-rose-400/50' },
  { tier: 'Unranked', label: 'Unranked', minScore: 0,  color: 'text-slate-500',  bg: 'bg-slate-800/50',   border: 'border-slate-700' },
];

export function tierForScore(score: number): TierMeta {
  if (!score || score <= 0) return TIERS[TIERS.length - 1];
  for (const tier of TIERS) {
    if (score >= tier.minScore) return tier;
  }
  return TIERS[TIERS.length - 1];
}

export function getTier(tier: Tier): TierMeta {
  return TIERS.find((t) => t.tier === tier) ?? TIERS[TIERS.length - 1];
}
