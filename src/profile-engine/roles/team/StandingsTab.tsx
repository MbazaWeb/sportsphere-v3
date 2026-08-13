'use client';

// ─── Team Standings / League Table Tab ─────────────────────────
//
// Fetches the league standings, highlights this team's row,
// and shows position + points.

import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, MapPin } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { getRoleProfile, rpString } from '../../shared/ui';
import { Card, SectionTitle, StatTile, StatGrid, EmptyState, Badge } from '../../shared/ui';

interface StandingRow {
  pos: number;
  team: string;
  badge?: string;
  slug?: string;
  city?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

interface StandingsData {
  league: string;
  leagueId: string;
  country?: string;
  standings: StandingRow[];
}

export function TeamStandingsTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'team');
  const teamName = apiUser?.name || '';
  const leagueName = rpString(rp, 'league') || '';

  const [data, setData] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leagueName) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        // Try to find the league slug from the league name
        const slug = leagueName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const res = await fetch(`/api/standings?league=${encodeURIComponent(slug)}`);
        if (cancelled) return;
        if (res.ok) {
          const json = await res.json();
          if (json.standings && json.standings.length > 0) {
            setData(json);
          }
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [leagueName]);

  // Find this team in standings
  const teamRow = data?.standings.find(
    s => s.team.toLowerCase().includes(teamName.toLowerCase()) ||
         teamName.toLowerCase().includes(s.team.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><div className="h-16 bg-surface animate-pulse rounded-lg" /></Card>
        ))}
      </div>
    );
  }

  if (!data || data.standings.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No standings data"
        message="League standings will appear here when the league table is available."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* This team's rank highlight */}
      {teamRow && (
        <Card hover>
          <SectionTitle icon={TrendingUp}>League Position</SectionTitle>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-black text-gold">#{teamRow.pos}</p>
              <p className="text-xs text-muted-foreground">{data.league}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-gold">{teamRow.pts}<span className="text-sm font-normal text-muted-foreground ml-1">pts</span></p>
              <p className="text-xs text-muted-foreground">{teamRow.played} played</p>
            </div>
          </div>
          {data.country && (
            <div className="mt-2 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">Rank in {data.country}: #{teamRow.pos} · {teamRow.pts} points</p>
            </div>
          )}
        </Card>
      )}

      {/* Full league table */}
      <Card hover>
        <SectionTitle icon={Trophy}>{data.league} — Table</SectionTitle>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-muted-foreground uppercase tracking-wider border-b border-surface-border/40">
                <th className="py-1.5 text-left w-8">#</th>
                <th className="py-1.5 text-left">Team</th>
                <th className="py-1.5 text-center w-8">P</th>
                <th className="py-1.5 text-center w-8">W</th>
                <th className="py-1.5 text-center w-8">D</th>
                <th className="py-1.5 text-center w-8">L</th>
                <th className="py-1.5 text-center w-10">GD</th>
                <th className="py-1.5 text-center w-10">Pts</th>
              </tr>
            </thead>
            <tbody>
              {data.standings.map(row => {
                const isThisTeam = teamRow && row.pos === teamRow.pos;
                return (
                  <tr
                    key={row.pos}
                    className={`border-b border-surface-border/20 ${
                      isThisTeam ? 'bg-gold/10 rounded-lg' : ''
                    }`}
                  >
                    <td className={`py-2 font-bold ${isThisTeam ? 'text-gold' : 'text-white'}`}>{row.pos}</td>
                    <td className={`py-2 font-semibold truncate max-w-[120px] ${isThisTeam ? 'text-gold' : 'text-white'}`}>{row.team}</td>
                    <td className="py-2 text-center text-muted-foreground">{row.played}</td>
                    <td className="py-2 text-center text-emerald-400">{row.won}</td>
                    <td className="py-2 text-center text-muted-foreground">{row.drawn}</td>
                    <td className="py-2 text-center text-red-400">{row.lost}</td>
                    <td className={`py-2 text-center font-semibold ${row.gd > 0 ? 'text-emerald-400' : row.gd < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {row.gd > 0 ? '+' : ''}{row.gd}
                    </td>
                    <td className={`py-2 text-center font-black ${isThisTeam ? 'text-gold' : 'text-white'}`}>{row.pts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
