'use client';

// ─── Team Performance Tab ──────────────────────────────────────
//
// Current season: matches, W/D/L, goals, points, position, form.

import { Activity, TrendingUp, Target, Shield, Trophy, BarChart3 } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, StatGrid, StatTile, EmptyState, ProgressBar, Badge, rpString, rpNumber } from '../../shared/ui';
import { PerformanceCard } from '@/components/performance/PerformanceCard';

export function TeamPerformanceTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'team');
  const matches = rpNumber(rp, 'matchesPlayed');
  const wins = rpNumber(rp, 'wins');
  const draws = rpNumber(rp, 'draws');
  const losses = rpNumber(rp, 'losses');
  const goalsFor = rpNumber(rp, 'goalsFor');
  const goalsAgainst = rpNumber(rp, 'goalsAgainst');
  const points = rpNumber(rp, 'points');
  const position = rpString(rp, 'position');
  const form = rpString(rp, 'form');

  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const goalDiff = goalsFor - goalsAgainst;
  const hasAny = matches || wins || points || position || form;

  if (!hasAny) {
    return (
      <div className="flex flex-col gap-3">
        {apiUser?.id && <PerformanceCard userId={apiUser.id} />}
        <EmptyState
          icon={BarChart3}
          title="No season stats yet"
          message="Add your current season stats from Edit Profile → Performance. Your performance score above is computed from verified events."
        />
      </div>
    );
  }

  // Parse form like "WWDLW" into colored badges
  const formLetters = form.toUpperCase().split('').filter(c => ['W', 'D', 'L'].includes(c));

  return (
    <div className="flex flex-col gap-3">
      {/* ── Computed Performance Engine card (score, tier, rank, KPI breakdown) ── */}
      {apiUser?.id && <PerformanceCard userId={apiUser.id} />}

      {/* League position hero */}
      {(position || points) && (
        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">League Position</p>
              <p className="text-3xl font-black text-gold">{position || '—'}</p>
              {rpString(rp, 'league') && <p className="text-xs text-muted-foreground">{rpString(rp, 'league')}</p>}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Points</p>
              <p className="text-3xl font-black text-gold">{points}</p>
              {matches > 0 && <p className="text-xs text-muted-foreground">from {matches} matches</p>}
            </div>
          </div>
        </Card>
      )}

      {/* Form */}
      {formLetters.length > 0 && (
        <Card hover>
          <SectionTitle icon={TrendingUp}>Recent Form</SectionTitle>
          <div className="flex gap-1.5">
            {formLetters.map((f, i) => (
              <div
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-black ${
                  f === 'W' ? 'bg-emerald-500/80 text-white'
                  : f === 'D' ? 'bg-surface-elevated text-muted-foreground'
                  : 'bg-red-500/80 text-white'
                }`}
              >
                {f}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* W/D/L + win rate */}
      {matches > 0 && (
        <Card hover>
          <SectionTitle icon={Activity}>Record</SectionTitle>
          <StatGrid cols={4}>
            <StatTile icon={Trophy}    label="Wins"    value={wins}    accent="green" />
            <StatTile icon={Activity}  label="Draws"   value={draws}   accent="muted" />
            <StatTile icon={Activity}  label="Losses"  value={losses}  accent="red" />
            <StatTile icon={TrendingUp} label="Win %"  value={`${winRate}%`} accent="gold" />
          </StatGrid>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              <span>Win Rate</span>
              <span>{winRate}%</span>
            </div>
            <ProgressBar value={winRate} color={winRate >= 50 ? 'green' : winRate >= 30 ? 'gold' : 'red'} />
          </div>
        </Card>
      )}

      {/* Goals */}
      {(goalsFor || goalsAgainst) && (
        <Card hover>
          <SectionTitle icon={Target}>Goals</SectionTitle>
          <StatGrid cols={3}>
            <StatTile icon={Target} label="For"     value={goalsFor} accent="green" />
            <StatTile icon={Target} label="Against" value={goalsAgainst} accent="red" />
            <StatTile icon={BarChart3} label="Diff" value={goalDiff > 0 ? `+${goalDiff}` : goalDiff} accent={goalDiff >= 0 ? 'green' : 'red'} />
          </StatGrid>
        </Card>
      )}
    </div>
  );
}
