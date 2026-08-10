'use client';

import { Trophy, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StandingRow {
  pos: number;
  team: string;
  badge?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

interface StandingsListProps {
  standings: StandingRow[];
  loading: boolean;
  league?: string;
}

export function StandingsList({ standings, loading, league }: StandingsListProps) {
  if (loading) {
    return (
      <div className="p-4 space-y-2">
        <div className="h-8 bg-surface rounded-lg animate-pulse" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 bg-surface rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface border border-surface-border">
          <Trophy className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">No standings available</p>
        <p className="text-xs text-muted-foreground">Try selecting a different league.</p>
      </div>
    );
  }

  // Split into zones: top 4 (Champions League), 5-6 (Europa), 17-20 (relegation)
  const zoneColor = (pos: number) => {
    if (pos <= 4) return 'border-l-2 border-l-blue-400';
    if (pos <= 6) return 'border-l-2 border-l-orange-400';
    if (pos >= standings.length - 3) return 'border-l-2 border-l-red-400';
    return 'border-l-2 border-l-transparent';
  };

  return (
    <div className="p-4">
      {league && (
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-gold" />
          <p className="text-xs font-bold text-foreground">{league}</p>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-sm bg-blue-400" /> Champions League</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-sm bg-orange-400" /> Europa League</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-sm bg-red-400" /> Relegation</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[28px_1fr_32px_28px_28px_28px_36px_36px] gap-1 text-[10px] font-semibold text-muted-foreground px-2 py-1.5">
        <span>#</span>
        <span>Team</span>
        <span className="text-center">P</span>
        <span className="text-center">W</span>
        <span className="text-center">D</span>
        <span className="text-center">L</span>
        <span className="text-center">GD</span>
        <span className="text-center">Pts</span>
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {standings.map((row) => (
          <div
            key={row.pos}
            className={cn(
              'grid grid-cols-[28px_1fr_32px_28px_28px_28px_36px_36px] gap-1 items-center rounded-xl bg-surface/80 px-2 py-2 transition-colors hover:bg-surface-elevated',
              zoneColor(row.pos)
            )}
          >
            <span className="text-xs font-bold text-muted-foreground">{row.pos}</span>
            <div className="flex items-center gap-2 min-w-0">
              {row.badge ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.badge} alt={row.team} className="h-5 w-5 object-contain flex-shrink-0" />
                </>
              ) : (
                <div className="h-5 w-5 rounded-full bg-gold/10 flex items-center justify-center text-[8px] font-bold text-gold flex-shrink-0">
                  {row.team.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-foreground truncate">{row.team}</span>
            </div>
            <span className="text-center text-xs text-muted-foreground tabular-nums">{row.played}</span>
            <span className="text-center text-xs text-muted-foreground tabular-nums">{row.won}</span>
            <span className="text-center text-xs text-muted-foreground tabular-nums">{row.drawn}</span>
            <span className="text-center text-xs text-muted-foreground tabular-nums">{row.lost}</span>
            <span className={cn(
              'text-center text-xs font-semibold tabular-nums',
              row.gd > 0 ? 'text-emerald-400' : row.gd < 0 ? 'text-red-400' : 'text-muted-foreground'
            )}>
              {row.gd > 0 ? '+' : ''}{row.gd}
            </span>
            <span className="text-center text-xs font-bold text-gold tabular-nums">{row.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
