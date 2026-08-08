// ─── PerformanceBadge (legacy wrapper) ────────────────────────────
//
// DEPRECATED: This component is kept for backwards compatibility with
// any existing imports. New code should use <PerformanceCard /> directly.
//
// The old implementation used the simple `calculatePlayerPerformance`
// placeholder (hardcoded weights, position-agnostic). It has been
// replaced with the full Performance Engine — see:
//
//   src/lib/performance-engine/         — calculation engine
//   src/components/performance/         — UI components
//   src/app/api/performance/[userId]/   — data API
//
// This wrapper renders the new PerformanceCard in compact mode.

import { PerformanceCard } from '@/components/performance/PerformanceCard';

interface BadgeProps {
  userId?: string;
  // Legacy props (ignored — kept for API compat):
  matchesPlayed?: number;
  goalsPoints?: number;
  assists?: number;
  globalRank?: number;
  categoryRank?: number;
  position?: string;
}

export default function PerformanceBadge({ userId }: BadgeProps) {
  if (!userId) {
    return (
      <div className="rounded-2xl bg-slate-900/60 p-6 text-center text-slate-400">
        <p className="text-sm">Performance data unavailable (no user ID)</p>
      </div>
    );
  }
  return <PerformanceCard userId={userId} compact />;
}
