'use client';

// ─── Improvement Opportunities ("What should I improve?") ─────────
//
// Per user's spec §23: identifies the weakest KPIs and projects the
// rank gain if the user improved them to a realistic peer-group target.
// Clearly labeled as a PROJECTION, not a guarantee.

import { Lightbulb, ArrowUpRight } from 'lucide-react';

interface PerformanceOpportunitiesProps {
  opportunities: Array<{
    kpi: string;
    label: string;
    current: number;
    potential: number;
    pointsGain: number;
    rankGainEstimate: number;
  }>;
  currentRank: number;
}

export function PerformanceOpportunities({
  opportunities, currentRank,
}: PerformanceOpportunitiesProps) {
  if (!opportunities || opportunities.length === 0) {
    return null;
  }

  // Aggregate projection
  const totalPointsGain = opportunities.reduce((s, o) => s + o.pointsGain, 0);
  const totalRankGain = opportunities.reduce((s, o) => s + o.rankGainEstimate, 0);
  const projectedRank = Math.max(1, currentRank - totalRankGain);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-950/30 to-slate-900/60 border border-blue-700/30 p-4">
      <h3 className="mb-3 flex items-center text-xs font-bold uppercase tracking-wider text-blue-400">
        <Lightbulb className="h-3 w-3 mr-1" /> Improve Next
      </h3>

      <ul className="space-y-2">
        {opportunities.map((o, i) => (
          <li key={o.kpi} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-300">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-slate-200">
                Improve <span className="font-semibold">{o.label.toLowerCase()}</span>
              </p>
              <p className="text-xs text-slate-500">
                Current: <span className="text-slate-300">{o.current}</span>
                {' · '}
                Potential: <span className="text-slate-300">{o.potential}</span>
                {' · '}
                <span className="text-emerald-400 font-medium">+{o.pointsGain} pts</span>
              </p>
            </div>
          </li>
        ))}
      </ul>

      {currentRank > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Potential ranking gain</span>
            <span className="flex items-center gap-1 font-bold text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
              #{currentRank} → ~#{projectedRank}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 italic">
            Projection based on peer-group medians. Actual rank depends on
            competition performance and other players' activity.
          </p>
        </div>
      )}
    </div>
  );
}
