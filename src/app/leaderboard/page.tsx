'use client';

// ─── Leaderboard Page ─────────────────────────────────────────────
//
// Full-screen rankings page showing top Players, Coaches, and Teams
// ranked by REAL PERFORMANCE POINTS (from the audited PerformanceProfile
// ledger — NOT follower count).
//
// Multi-dimensional ranking:
//   - Overall (total points)
//   - Current Form (formScore)
//   - Improvement (improvementScore)
//   - Consistency (consistencyScore)
//
// Filters:
//   - Role: All / Players / Coaches / Teams
//   - Position (players only): All / GK / DEF / MID / FWD
//   - Player Type: All / Professional / Semi-Pro / Amateur / Youth
//
// Accessible at /leaderboard. Can be linked from Home, Scores, or
// anywhere else.

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Trophy, Flame, TrendingUp, Activity, Crown, Medal, Award,
  ChevronLeft, Search, Filter, ChevronUp, ChevronDown, Users,
  Footprints, Megaphone, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTier } from '@/lib/performance-engine';

// ── Types ──
interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  avatarInitials: string | null;
  role: string;
  isPro: boolean;
  isVerified: boolean;
  points: number;
  performanceScore: number;
  tier: string;
  formScore: number;
  consistencyScore: number;
  improvementScore: number;
  rankMovement: number;
  categoryBucket: string;
  position: string | null;
  playerType: string | null;
  lastEventAt: string | null;
}

type Dimension = 'overall' | 'form' | 'improvement' | 'consistency';
type RoleFilter = 'all' | 'player' | 'coach' | 'team';
type PositionFilter = 'all' | 'GK' | 'DEF' | 'MID' | 'FWD';

const DIMENSIONS: Array<{ id: Dimension; label: string; icon: typeof Trophy }> = [
  { id: 'overall',      label: 'Overall',      icon: Trophy },
  { id: 'form',         label: 'Current Form', icon: Flame },
  { id: 'improvement',  label: 'Improvement',  icon: TrendingUp },
  { id: 'consistency',  label: 'Consistency',  icon: Activity },
];

const ROLES: Array<{ id: RoleFilter; label: string; icon: typeof Users }> = [
  { id: 'all',    label: 'All',     icon: Crown },
  { id: 'player', label: 'Players', icon: Footprints },
  { id: 'coach',  label: 'Coaches', icon: Megaphone },
  { id: 'team',   label: 'Teams',   icon: Users },
];

const POSITIONS: Array<{ id: PositionFilter; label: string }> = [
  { id: 'all', label: 'All Positions' },
  { id: 'GK',  label: 'Goalkeepers' },
  { id: 'DEF', label: 'Defenders' },
  { id: 'MID', label: 'Midfielders' },
  { id: 'FWD', label: 'Forwards' },
];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dimension, setDimension] = useState<Dimension>('overall');
  const [role, setRole] = useState<RoleFilter>('all');
  const [position, setPosition] = useState<PositionFilter>('all');
  const [limit, setLimit] = useState(25);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        dimension,
        limit: String(limit),
      });
      if (role !== 'all') params.set('role', role);
      if (position !== 'all') params.set('position', position);

      const res = await fetch(`/api/leaderboard?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [dimension, role, position, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Reset position filter when role changes away from player
  useEffect(() => {
    if (role !== 'player' && role !== 'all') {
      setPosition('all');
    }
  }, [role]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-black text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                Performance Rankings
              </h1>
              <p className="text-[11px] text-slate-400">
                Ranked by verified performance points
              </p>
            </div>
          </div>

          {/* Dimension tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
            {DIMENSIONS.map((d) => {
              const Icon = d.icon;
              const isActive = dimension === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setDimension(d.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Filters ── */}
      <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
        {/* Role filter */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isActive = role === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all border',
                  isActive
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:text-white'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Position filter (only for players/all) */}
        {(role === 'player' || role === 'all') && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {POSITIONS.map((p) => {
              const isActive = position === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPosition(p.id)}
                  className={cn(
                    'rounded-md px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-slate-800/30 text-slate-500 hover:text-slate-300 border border-transparent'
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Leaderboard list ── */}
      <main className="max-w-2xl mx-auto px-4 pb-24">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-800"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-rose-950/30 border border-rose-800/40 p-6 text-center">
            <p className="text-sm text-rose-300">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="mt-3 rounded-lg bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/30"
            >
              Retry
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl bg-slate-800/40 border border-slate-700/40 p-8 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <h3 className="text-base font-bold text-slate-300">No ranked entries yet</h3>
            <p className="mt-1 text-xs text-slate-500">
              Performance rankings appear once verified match events are recorded.
              Rankings are based on audited performance points, not popularity.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => (
              <LeaderboardRow
                key={entry.id}
                entry={entry}
                dimension={dimension}
                isTopThree={idx < 3}
              />
            ))}

            {entries.length >= limit && (
              <button
                onClick={() => setLimit((l) => Math.min(50, l + 25))}
                className="w-full rounded-2xl bg-slate-800/50 border border-slate-700/40 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Load more
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Leaderboard Row ────────────────────────────────────────────

function LeaderboardRow({
  entry,
  dimension,
  isTopThree,
}: {
  entry: LeaderboardEntry;
  dimension: Dimension;
  isTopThree: boolean;
}) {
  const tierMeta = getTier(entry.tier as any);

  // Score to display based on dimension
  const scoreValue =
    dimension === 'form' ? entry.formScore
    : dimension === 'improvement' ? entry.improvementScore
    : dimension === 'consistency' ? entry.consistencyScore
    : entry.performanceScore;

  // Rank badge styling for top 3
  const rankBadgeClass =
    entry.rank === 1 ? 'bg-amber-400 text-black'
    : entry.rank === 2 ? 'bg-slate-300 text-black'
    : entry.rank === 3 ? 'bg-amber-700 text-white'
    : 'bg-slate-800 text-slate-400';

  const roleIcon =
    entry.role === 'player' ? Footprints
    : entry.role === 'coach' ? Megaphone
    : entry.role === 'team' ? Users
    : Crown;

  const RoleIcon = roleIcon;

  return (
    <Link
      href={`/@${entry.handle}`}
      className={cn(
        'flex items-center gap-3 rounded-2xl border p-3 transition-all hover:scale-[1.01]',
        isTopThree
          ? 'bg-gradient-to-r from-slate-800/60 to-slate-900/60 border-amber-500/20'
          : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50'
      )}
    >
      {/* Rank */}
      <div className={cn(
        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black',
        rankBadgeClass
      )}>
        {entry.rank <= 3 ? (
          <Crown className="h-5 w-5" />
        ) : (
          entry.rank
        )}
      </div>

      {/* Avatar + identity */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative flex-shrink-0">
          {entry.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.avatarUrl}
              alt={entry.name}
              className="h-11 w-11 rounded-full object-cover border border-slate-700"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-sm font-bold text-white">
              {entry.avatarInitials || entry.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 border border-slate-700">
            <RoleIcon className="h-3 w-3 text-slate-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-white truncate">{entry.name}</p>
            {entry.isPro && (
              <span className="flex-shrink-0 rounded bg-amber-400 px-1 py-0.5 text-[8px] font-black text-black uppercase">
                Pro
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            @{entry.handle}
            {entry.position && <span className="ml-1 text-slate-500">· {entry.position}</span>}
            {entry.playerType && <span className="ml-1 text-slate-500">· {entry.playerType}</span>}
          </p>

          {/* Tier + movement */}
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
              tierMeta.color, tierMeta.bg, tierMeta.border
            )}>
              <Award className="h-2.5 w-2.5" />
              {entry.tier}
            </span>
            {entry.rankMovement !== 0 && (
              <span className={cn(
                'flex items-center gap-0.5 text-[10px] font-bold',
                entry.rankMovement > 0 ? 'text-emerald-400' : 'text-rose-400'
              )}>
                {entry.rankMovement > 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {Math.abs(entry.rankMovement)}
              </span>
            )}
            {entry.rankMovement === 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                <Minus className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="text-right flex-shrink-0">
        {dimension === 'overall' ? (
          <>
            <p className="text-lg font-black text-amber-400 tabular-nums">
              {entry.points.toLocaleString()}
            </p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Points</p>
          </>
        ) : (
          <>
            <p className="text-lg font-black text-emerald-400 tabular-nums">
              {Math.round(scoreValue)}
            </p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">
              {dimension === 'form' ? 'Form' : dimension === 'improvement' ? 'Improv.' : 'Consist.'}
            </p>
          </>
        )}
        <p className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
          {Math.round(entry.performanceScore)} score
        </p>
      </div>
    </Link>
  );
}
