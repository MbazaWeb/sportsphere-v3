'use client';

import { Trophy } from 'lucide-react';

interface ApiMatch {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  minute: number | null;
  venue: string | null;
  kickoffAt: string;
  events: { minute: number; type: string; player: string; team: string }[];
  continent: string;
  country: string;
}

interface MatchListProps {
  matches: ApiMatch[];
  loading: boolean;
  label: string;
}

export function MatchList({ matches, loading, label }: MatchListProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-surface rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">No {label} at the moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {matches.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between rounded-lg bg-surface p-3 hover:bg-surface-elevated transition-colors"
        >
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted-foreground mb-1">{m.league}</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{m.homeTeam}</p>
              <div className="flex items-center gap-2 mx-3">
                <span className="text-lg font-bold text-gold">
                  {m.homeScore ?? '-'}
                </span>
                <span className="text-muted-foreground">-</span>
                <span className="text-lg font-bold text-gold">
                  {m.awayScore ?? '-'}
                </span>
                {m.status === 'live' && m.minute && (
                  <span className="text-[10px] font-bold text-red-400 animate-pulse ml-1">{m.minute}'</span>
                )}
              </div>
              <p className="text-right text-sm font-semibold text-white">{m.awayTeam}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
