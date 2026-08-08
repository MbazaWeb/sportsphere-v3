import React from 'react';
import { calculatePlayerPerformance } from '@/lib/performance';

interface BadgeProps {
  matchesPlayed: number;
  goalsPoints: number;
  assists: number;
  globalRank: number;
  categoryRank: number;
  position: string;
}

export default function PerformanceBadge({
  matchesPlayed,
  goalsPoints,
  assists,
  globalRank,
  categoryRank,
  position,
}: BadgeProps) {
  const perf = calculatePlayerPerformance({ matchesPlayed, goalsPoints, assists });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white border border-emerald-500/30 shadow-2xl">
      {/* Background Glow */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Score & Tier */}
        <div className="flex items-center gap-5">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-emerald-400/40 bg-slate-950/80 shadow-inner">
            <div className="text-center">
              <span className="block text-3xl font-black text-emerald-400 tracking-tight">
                {perf.ppiScore}
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                PPI SCORE
              </span>
            </div>
          </div>

          <div>
            <span className={`inline-block rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wide shadow-sm ${perf.tierColor}`}>
              🏆 {perf.tier}
            </span>
            <h2 className="mt-2 text-xl font-bold text-slate-100">
              {perf.efficiencyRate}% <span className="text-sm font-normal text-slate-400">Match Efficiency</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Based on {goalsPoints} Goals & {assists} Assists in {matchesPlayed} Matches
            </p>
          </div>
        </div>

        {/* Right: Global & Position Ranks */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-around border-t md:border-t-0 md:border-l border-slate-700/60 pt-4 md:pt-0 md:pl-8">
          <div className="text-center">
            <span className="block text-2xl font-extrabold text-amber-400">#{globalRank}</span>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">World Rank</span>
          </div>

          <div className="h-8 w-px bg-slate-700/60" />

          <div className="text-center">
            <span className="block text-2xl font-extrabold text-blue-400">#{categoryRank}</span>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Rank ({position})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
