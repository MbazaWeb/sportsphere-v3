'use client';

// ─── Performance Trend (sparkline + improvement %) ────────────────
//
// Renders the last N snapshots as an inline SVG sparkline. Shows the
// signed delta % over the window (e.g. "+12.4% improvement" or
// "-6.8% decline") per user's spec §20.

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceTrendProps {
  snapshots: Array<{
    id: string;
    performanceScore: number;
    totalPoints: number;
    capturedAt: string;
    tier: string;
  }>;
}

export function PerformanceTrend({ snapshots }: PerformanceTrendProps) {
  // Chronological order (oldest first) for the sparkline
  const points = useMemo(() => {
    return snapshots
      .slice(0, 30)
      .reverse()
      .map((s) => ({
        score: s.performanceScore,
        points: s.totalPoints,
        date: new Date(s.capturedAt),
      }));
  }, [snapshots]);

  if (points.length < 2) {
    return (
      <div className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-4">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Performance Trend
        </h3>
        <p className="text-sm text-slate-500 py-4 text-center">
          Trend chart will appear after multiple snapshots are recorded
          (typically 7+ days of activity).
        </p>
      </div>
    );
  }

  const first = points[0];
  const last = points[points.length - 1];
  const deltaPct = first.score > 0
    ? ((last.score - first.score) / first.score) * 100
    : 0;
  const isUp = deltaPct > 0.5;
  const isDown = deltaPct < -0.5;
  const trendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const trendColor = isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-slate-400';
  const TrendIcon = trendIcon;

  // SVG sparkline
  const width = 320;
  const height = 80;
  const padding = 8;
  const scores = points.map((p) => p.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = Math.max(1, maxScore - minScore);

  const stepX = (width - padding * 2) / Math.max(1, points.length - 1);
  const pathData = points.map((p, i) => {
    const x = padding + i * stepX;
    const y = padding + (height - padding * 2) * (1 - (p.score - minScore) / range);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Area fill path
  const lastX = padding + (points.length - 1) * stepX;
  const areaPath = `${pathData} L${lastX.toFixed(1)},${height - padding} L${padding},${height - padding} Z`;

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Performance Trend
        </h3>
        <span className={cn('flex items-center text-sm font-bold', trendColor)}>
          <TrendIcon className="h-4 w-4 mr-1" />
          {isUp ? '+' : ''}{deltaPct.toFixed(1)}%
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-20"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#trend-gradient)" />
        <path
          d={pathData}
          fill="none"
          stroke={isUp ? 'rgb(52 211 153)' : isDown ? 'rgb(251 113 133)' : 'rgb(148 163 184)'}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* End point marker */}
        <circle
          cx={lastX}
          cy={padding + (height - padding * 2) * (1 - (last.score - minScore) / range)}
          r="3"
          fill={isUp ? 'rgb(52 211 153)' : isDown ? 'rgb(251 113 133)' : 'rgb(148 163 184)'}
        />
      </svg>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{formatDate(points[0].date)}</span>
        <span className="text-slate-300">
          {first.score.toFixed(0)} → {last.score.toFixed(0)}
        </span>
        <span>{formatDate(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
