'use client';

import { Trophy, Crown } from 'lucide-react';

interface StandingRow {
  pos: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: string;
  pts: number;
  handle?: string;
}

interface StandingsListProps {
  standings: StandingRow[];
  loading: boolean;
}

export function StandingsList({ standings, loading }: StandingsListProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-surface rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">No standings available</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <div className="grid grid-cols-[30px_1fr_40px_40px_40px_50px] gap-2 text-xs font-semibold text-muted-foreground px-2 py-1">
        <span>#</span>
        <span>Team</span>
        <span className="text-center">P</span>
        <span className="text-center">W</span>
        <span className="text-center">L</span>
        <span className="text-right">Pts</span>
      </div>
      {standings.map((row, idx) => (
        <div
          key={idx}
          className="grid grid-cols-[30px_1fr_40px_40px_40px_50px] gap-2 items-center rounded-lg bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <span className="text-xs font-bold text-muted-foreground">{row.pos}</span>
          <span className="text-xs font-semibold text-foreground truncate">
            {row.team}
            {idx === 0 && <Crown className="ml-1 inline h-3 w-3 text-gold" />}
          </span>
          <span className="text-center text-xs text-muted-foreground">{row.played}</span>
          <span className="text-center text-xs text-muted-foreground">{row.won}</span>
          <span className="text-center text-xs text-muted-foreground">{row.lost}</span>
          <span className="text-right text-xs font-bold text-gold">{row.pts}</span>
        </div>
      ))}
    </div>
  );
}
