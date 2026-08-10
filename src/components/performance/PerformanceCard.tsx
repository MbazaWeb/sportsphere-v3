'use client';

// ─── Performance Card ─────────────────────────────────────────────
//
// Replaces the old PerformanceBadge.tsx (which used the simple
// `calculatePlayerPerformance` placeholder). This card shows the full
// performance story:
//
//   ┌─ Headline ───────────────────────┐
//   │  78%  Performance Score          │
//   │  A+ Excellent                    │
//   │  1,200 Points                    │
//   │  #110 / 4,850 Amateur Players    │
//   │  Top 2.3%  ↑ +14 positions        │
//   └──────────────────────────────────┘
//   ┌─ Current Form ───────────────────┐
//   │  91%  Excellent ↑                 │
//   │  [sparkline of last 5 matches]   │
//   └──────────────────────────────────┘
//   ┌─ KPI Breakdown ──────────────────┐
//   │  Goals      18   +280   86%      │
//   │  Assists    11   +165   55%      │
//   │  ...                              │
//   └──────────────────────────────────┘
//   ┌─ Ranking Breakdown ──────────────┐
//   │  Global    #1,102                │
//   │  Country   #284                  │
//   │  Category  #110                  │
//   │  Position  #42                   │
//   └──────────────────────────────────┘
//   ┌─ Improve Next ───────────────────┐
//   │  • Increase assist contribution  │
//   │  • Improve consistency           │
//   │  Potential: #110 → ~#85          │
//   └──────────────────────────────────┘
//   ┌─ Next Milestone ─────────────────┐
//   │  1,250 Points                     │
//   │  50 points to next milestone      │
//   └──────────────────────────────────┘

import { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Trophy, Target, Flame,
  ChevronUp, ChevronDown, Activity, Award, Zap, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { getTier } from '@/lib/performance-engine';
import { PerformanceBreakdown } from './PerformanceBreakdown';
import { PerformanceTrend } from './PerformanceTrend';
import { PerformanceOpportunities } from './PerformanceOpportunities';

interface PerformanceCardProps {
  userId: string;
  // Optional: show compact variant (no breakdown/trend)
  compact?: boolean;
}

interface PerformanceData {
  user: {
    id: string; name: string; handle: string; avatarUrl: string | null;
    role: string; position: string | null; playerType: string | null;
    country: string | null;
  };
  profile: {
    performanceScore: number;
    totalPoints: number;
    tier: string;
    formScore: number;
    consistencyScore: number;
    improvementScore: number;
    trendDirection: string;
    trendDelta: number;
    rankGlobal: number;
    rankCountry: number;
    rankRegion: number;
    rankCategory: number;
    rankPosition: number;
    rankCompetition: number;
    rankForm: number;
    rankSeason: number;
    rankCareer: number;
    rankImprovement: number;
    rankConsistency: number;
    rankMovement: number;
    categoryBucket: string;
    nextMilestonePoints: number;
    nextMilestoneRank: number;
    pointsAheadOfNext: number;
    pointsBehindNext: number;
    dataConfidence: number;
    decayStatus: string;
    lastEventAt: string | null;
    lastCalculatedAt: string | null;
    improvementOpportunities: Array<{
      kpi: string; label: string; current: number;
      potential: number; pointsGain: number; rankGainEstimate: number;
    }>;
  } | null;
  events: Array<{
    id: string; eventType: string; value: number;
    matchDate: string; competition: string | null;
    verificationStatus: string; pointsCalculated: number;
  }>;
  transactions: Array<{
    id: string; amount: number; reason: string; reasonCode: string;
    balanceAfter: number; verified: boolean; createdAt: string;
  }>;
  snapshots: Array<{
    id: string; performanceScore: number; totalPoints: number;
    capturedAt: string; tier: string;
  }>;
  categorySize: number;
  percentile: number | null;
}

export function PerformanceCard({ userId, compact = false }: PerformanceCardProps) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/performance/${userId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 animate-pulse">
        <div className="h-32 w-full rounded-xl bg-slate-700/40" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-slate-900/60 p-6 text-center text-slate-400">
        <AlertCircle className="mx-auto mb-2 h-6 w-6" />
        <p className="text-sm">Performance data unavailable</p>
      </div>
    );
  }

  // No profile yet — user has no verified events
  if (!data.profile) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-700/50 p-6 text-center">
        <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-500" />
        <h3 className="text-lg font-bold text-slate-200">Unranked</h3>
        <p className="mt-1 text-sm text-slate-400">
          No verified performance events yet. Once matches are recorded and
          verified, your performance score and rank will appear here.
        </p>
      </div>
    );
  }

  const p = data.profile;
  const tierMeta = getTier(p.tier as any);

  return (
    <div className="space-y-4">
      {/* ── Headline ── */}
      <HeadlineCard
        score={p.performanceScore}
        tier={p.tier}
        tierLabel={tierMeta.label}
        tierColor={tierMeta.color}
        tierBg={tierMeta.bg}
        tierBorder={tierMeta.border}
        totalPoints={p.totalPoints}
        rankCategory={p.rankCategory}
        categorySize={data.categorySize}
        percentile={data.percentile}
        rankMovement={p.rankMovement}
        role={data.user.role}
        position={data.user.position}
        playerType={data.user.playerType}
      />

      {/* ── Form & Consistency ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormCard
          formScore={p.formScore}
          trendDirection={p.trendDirection}
          trendDelta={p.trendDelta}
        />
        <ConsistencyCard
          consistencyScore={p.consistencyScore}
          improvementScore={p.improvementScore}
          dataConfidence={p.dataConfidence}
          decayStatus={p.decayStatus}
        />
      </div>

      {!compact && (
        <>
          {/* ── Trend chart ── */}
          <PerformanceTrend snapshots={data.snapshots} />

          {/* ── KPI Breakdown ── */}
          <PerformanceBreakdown
            userId={userId}
            events={data.events}
          />

          {/* ── Ranking Breakdown ── */}
          <RankingBreakdownCard
            rankGlobal={p.rankGlobal}
            rankCountry={p.rankCountry}
            rankRegion={p.rankRegion}
            rankCategory={p.rankCategory}
            rankPosition={p.rankPosition}
            rankForm={p.rankForm}
            rankSeason={p.rankSeason}
            rankCareer={p.rankCareer}
            rankImprovement={p.rankImprovement}
            rankConsistency={p.rankConsistency}
            categorySize={data.categorySize}
          />

          {/* ── Improve Next ── */}
          <PerformanceOpportunities
            opportunities={p.improvementOpportunities}
            currentRank={p.rankCategory}
          />

          {/* ── Next Milestone ── */}
          <MilestoneCard
            totalPoints={p.totalPoints}
            nextMilestonePoints={p.nextMilestonePoints}
            pointsBehindNext={p.pointsBehindNext}
            pointsAheadOfNext={p.pointsAheadOfNext}
            nextMilestoneRank={p.nextMilestoneRank}
            currentRank={p.rankCategory}
          />

          {/* ── Recent Activity (transactions) ── */}
          <RecentActivityCard transactions={data.transactions} />

          {/* ── Last updated ── */}
          {p.lastCalculatedAt && (
            <p className="text-center text-xs text-slate-500">
              Last updated {formatRelativeTime(p.lastCalculatedAt)}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Headline Card
// ────────────────────────────────────────────────────────────────

function HeadlineCard({
  score, tier, tierLabel, tierColor, tierBg, tierBorder,
  totalPoints, rankCategory, categorySize, percentile, rankMovement,
  role, position, playerType,
}: {
  score: number; tier: string; tierLabel: string;
  tierColor: string; tierBg: string; tierBorder: string;
  totalPoints: number; rankCategory: number; categorySize: number;
  percentile: number | null; rankMovement: number;
  role: string; position: string | null; playerType: string | null;
}) {
  const formattedPoints = totalPoints.toLocaleString();
  const categoryLabel = buildCategoryLabel(role, position, playerType);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-white border border-emerald-500/30 shadow-2xl">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Score & tier */}
        <div className="flex items-center gap-5">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-emerald-400/40 bg-slate-950/80 shadow-inner">
            <div className="text-center">
              <span className="block text-4xl font-black text-emerald-400 tracking-tight">
                {Math.round(score)}
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Score
              </span>
            </div>
          </div>

          <div>
            <span className={cn('inline-block rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wide shadow-sm', tierColor, tierBg, tierBorder)}>
              <Trophy className="inline h-3 w-3 mr-1" />
              {tier} — {tierLabel}
            </span>
            <h2 className="mt-2 text-2xl font-bold text-slate-100">
              {formattedPoints} <span className="text-sm font-normal text-slate-400">Points</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {categoryLabel}
            </p>
          </div>
        </div>

        {/* Rank */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-around border-t md:border-t-0 md:border-l border-slate-700/60 pt-4 md:pt-0 md:pl-8">
          <div className="text-center">
            <div className="flex items-baseline gap-1 justify-center">
              <span className="block text-3xl font-extrabold text-amber-400">#{rankCategory || '—'}</span>
              {rankMovement > 0 && (
                <span className="flex items-center text-xs font-bold text-emerald-400">
                  <ChevronUp className="h-3 w-3" /> {rankMovement}
                </span>
              )}
              {rankMovement < 0 && (
                <span className="flex items-center text-xs font-bold text-rose-400">
                  <ChevronDown className="h-3 w-3" /> {Math.abs(rankMovement)}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {categoryLabel}
            </span>
          </div>

          {percentile !== null && percentile > 0 && (
            <>
              <div className="h-8 w-px bg-slate-700/60" />
              <div className="text-center">
                <span className="block text-2xl font-extrabold text-blue-400">
                  Top {percentile < 1 ? '<1' : percentile.toFixed(1)}%
                </span>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  of {categorySize.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function buildCategoryLabel(role: string, position: string | null, playerType: string | null): string {
  if (role === 'coach') return 'Coaches';
  if (role === 'team') return 'Teams';
  const parts: string[] = [];
  if (playerType) parts.push(playerType);
  if (position) parts.push(position + 's');
  return parts.length > 0 ? parts.join(' ') : 'Players';
}

// ────────────────────────────────────────────────────────────────
// Form Card
// ────────────────────────────────────────────────────────────────

function FormCard({
  formScore, trendDirection, trendDelta,
}: {
  formScore: number; trendDirection: string; trendDelta: number;
}) {
  const trendIcon = trendDirection === 'up' ? TrendingUp
    : trendDirection === 'down' ? TrendingDown : Minus;
  const trendColor = trendDirection === 'up' ? 'text-emerald-400'
    : trendDirection === 'down' ? 'text-rose-400' : 'text-slate-400';
  const TrendIcon = trendIcon;

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          <Flame className="inline h-3 w-3 mr-1" /> Current Form
        </span>
        <span className={cn('flex items-center text-xs font-bold', trendColor)}>
          <TrendIcon className="h-3 w-3 mr-1" />
          {Math.abs(trendDelta).toFixed(1)}%
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-100">{Math.round(formScore)}%</span>
        <span className={cn('text-sm font-medium', trendColor)}>
          {trendDirection === 'up' ? 'Improving' : trendDirection === 'down' ? 'Declining' : 'Stable'}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-700/50 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
          style={{ width: `${formScore}%` }}
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Consistency Card
// ────────────────────────────────────────────────────────────────

function ConsistencyCard({
  consistencyScore, improvementScore, dataConfidence, decayStatus,
}: {
  consistencyScore: number; improvementScore: number;
  dataConfidence: number; decayStatus: string;
}) {
  const consistencyLabel = consistencyScore >= 80 ? 'Strong'
    : consistencyScore >= 60 ? 'Stable'
    : consistencyScore >= 40 ? 'Variable'
    : 'Inconsistent';

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          <Activity className="inline h-3 w-3 mr-1" /> Consistency
        </span>
        {decayStatus !== 'active' && (
          <span className="text-xs font-bold text-amber-400 capitalize">
            {decayStatus.replace(/-/g, ' ')}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-100">{Math.round(consistencyScore)}%</span>
        <span className="text-sm font-medium text-slate-400">{consistencyLabel}</span>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
        <span>Improvement: <span className="text-slate-300 font-medium">{Math.round(improvementScore)}%</span></span>
        <span>Confidence: <span className="text-slate-300 font-medium">{Math.round(dataConfidence * 100)}%</span></span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Ranking Breakdown Card
// ────────────────────────────────────────────────────────────────

function RankingBreakdownCard({
  rankGlobal, rankCountry, rankRegion, rankCategory, rankPosition,
  rankForm, rankSeason, rankCareer, rankImprovement, rankConsistency,
  categorySize,
}: {
  rankGlobal: number; rankCountry: number; rankRegion: number;
  rankCategory: number; rankPosition: number; rankForm: number;
  rankSeason: number; rankCareer: number; rankImprovement: number;
  rankConsistency: number; categorySize: number;
}) {
  const ranks = [
    { label: 'Global',       rank: rankGlobal,       icon: Trophy },
    { label: 'Country',      rank: rankCountry,      icon: Award },
    { label: 'Region',       rank: rankRegion,       icon: Award },
    { label: 'Category',     rank: rankCategory,     icon: Target },
    { label: 'Position',     rank: rankPosition,     icon: Target },
    { label: 'Current Form', rank: rankForm,         icon: Flame },
    { label: 'Season',       rank: rankSeason,       icon: Activity },
    { label: 'Career',       rank: rankCareer,       icon: Trophy },
    { label: 'Improvement',  rank: rankImprovement,  icon: TrendingUp },
    { label: 'Consistency',  rank: rankConsistency,  icon: Zap },
  ].filter((r) => r.rank > 0);

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
        Ranking Breakdown
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {ranks.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.label} className="text-center">
              <Icon className="mx-auto mb-1 h-4 w-4 text-slate-500" />
              <div className="text-lg font-bold text-slate-100">#{r.rank}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{r.label}</div>
            </div>
          );
        })}
      </div>
      {categorySize > 0 && (
        <p className="mt-3 text-center text-xs text-slate-500">
          Competing against {categorySize.toLocaleString()} players in your category
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Milestone Card
// ────────────────────────────────────────────────────────────────

function MilestoneCard({
  totalPoints, nextMilestonePoints, pointsBehindNext, pointsAheadOfNext,
  nextMilestoneRank, currentRank,
}: {
  totalPoints: number; nextMilestonePoints: number;
  pointsBehindNext: number; pointsAheadOfNext: number;
  nextMilestoneRank: number; currentRank: number;
}) {
  const target = nextMilestonePoints || (totalPoints + 50);
  const remaining = Math.max(0, target - totalPoints);
  const progress = target > 0 ? Math.min(100, (totalPoints / target) * 100) : 0;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-950/30 to-slate-900/60 border border-amber-700/30 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
          <Target className="inline h-3 w-3 mr-1" /> Next Milestone
        </h3>
        {nextMilestoneRank > 0 && (
          <span className="text-xs font-medium text-slate-400">
            Reach rank #{nextMilestoneRank}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-amber-300">{target.toLocaleString()}</span>
        <span className="text-xs text-slate-400">points target</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-700/50 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-slate-400">
          {remaining > 0
            ? `${remaining.toLocaleString()} points to go`
            : 'Milestone reached!'}
        </span>
        {pointsAheadOfNext > 0 && (
          <span className="text-emerald-400">
            +{pointsAheadOfNext} ahead of next
          </span>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Recent Activity (point transactions)
// ────────────────────────────────────────────────────────────────

function RecentActivityCard({
  transactions,
}: {
  transactions: Array<{
    id: string; amount: number; reason: string; reasonCode: string;
    balanceAfter: number; verified: boolean; createdAt: string;
  }>;
}) {
  if (!transactions.length) return null;

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-700/50 p-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
        Recent Activity
      </h3>
      <div className="space-y-2">
        {transactions.slice(0, 5).map((t) => (
          <div key={t.id} className="flex items-center justify-between text-sm">
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 truncate">{t.reason}</p>
              <p className="text-xs text-slate-500">
                {formatRelativeTime(t.createdAt)} · Balance: {t.balanceAfter.toLocaleString()}
              </p>
            </div>
            <span className={cn(
              'ml-2 font-bold tabular-nums',
              t.amount > 0 ? 'text-emerald-400' : t.amount < 0 ? 'text-rose-400' : 'text-slate-400',
            )}>
              {t.amount > 0 ? '+' : ''}{t.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
