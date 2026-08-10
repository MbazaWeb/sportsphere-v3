'use client';

import { useMemo } from 'react';
import { Trophy, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

type MatchStatus = 'live' | 'ht' | 'ft' | 'upcoming' | 'postponed' | 'cancelled';

interface ApiMatch {
  id: string;
  league: string;
  leagueBadge?: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  homeBadge?: string;
  awayBadge?: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  minute: number | null;
  kickoffAt: string;
  venue?: string;
}

interface MatchListProps {
  matches: ApiMatch[];
  loading: boolean;
  label: string;
}

// ─── Status badge ──────────────────────────────────────────────
function StatusBadge({ status, minute }: { status: MatchStatus; minute: number | null }) {
  switch (status) {
    case 'live':
      return (
        <span className="flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          {minute != null ? `${minute}'` : 'LIVE'}
        </span>
      );
    case 'ht':
      return (
        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
          HT
        </span>
      );
    case 'ft':
      return (
        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          FT
        </span>
      );
    case 'postponed':
      return (
        <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          Postponed
        </span>
      );
    case 'cancelled':
      return (
        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400/70">
          Cancelled
        </span>
      );
    default:
      return null;
  }
}

// ─── Team badge with fallback ──────────────────────────────────
function TeamBadge({ src, name }: { src?: string; name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          className="h-7 w-7 object-contain flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
        />
        <div className="hidden h-7 w-7 rounded-full bg-gold/10 flex items-center justify-center text-[9px] font-bold text-gold flex-shrink-0">
          {initials}
        </div>
      </>
    );
  }
  return (
    <div className="h-7 w-7 rounded-full bg-surface-border flex items-center justify-center text-[9px] font-bold text-muted-foreground flex-shrink-0">
      {initials}
    </div>
  );
}

// ─── Kickoff time formatter ───────────────────────────────────
function formatKickoff(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── League-grouped match card ─────────────────────────────────
function LeagueGroup({
  league,
  badge,
  matches,
}: {
  league: string;
  badge?: string;
  matches: ApiMatch[];
}) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface/50 overflow-hidden">
      {/* League header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-surface-border/30 border-b border-surface-border">
        {badge ? (
          <img src={badge} alt="" className="h-4 w-4 object-contain" />
        ) : (
          <Trophy className="h-3.5 w-3.5 text-gold" />
        )}
        <span className="text-xs font-bold text-foreground truncate">{league}</span>
        {matches.some((m) => m.status === 'live' || m.status === 'ht') && (
          <Radio className="h-3 w-3 text-red-400 animate-pulse ml-auto flex-shrink-0" />
        )}
      </div>

      {/* Match rows */}
      <div className="divide-y divide-surface-border/50">
        {matches.map((m) => (
          <div
            key={m.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 transition-colors',
              m.status === 'live' && 'bg-red-500/[0.03]',
              'hover:bg-surface-elevated/50'
            )}
          >
            {/* Home */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <TeamBadge src={m.homeBadge} name={m.homeTeam} />
              <span className="text-sm font-medium text-foreground truncate">{m.homeTeam}</span>
            </div>

            {/* Score / Time */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {m.status === 'upcoming' ? (
                <span className="text-xs font-semibold text-gold min-w-[40px] text-center">
                  {formatKickoff(m.kickoffAt)}
                </span>
              ) : (
                <div className="flex items-center gap-1.5 min-w-[50px] justify-center">
                  <span className={cn(
                    'text-base font-bold tabular-nums',
                    m.status === 'live' ? 'text-white' : 'text-gold'
                  )}>
                    {m.homeScore ?? 0}
                  </span>
                  <span className="text-xs text-muted-foreground">-</span>
                  <span className={cn(
                    'text-base font-bold tabular-nums',
                    m.status === 'live' ? 'text-white' : 'text-gold'
                  )}>
                    {m.awayScore ?? 0}
                  </span>
                </div>
              )}
              <StatusBadge status={m.status} minute={m.minute} />
            </div>

            {/* Away */}
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span className="text-sm font-medium text-foreground truncate text-right">{m.awayTeam}</span>
              <TeamBadge src={m.awayBadge} name={m.awayTeam} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main MatchList ─────────────────────────────────────────────
export function MatchList({ matches, loading, label }: MatchListProps) {
  // Group matches by league
  const grouped = useMemo(() => {
    const map = new Map<string, ApiMatch[]>();
    for (const m of matches) {
      const key = m.league || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries()).map(([league, items]) => ({
      league,
      badge: items[0]?.leagueBadge,
      matches: items,
    }));
  }, [matches]);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-surface-border overflow-hidden">
            <div className="h-9 bg-surface animate-pulse" />
            <div className="p-4 space-y-3">
              {[1, 2].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-surface animate-pulse" />
                  <div className="flex-1 h-4 bg-surface rounded animate-pulse" />
                  <div className="h-5 w-16 bg-surface rounded animate-pulse" />
                  <div className="flex-1 h-4 bg-surface rounded animate-pulse" />
                  <div className="h-7 w-7 rounded-full bg-surface animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface border border-surface-border">
          <Trophy className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">No {label}</p>
        <p className="text-xs text-muted-foreground">Check back later or try a different filter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {grouped.map((g) => (
        <LeagueGroup key={g.league} league={g.league} badge={g.badge} matches={g.matches} />
      ))}
    </div>
  );
}
