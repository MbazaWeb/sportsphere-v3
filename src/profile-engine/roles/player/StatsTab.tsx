'use client';

// ─── Player Performance Dashboard ──────────────────────────────
//
// POSITION-AWARE: shows different metrics depending on the player's
// primary position.
//   GK  → Saves, Clean Sheets, Save %, Goals Conceded, Penalties Saved
//   DEF → Tackles, Interceptions, Clearances, Blocks, Clean Sheets
//   MID → Assists, Chances Created, Pass Accuracy, Key Passes, Progressive Passes
//   FWD → Goals, Assists, Shots, xG, Conversion Rate
//
// All roles also get a "General" block (appearances, starts, minutes,
// rating, MOTM, cards).

import {
  Activity, Target, Shield, Hand, Goal, Zap, TrendingUp, Award,
  Footprints, Timer, Square, Star,
} from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, StatGrid, StatTile, EmptyState, rpString, rpNumber } from '../../shared/ui';

function positionGroup(position: string): 'GK' | 'DEF' | 'MID' | 'FWD' | 'OTHER' {
  const p = position.toUpperCase();
  if (p === 'GK') return 'GK';
  if (['RB', 'CB', 'LB', 'RWB', 'LWB'].includes(p)) return 'DEF';
  if (['CDM', 'CM', 'CAM'].includes(p)) return 'MID';
  if (['RW', 'LW', 'ST', 'CF'].includes(p)) return 'FWD';
  return 'OTHER';
}

export function PlayerStatsTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const position = rpString(rp, 'position');

  // General stats — shown for everyone
  const generalStats = [
    { label: 'Appearances',  value: rpNumber(rp, 'appearances'),  icon: Activity },
    { label: 'Starts',       value: rpNumber(rp, 'starts'),       icon: Footprints },
    { label: 'Minutes',      value: rpNumber(rp, 'minutes'),      icon: Timer },
    { label: 'Avg Rating',   value: rpNumber(rp, 'rating').toFixed(1), icon: Star, accent: 'gold' as const },
    { label: 'MOTM',         value: rpNumber(rp, 'motm'),         icon: Award, accent: 'gold' as const },
    { label: 'Yellow Cards', value: rpNumber(rp, 'yellowCards'),  icon: Square, accent: 'red' as const },
    { label: 'Red Cards',    value: rpNumber(rp, 'redCards'),     icon: Square, accent: 'red' as const },
  ];

  // Position-specific stats
  const group = positionGroup(position);
  let positionLabel = 'All Positions';
  let positionStats: Array<{ label: string; value: string | number; icon: typeof Goal; accent?: 'gold' | 'green' | 'red' | 'blue' | 'muted' }> = [];

  if (group === 'GK') {
    positionLabel = 'Goalkeeper';
    positionStats = [
      { label: 'Saves',          value: rpNumber(rp, 'saves'),         icon: Hand },
      { label: 'Clean Sheets',   value: rpNumber(rp, 'cleanSheets'),   icon: Shield, accent: 'green' },
      { label: 'Save %',         value: rpNumber(rp, 'savePct') ? `${rpNumber(rp, 'savePct')}%` : '—', icon: Target },
      { label: 'Goals Conceded', value: rpNumber(rp, 'goalsConceded'), icon: Goal, accent: 'red' },
      { label: 'Penalties Saved',value: rpNumber(rp, 'penaltiesSaved'),icon: Award, accent: 'gold' },
    ];
  } else if (group === 'DEF') {
    positionLabel = 'Defender';
    positionStats = [
      { label: 'Tackles',         value: rpNumber(rp, 'tackles'),       icon: Shield },
      { label: 'Interceptions',   value: rpNumber(rp, 'interceptions'), icon: Hand },
      { label: 'Clean Sheets',    value: rpNumber(rp, 'cleanSheets'),   icon: Shield, accent: 'green' },
      { label: 'Duels Won %',     value: rpNumber(rp, 'duelsWon') ? `${rpNumber(rp, 'duelsWon')}%` : '—', icon: TrendingUp },
      { label: 'Aerial Duels %',  value: rpNumber(rp, 'aerialDuels') ? `${rpNumber(rp, 'aerialDuels')}%` : '—', icon: TrendingUp },
    ];
  } else if (group === 'MID') {
    positionLabel = 'Midfielder';
    positionStats = [
      { label: 'Assists',         value: rpNumber(rp, 'assists'),       icon: Zap },
      { label: 'Chances Created', value: rpNumber(rp, 'chancesCreated'),icon: Target, accent: 'gold' },
      { label: 'Pass Accuracy %', value: rpNumber(rp, 'passAccuracy') ? `${rpNumber(rp, 'passAccuracy')}%` : '—', icon: Activity },
      { label: 'Goals',           value: rpNumber(rp, 'goals'),         icon: Goal },
      { label: 'Duels Won %',     value: rpNumber(rp, 'duelsWon') ? `${rpNumber(rp, 'duelsWon')}%` : '—', icon: TrendingUp },
    ];
  } else if (group === 'FWD') {
    positionLabel = 'Forward';
    positionStats = [
      { label: 'Goals',           value: rpNumber(rp, 'goals'),         icon: Goal, accent: 'gold' },
      { label: 'Assists',         value: rpNumber(rp, 'assists'),       icon: Zap },
      { label: 'Shots',           value: rpNumber(rp, 'shots'),         icon: Target },
      { label: 'Shots on Target', value: rpNumber(rp, 'shotsOnTarget'), icon: Target },
      { label: 'Conversion %',    value: rpNumber(rp, 'shots') && rpNumber(rp, 'shotsOnTarget')
        ? `${Math.round((rpNumber(rp, 'shotsOnTarget') / rpNumber(rp, 'shots')) * 100)}%` : '—', icon: TrendingUp, accent: 'green' },
    ];
  }

  const hasAnyStat = [...generalStats, ...positionStats].some(s => s.value !== 0 && s.value !== '—' && s.value !== '');

  if (!hasAnyStat) {
    return (
      <EmptyState
        icon={Activity}
        title="No performance data yet"
        message="Add your stats from the Edit Profile screen to see your position-specific dashboard."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Position hero */}
      {position && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Position</p>
              <p className="text-2xl font-black text-gold">{position}</p>
              <p className="text-xs text-muted-foreground">{positionLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Form</p>
              <p className="text-sm font-bold text-white">{rpString(rp, 'form') || '—'}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Ranking: {rpString(rp, 'ranking') || '—'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Position-specific dashboard */}
      {positionStats.length > 0 && (
        <Card hover>
          <SectionTitle icon={Target}>{positionLabel} Metrics</SectionTitle>
          <StatGrid cols={3}>
            {positionStats.map(s => (
              <StatTile key={s.label} icon={s.icon} label={s.label} value={s.value} accent={s.accent} />
            ))}
          </StatGrid>
        </Card>
      )}

      {/* General stats */}
      <Card hover>
        <SectionTitle icon={Activity}>General</SectionTitle>
        <StatGrid cols={4}>
          {generalStats.map(s => (
            <StatTile key={s.label} icon={s.icon} label={s.label} value={s.value} accent={s.accent} />
          ))}
        </StatGrid>
      </Card>
    </div>
  );
}
