'use client';

import { useMemo } from 'react';
import { Trophy, Radio, MapPin, Handshake } from 'lucide-react';
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

/** YYYY-MM-DD in EAT (UTC+3) — must match the API's day boundary offset */
function localDateStr(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  // Shift to EAT (UTC+3) by adding 3 hours before extracting date parts
  const eat = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  const y = eat.getUTCFullYear();
  const m = String(eat.getUTCMonth() + 1).padStart(2, '0');
  const day = String(eat.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "Fri, Aug 14" */
function formatMatchDate(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "15:30" in EAT */
function formatKickoff(isoStr: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  // EAT = UTC+3
  const eat = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  const h = String(eat.getUTCHours()).padStart(2, '0');
  const min = String(eat.getUTCMinutes()).padStart(2, '0');
  return `${h}:${min}`;
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
  const isFT = m.status === 'ft';

  // Determine outcome for finished matches
  const isDraw = isFT && m.homeScore != null && m.awayScore != null && m.homeScore === m.awayScore;
  const homeWon = isFT && m.homeScore != null && m.awayScore != null && m.homeScore > m.awayScore;
  const awayWon = isFT && m.homeScore != null && m.awayScore != null && m.awayScore > m.homeScore;

  return (
    <button
      type="button"
      onClick={() => onClick?.(m)}
      className={cn(
        'w-full grid items-center gap-2 px-4 py-3 transition-all duration-200 text-left',
        'grid-cols-[1fr_auto_1fr]',
        isLive && 'bg-red-500/[0.04] border-l-2 border-l-red-500/40',
        !isLive && 'hover:bg-surface-elevated/50',
      )}
    >
      {/* Home team */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="relative flex-shrink-0">
          <TeamBadge src={m.homeBadge} name={m.homeTeam} />
          {homeWon && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold shadow-sm shadow-gold/40">
              <Trophy className="h-2.5 w-2.5 text-black" />
            </span>
          )}
          {isDraw && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface-elevated border border-surface-border">
              <Handshake className="h-2.5 w-2.5 text-muted-foreground" />
            </span>
          )}
        </div>
        <span className={cn(
          'text-[13px] font-semibold truncate',
          homeWon ? 'text-foreground font-bold' : isFT && !isDraw ? 'text-muted-foreground' : 'text-foreground',
        )}>
          {m.homeTeam}
        </span>
      </div>

      {/* Centre: score / time / status */}
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
                isLive ? 'text-white' : homeWon ? 'text-gold' : awayWon ? 'text-muted-foreground' : 'text-foreground',
              )}>
                {m.homeScore ?? 0}
              </span>
              <span className="text-xs text-muted-foreground font-medium">–</span>
              <span className={cn(
                'text-lg font-extrabold tracking-tight',
                isLive ? 'text-white' : awayWon ? 'text-gold' : homeWon ? 'text-muted-foreground' : 'text-foreground',
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
        <span className={cn(
          'text-[13px] font-semibold truncate text-right',
          awayWon ? 'text-foreground font-bold' : isFT && !isDraw ? 'text-muted-foreground' : 'text-foreground',
        )}>
          {m.awayTeam}
        </span>
        <div className="relative flex-shrink-0">
          <TeamBadge src={m.awayBadge} name={m.awayTeam} />
          {awayWon && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold shadow-sm shadow-gold/40">
              <Trophy className="h-2.5 w-2.5 text-black" />
            </span>
          )}
          {isDraw && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface-elevated border border-surface-border">
              <Handshake className="h-2.5 w-2.5 text-muted-foreground" />
            </span>
          )}
        </div>
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
  // Parse dateKey as EAT midnight (add +03:00 so it's timezone-aware)
  const today = new Date();
  const todayEATStr = (() => {
    const eat = new Date(today.getTime() + 3 * 60 * 60 * 1000);
    return `${eat.getUTCFullYear()}-${String(eat.getUTCMonth()+1).padStart(2,'0')}-${String(eat.getUTCDate()).padStart(2,'0')}`;
  })();
  const target = new Date(dateKey + 'T00:00:00+03:00');
  const todayMidnight = new Date(todayEATStr + 'T00:00:00+03:00');
  const diff = Math.round((target.getTime() - todayMidnight.getTime()) / 86400000);
  const isToday = diff === 0;
  const isPast = diff < 0;

  return (
    <div className="space-y-2">
      {/* Sticky date pill */}
      <div className={cn(
        'flex items-center gap-2.5 px-1 py-1 rounded-xl',
        isToday && 'bg-gold/8',
      )}>
        <div className={cn(
          'flex items-center justify-center h-7 w-7 rounded-lg flex-shrink-0',
          isToday ? 'bg-gold text-black' : isPast ? 'bg-surface-elevated text-muted-foreground' : 'bg-surface-elevated text-foreground',
        )}>
          <span className="text-[10px] font-extrabold leading-none">
            {target.getDate()}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className={cn(
            'text-[11px] font-extrabold uppercase tracking-widest leading-tight',
            isToday ? 'text-gold' : 'text-foreground/80',
          )}>
            {isToday ? 'Today' : diff === 1 ? 'Tomorrow' : diff === -1 ? 'Yesterday' : target.toLocaleDateString('en-US', { weekday: 'long' })}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium leading-tight">
            {target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <div className="flex-1 h-px bg-surface-border/60" />
        <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0">
          {groups.reduce((t, g) => t + g.matches.length, 0)} match{groups.reduce((t, g) => t + g.matches.length, 0) !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* League groups for this day */}
      <div className="space-y-2 pl-0">
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
    // Always group by date for upcoming/results (showDate=true)
    // Only skip date grouping for live tab (showDate=false)
    const multiDay = showDate;

    if (!multiDay) {
      // Live / today: just league groups, no date header
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

    // Multi-day: group by local date → league
    const dateMap = new Map<string, Map<string, ApiMatch[]>>();
    for (const m of matches) {
      const dateKey = localDateStr(m.kickoffAt) || 'Unknown';
      if (!dateMap.has(dateKey)) dateMap.set(dateKey, new Map());
      const leagueMap = dateMap.get(dateKey)!;
      const league = m.league || 'Other';
      if (!leagueMap.has(league)) leagueMap.set(league, []);
      leagueMap.get(league)!.push(m);
    }

    // Sort dates ascending always (results come desc from API but date keys sort correctly)
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
