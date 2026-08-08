'use client';

// ─── Competition Standings Tab (signature feature) ───────────
//
// Parses the `standings` textarea into a real league table with
// position, team, P/W/D/L, GF/GA/GD, Pts. Highlights top positions
// (green for Champions League spots, gold for winners).
//
// Format: Pos | Team | P | W | D | L | GF | GA | GD | Pts

import { Trophy } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, EmptyState, Badge, rpString, rpNumber } from '../../shared/ui';

interface StandingRow {
  pos: number;
  team: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

function parseStandings(raw: string): StandingRow[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const p = line.split('|').map(s => s.trim());
      const num = (s: string) => parseInt(s, 10) || 0;
      const pos = num(p[0] || '0');
      const gf = num(p[6] || '0');
      const ga = num(p[7] || '0');
      return {
        pos,
        team: p[1] || 'Unknown',
        p: num(p[2] || '0'),
        w: num(p[3] || '0'),
        d: num(p[4] || '0'),
        l: num(p[5] || '0'),
        gf,
        ga,
        gd: p[8] ? num(p[8]) : gf - ga,
        pts: num(p[9] || '0'),
      };
    })
    .filter(r => r.team !== 'Unknown' || r.pos > 0)
    .sort((a, b) => a.pos - b.pos);
}

export function CompetitionStandingsTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'competition');
  const standings = parseStandings(rpString(rp, 'standings'));
  const participants = rpNumber(rp, 'participants');

  if (standings.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No standings published yet"
        message="Add standings from Edit Profile. Format: Pos | Team | P | W | D | L | GF | GA | GD | Pts"
      />
    );
  }

  // Determine "qualification zones" — for a typical 16-20 team league:
  //   - Top 1: Champions (gold)
  //   - 2-4: Champions League / Top tier (green)
  //   - Bottom 1-3: Relegation (red)
  const totalTeams = standings.length;
  const champPos = 1;
  const topTierEnd = Math.min(4, Math.ceil(totalTeams * 0.25));
  const relegationStart = totalTeams - Math.min(3, Math.ceil(totalTeams * 0.15)) + 1;

  const rowAccent = (pos: number): string => {
    if (pos === champPos) return 'border-l-gold';
    if (pos <= topTierEnd) return 'border-l-emerald-500';
    if (pos >= relegationStart) return 'border-l-red-500';
    return 'border-l-surface-border';
  };

  return (
    <div className="flex flex-col gap-3">
      <Card hover>
        <SectionTitle
          icon={Trophy}
          action={<Badge color="muted">{standings.length} teams{participants ? ` · ${participants} total` : ''}</Badge>}
        >
          League Table
        </SectionTitle>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-xs min-w-[480px]">
            <thead>
              <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-surface-border">
                <th className="text-left py-2 px-1 w-8">#</th>
                <th className="text-left py-2 px-1">Team</th>
                <th className="text-center py-2 px-1 w-8">P</th>
                <th className="text-center py-2 px-1 w-8">W</th>
                <th className="text-center py-2 px-1 w-8">D</th>
                <th className="text-center py-2 px-1 w-8">L</th>
                <th className="text-center py-2 px-1 w-10 hidden sm:table-cell">GF</th>
                <th className="text-center py-2 px-1 w-10 hidden sm:table-cell">GA</th>
                <th className="text-center py-2 px-1 w-10">GD</th>
                <th className="text-center py-2 px-1 w-10 font-bold text-gold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((r, i) => (
                <tr key={i} className={`border-b border-surface-border/30 border-l-2 ${rowAccent(r.pos || i + 1)}`}>
                  <td className="py-1.5 px-1 font-bold text-muted-foreground">{r.pos || i + 1}</td>
                  <td className="py-1.5 px-1 font-semibold text-white truncate max-w-[140px]">{r.team}</td>
                  <td className="py-1.5 px-1 text-center text-muted-foreground">{r.p}</td>
                  <td className="py-1.5 px-1 text-center text-emerald-400">{r.w}</td>
                  <td className="py-1.5 px-1 text-center text-muted-foreground">{r.d}</td>
                  <td className="py-1.5 px-1 text-center text-red-400">{r.l}</td>
                  <td className="py-1.5 px-1 text-center text-muted-foreground hidden sm:table-cell">{r.gf}</td>
                  <td className="py-1.5 px-1 text-center text-muted-foreground hidden sm:table-cell">{r.ga}</td>
                  <td className="py-1.5 px-1 text-center text-muted-foreground">
                    {r.gd > 0 ? `+${r.gd}` : r.gd === 0 ? '0' : r.gd}
                  </td>
                  <td className="py-1.5 px-1 text-center font-bold text-gold">{r.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-3 text-[10px]">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 bg-gold rounded-sm" />Champion
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-sm" />Top tier
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-sm" />Relegation
          </span>
        </div>
      </Card>
    </div>
  );
}
