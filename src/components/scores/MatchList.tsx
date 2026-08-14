'use client';

import { useMemo } from 'react';
import { Trophy, Radio, MapPin, Calendar } from 'lucide-react';
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
  onMatchClick?: (match: ApiMatch) => void;
  showDate?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** YYYY-MM-DD in LOCAL timezone */
function localDateStr(isoStr: string): string {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "Fri, Aug 14" */
function formatMatchDate(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "Today · Fri, Aug 14", "Yesterday · …", "Fri, Aug 14" */
function formatDateGroupLabel(dateKey: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateKey + 'T00:00:00');
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  const label = target.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  if (diff === 0) return `Today · ${label}`;
  if (diff === 1) return `Tomorrow · ${label}`;
  if (diff === -1) return `Yesterday · ${label}`;
  return label;
}

/** "15:30" */
function formatKickoff(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, minute }: { status: MatchStatus; minute: number | null }) {
  switch (status) {
    case 'live':
      return (
        <span className="flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          {minute != null ? `${minute}'` : 'LIVE'}
        </span>
      );
    case 'ht':
      return (
        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 whitespace-nowrap">
          HT
        </span>
      );
    case 'ft':
      return (
        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 whitespace-nowrap">
          FT
        </span>
      );
    case 'postponed':
      return (
        <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
          Postponed
        </span>
      );
    case 'cancelled':
      return (
        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400/70 whitespace-nowrap">
          Cancelled
        </span>
      );
    default:
      return null;
  }
}

// ─── Team badge ───────────────────────────────────────────────────────────────
function TeamBadge({ src, name }: { src?: string; name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <div className="h-8 w-8 rounded-full bg-surface-border/40 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          className="h-full w-full object-contain p-0.5"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.style.display = 'none';
            const parent = img.parentElement;
            if (parent) {
              parent.classList.add('bg-gold/10');
              const span = document.createElement('span');
              span.className = 'text-[9px] font-bold text-gold';
              span.textContent = initials;
              parent.appendChild(span);
            }
          }}
        />
      </div>
    );
  }
  return (
    <div className="h-8 w-8 rounded-full bg-surface-border/60 flex items-center justify-center text-[9px] font-bold text-muted-foreground flex-shrink-0">
      {initials}
    </div>
  );
}

// ─── Match row ─────────────────────────────────────────────────────────────────
function MatchRow({
  m,
  onClick,
}: {
  m: ApiMatch;
  onClick?: (match: ApiMatch) => void;
}) {
  const isLive = m.status === 'live' || m.status === 'ht';
  const isUpcoming = m.status === 'upcoming';

  return (
    <button
      type="button"
      onClick={() => onClick?.(m)}
      className={cn(
        'w-full grid items-center gap-2 px-4 py-3 transition-all duration-200 text-left',
        // 3-column grid: home (flex) | centre fixed | away (flex)
        'grid-cols-[1fr_auto_1fr]',
        isLive && 'bg-red-500/[0.04] border-l-2 border-l-red-500/40',
        !isLive && 'hover:bg-surface-elevated/50',
      )}
    >
      {/* Home team */}
      <div className="flex items-center gap-2 min-w-0">
        <TeamBadge src={m.homeBadge} name={m.homeTeam} />
        <span className="text-[13px] font-semibold text-foreground truncate">{m.homeTeam}</span>
      </div>

      {/* Centre: score / time / status — fixed width so it never shifts */}
      <div className="flex flex-col items-center gap-0.5 w-[90px] flex-shrink-0">
        {isUpcoming ? (
          <>
            <span className="text-sm font-extrabold text-gold tabular-nums">
              {formatKickoff(m.kickoffAt)}
            </span>
            {m.venue && (
              <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground leading-tight">
                <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                <span className="truncate max-w-[70px]">
                  {m.venue.length > 16 ? m.venue.slice(0, 16) + '…' : m.venue}
                </span>
              </span>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 tabular-nums">
              <span className={cn(
                'text-lg font-extrabold tracking-tight',
                isLive ? 'text-white' : 'text-foreground',
              )}>
                {m.homeScore ?? 0}
              </span>
              <span className="text-xs text-muted-foreground font-medium">–</span>
              <span className={cn(
                'text-lg font-extrabold tracking-tight',
                isLive ? 'text-white' : 'text-foreground',
              )}>
                {m.awayScore ?? 0}
              </span>
            </div>
            <StatusBadge status={m.status} minute={m.minute} />
          </>
        )}
      </div>

      {/* Away team — right-aligned */}
      <div className="flex items-center gap-2 min-w-0 justify-end">
        <span className="text-[13px] font-semibold text-foreground truncate text-right">{m.awayTeam}</span>
        <TeamBadge src={m.awayBadge} name={m.awayTeam} />
      </div>
    </button>
  );
}

// ─── League group ─────────────────────────────────────────────────────────────
function LeagueGroup({
  league,
  badge,
  matches,
  onMatchClick,
}: {
  league: string;
  badge?: string;
  matches: ApiMatch[];
  onMatchClick?: (match: ApiMatch) => void;
}) {
  const hasLive = matches.some((m) => m.status === 'live' || m.status === 'ht');

  return (
    <div className="rounded-2xl border border-surface-border bg-surface/40 overflow-hidden shadow-sm">
      {/* League header */}
      <div className={cn(
        'flex items-center gap-2.5 px-4 py-2.5 border-b border-surface-border/60',
        hasLive ? 'bg-red-500/[0.06]' : 'bg-surface-border/20',
      )}>
        {badge ? (
          <img src={badge} alt="" className="h-4 w-4 object-contain" />
        ) : (
          <Trophy className="h-3.5 w-3.5 text-gold flex-shrink-0" />
        )}
        <span className="text-xs font-bold text-foreground truncate flex-1">{league}</span>
        {hasLive && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 flex-shrink-0">
            <Radio className="h-3 w-3 animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      {/* Match rows */}
      <div className="divide-y divide-surface-border/30">
        {matches.map((m) => (
          <MatchRow key={m.id} m={m} onClick={onMatchClick} />
        ))}
      </div>
    </div>
  );
}

// ─── Date section header ──────────────────────────────────────────────────────
function DateSection({
  dateKey,
  groups,
  onMatchClick,
}: {
  dateKey: string;
  groups: { league: string; badge?: string; matches: ApiMatch[] }[];
  onMatchClick?: (match: ApiMatch) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Date label */}
      <div className="flex items-center gap-2 px-1">
        <Calendar className="h-3.5 w-3.5 text-gold flex-shrink-0" />
        <span className="text-xs font-bold text-gold uppercase tracking-wide">
          {formatDateGroupLabel(dateKey)}
        </span>
        <div className="flex-1 h-px bg-surface-border/60" />
      </div>

      {/* League groups for this day */}
      <div className="space-y-3">
        {groups.map((g) => (
          <LeagueGroup
            key={g.league}
            league={g.league}
            badge={g.badge}
            matches={g.matches}
            onMatchClick={onMatchClick}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main MatchList ───────────────────────────────────────────────────────────
export function MatchList({ matches, loading, label, onMatchClick, showDate }: MatchListProps) {
  /**
   * Group by date first (local YYYY-MM-DD), then by league within each day.
   * For live matches (no meaningful date diff), just group by league only.
   */
  const sections = useMemo(() => {
    // Detect if all matches are the same date (live tab) — skip date grouping
    const dateKeys = new Set(matches.map((m) => localDateStr(m.kickoffAt)).filter(Boolean));
    const multiDay = dateKeys.size > 1 || showDate;

    if (!multiDay) {
      // Single-day or live: just league groups
      const map = new Map<string, ApiMatch[]>();
      for (const m of matches) {
        const key = m.league || 'Other';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(m);
      }
      return [{
        dateKey: '',
        groups: Array.from(map.entries()).map(([league, items]) => ({
          league,
          badge: items[0]?.leagueBadge,
          matches: items,
        })),
      }];
    }

    // Multi-day: group by date → league
    const dateMap = new Map<string, Map<string, ApiMatch[]>>();
    for (const m of matches) {
      const dateKey = localDateStr(m.kickoffAt) || 'Unknown';
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, new Map());
      const leagueMap = dateMap.get(dateKey)!;
      const league = m.league || 'Other';
      if (!leagueMap.has(league)) leagueMap.set(league, []);
      leagueMap.get(league)!.push(m);
    }

    // Sort dates ascending (upcoming) or descending (results based on kickoff sort from API)
    const sortedDates = Array.from(dateMap.keys()).sort();

    return sortedDates.map((dateKey) => {
      const leagueMap = dateMap.get(dateKey)!;
      return {
        dateKey,
        groups: Array.from(leagueMap.entries()).map(([league, items]) => ({
          league,
          badge: items[0]?.leagueBadge,
          matches: items,
        })),
      };
    });
  }, [matches, showDate]);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-surface-border overflow-hidden">
            <div className="h-9 bg-surface animate-pulse" />
            <div className="p-4 space-y-3">
              {[1, 2].map((j) => (
                <div key={j} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-surface animate-pulse flex-shrink-0" />
                    <div className="flex-1 h-4 bg-surface rounded animate-pulse" />
                  </div>
                  <div className="w-[90px] h-6 bg-surface rounded animate-pulse" />
                  <div className="flex items-center gap-2 justify-end">
                    <div className="flex-1 h-4 bg-surface rounded animate-pulse" />
                    <div className="h-8 w-8 rounded-full bg-surface animate-pulse flex-shrink-0" />
                  </div>
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
    <div className="space-y-5 p-4">
      {sections.map((s) =>
        s.dateKey ? (
          <DateSection
            key={s.dateKey}
            dateKey={s.dateKey}
            groups={s.groups}
            onMatchClick={onMatchClick}
          />
        ) : (
          // Single-day: render league groups directly without date header
          s.groups.map((g) => (
            <LeagueGroup
              key={g.league}
              league={g.league}
              badge={g.badge}
              matches={g.matches}
              onMatchClick={onMatchClick}
            />
          ))
        )
      )}
    </div>
  );
}
