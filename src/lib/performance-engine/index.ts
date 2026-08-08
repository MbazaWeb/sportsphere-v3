// ─── Performance Engine — Public API ──────────────────────────────
//
// Import everything from this barrel. The calculation engine is
// pure (no Prisma); persistence/recalc lives in `persistence.ts`.

export * from './types';
export * from './positions';
export * from './tiers';
export * from './kpi-weights';
export * from './calculator';
export { computePerformanceFromTypedProfile } from './adapter';
export { recalcPerformanceProfile, getPerformanceProfile, getPerformanceProfileWithActivity, recordPerformanceEvent, runDailyDecay, runDailySnapshot, recomputeRankings } from './persistence';
