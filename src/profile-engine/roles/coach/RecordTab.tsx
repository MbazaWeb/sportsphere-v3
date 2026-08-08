'use client';

// ─── Coach Record Tab ──────────────────────────────────────────
//
// W/D/L, PPG, goals for/against, trophies. Plus a derived win-rate
// bar and a "trophy count" hero number.

import { Trophy, Activity, TrendingUp, Shield, Target, Percent } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, StatGrid, StatTile, EmptyState, ProgressBar, Badge, rpString, rpNumber } from '../../shared/ui';

export function CoachRecordTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const matches = rpNumber(rp, 'matchesManaged');
  const wins = rpNumber(rp, 'wins');
  const draws = rpNumber(rp, 'draws');
  const losses = rpNumber(rp, 'losses');
  const goalsFor = rpNumber(rp, 'goalsFor');
  const goalsAgainst = rpNumber(rp, 'goalsAgainst');
  const cleanSheets = rpNumber(rp, 'cleanSheets');
  const ppg = rpNumber(rp, 'pointsPerGame');
  const trophies = rpNumber(rp, 'trophiesWon');

  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const hasAny = matches || wins || trophies || ppg;

  if (!hasAny) {
    return (
      <EmptyState
        icon={Activity}
        title="No coaching record yet"
        message="Add your matches managed, wins, draws, losses, and trophies from Edit Profile."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Win rate hero */}
      <Card hover>
        <SectionTitle icon={Percent}>Win Rate</SectionTitle>
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-3xl font-black text-gold">{winRate}%</p>
            <p className="text-xs text-muted-foreground">{wins}W · {draws}D · {losses}L of {matches} matches</p>
          </div>
          {trophies > 0 && (
            <div className="text-right">
              <p className="text-2xl font-black text-gold flex items-center gap-1 justify-end">
                <Trophy className="h-5 w-5" />{trophies}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">Trophies</p>
            </div>
          )}
        </div>
        <ProgressBar value={winRate} color={winRate >= 50 ? 'green' : winRate >= 30 ? 'gold' : 'red'} />
      </Card>

      {/* Record grid */}
      <Card hover>
        <SectionTitle icon={Activity}>Record Breakdown</SectionTitle>
        <StatGrid cols={4}>
          <StatTile icon={Trophy}    label="Wins"     value={wins}     accent="green" />
          <StatTile icon={Activity}  label="Draws"    value={draws}    accent="muted" />
          <StatTile icon={Activity}  label="Losses"   value={losses}   accent="red" />
          <StatTile icon={Target}    label="Matches"  value={matches}  />
        </StatGrid>
      </Card>

      {/* Goals + PPG */}
      {(goalsFor || goalsAgainst || cleanSheets || ppg) ? (
        <Card hover>
          <SectionTitle icon={TrendingUp}>Performance Indicators</SectionTitle>
          <StatGrid cols={4}>
            {goalsFor > 0 &&     <StatTile icon={Target} label="Goals For"     value={goalsFor} />}
            {goalsAgainst > 0 && <StatTile icon={Target} label="Goals Against" value={goalsAgainst} accent="red" />}
            {cleanSheets > 0 &&  <StatTile icon={Shield} label="Clean Sheets" value={cleanSheets} accent="green" />}
            {ppg > 0 &&          <StatTile icon={TrendingUp} label="PPG" value={ppg.toFixed(2)} accent="gold" />}
          </StatGrid>
          {ppg > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                <span>PPG (0-3 scale)</span>
                <span>{ppg.toFixed(2)} / 3.00</span>
              </div>
              <ProgressBar value={ppg} max={3} color={ppg >= 2 ? 'green' : ppg >= 1.5 ? 'gold' : 'red'} />
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
