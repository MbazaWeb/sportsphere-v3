'use client';

// ─── Performance Breakdown (KPI table) ────────────────────────────
//
// Shows the explainable breakdown of how the performance score was
// computed: each KPI's raw value, normalized score, weight, and
// contribution. This makes the ranking transparent — users can see
// exactly why their score is what it is (per user's spec §22, §29).
//
// The KPI readings come from the user's typed profile (PlayerProfile,
// CoachProfile, TeamProfile). We re-compute the breakdown client-side
// from the same engine the server uses, so the UI always reflects
// the canonical calculation.

import { useEffect, useState } from 'react';
import {
  computeWeightedKpiScore,
  resolvePositionGroup,
} from '@/lib/performance-engine';
import { apiFetch } from '@/lib/api';
import type { KPIReading, PositionGroup } from '@/lib/performance-engine';

interface PerformanceBreakdownProps {
  userId: string;
  events: Array<{
    id: string; eventType: string; value: number;
    matchDate: string; competition: string | null;
    verificationStatus: string; pointsCalculated: number;
  }>;
}

interface BreakdownData {
  readings: KPIReading[];
  group: PositionGroup;
  position: string | null;
  role: string;
}

export function PerformanceBreakdown({ userId }: PerformanceBreakdownProps) {
  const [data, setData] = useState<BreakdownData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Fetch the user's typed profile to compute the breakdown locally.
      // This keeps the breakdown in sync with the typed profile columns
      // even if the cached PerformanceProfile is stale.
      const res = await apiFetch(`/api/performance/${userId}?include=readings`);
      if (!res.ok) return;
      const json = await res.json();
      if (!cancelled && json.readings) {
        setData({
          readings: json.readings,
          group: json.group,
          position: json.position,
          role: json.role,
        });
      } else if (!cancelled) {
        // Fallback: no readings endpoint yet — leave null
        setData(null);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (!data) {
    return (
      <div className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          Performance Breakdown
        </h3>
        <p className="text-sm text-slate-500 text-center py-4">
          Detailed KPI breakdown will appear here once match data is recorded.
        </p>
      </div>
    );
  }

  const result = computeWeightedKpiScore(data.group, data.position, data.readings);
  const positive = result.breakdown.filter((b) => b.contribution >= 0);
  const negative = result.breakdown.filter((b) => b.contribution < 0);

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
        Performance Breakdown
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-700/50">
              <th className="py-2 pr-3">KPI</th>
              <th className="py-2 px-3 text-right">Value</th>
              <th className="py-2 px-3 text-right">Score</th>
              <th className="py-2 px-3 text-right">Weight</th>
              <th className="py-2 pl-3 text-right">Contribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {positive.map((row) => (
              <tr key={row.key} className="hover:bg-slate-800/30">
                <td className="py-2 pr-3 font-medium text-slate-200">{row.label}</td>
                <td className="py-2 px-3 text-right tabular-nums text-slate-300">{row.rawValue}</td>
                <td className="py-2 px-3 text-right tabular-nums text-slate-300">{row.normalizedScore.toFixed(0)}</td>
                <td className="py-2 px-3 text-right tabular-nums text-slate-500">{(row.weight * 100).toFixed(0)}%</td>
                <td className="py-2 pl-3 text-right tabular-nums font-bold text-emerald-400">
                  +{row.contribution.toFixed(1)}
                </td>
              </tr>
            ))}
            {negative.length > 0 && (
              <>
                <tr>
                  <td colSpan={5} className="pt-4 pb-1 text-xs uppercase tracking-wider text-rose-400/80">
                    Penalties
                  </td>
                </tr>
                {negative.map((row) => (
                  <tr key={row.key} className="hover:bg-slate-800/30">
                    <td className="py-2 pr-3 font-medium text-slate-200">{row.label}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-300">{row.rawValue}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-300">{row.normalizedScore.toFixed(0)}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-500">—</td>
                    <td className="py-2 pl-3 text-right tabular-nums font-bold text-rose-400">
                      {row.contribution.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-700/50">
              <td colSpan={4} className="py-3 text-right text-xs uppercase tracking-wider text-slate-400">
                Total Weighted Score
              </td>
              <td className="py-3 pl-3 text-right tabular-nums text-lg font-bold text-emerald-400">
                {result.score.toFixed(1)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Score is the weighted sum of normalized KPI scores. Final performance
        score applies consistency, form, competition, and confidence multipliers.
      </p>
    </div>
  );
}
