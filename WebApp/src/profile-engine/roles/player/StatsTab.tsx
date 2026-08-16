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
  Footprints, Timer, Square, Star, Brain, Zap as Bolt, Wind, Swords, Eye, Heart as HeartIcon,
} from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, StatGrid, StatTile, EmptyState, ProgressBar, rpString, rpNumber } from '../../shared/ui';
import { PerformanceCard } from '@/components/performance/PerformanceCard';

function positionGroup(position: string): 'GK' | 'DEF' | 'MID' | 'FWD' | 'OTHER' {
  const p = position.toUpperCase();
  if (p === 'GK') return 'GK';
  if (['RB', 'CB', 'LB', 'RWB', 'LWB'].includes(p)) return 'DEF';
  if (['CDM', 'CM', 'CAM'].includes(p)) return 'MID';
  if (['RW', 'LW', 'ST', 'CF'].includes(p)) return 'FWD';
  return 'OTHER';
}

export function PlayerStatsTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'player');
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
      <div className="flex flex-col gap-3">
        {apiUser?.id && <PerformanceCard userId={apiUser.id} />}
        <EmptyState
          icon={Activity}
          title="No manual stats entered yet"
          message="Add your stats from the Edit Profile screen to see your position-specific dashboard. Your performance score above is computed from verified events."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Computed Performance Engine card (score, tier, rank, KPI breakdown) ── */}
      {apiUser?.id && <PerformanceCard userId={apiUser.id} />}

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

      {/* ── Physical & Technical Attributes (out of 10) ── */}
      {(() => {
        const attrs = [
          { key: 'pace', label: 'Pace / Speed', icon: Zap },
          { key: 'strength', label: 'Strength', icon: Swords },
          { key: 'dribbling', label: 'Dribbling', icon: Footprints },
          { key: 'passingRange', label: 'Passing', icon: Wind },
          { key: 'shooting', label: 'Shooting', icon: Target },
          { key: 'defensiveAbility', label: 'Defensive', icon: Shield },
          { key: 'aerialDuelsRating', label: 'Aerial Duels', icon: Activity },
          { key: 'stamina', label: 'Stamina', icon: Bolt },
        ].filter(a => rpNumber(rp, a.key) > 0);
        if (attrs.length === 0) return null;
        return (
          <Card hover>
            <SectionTitle icon={Activity}>Physical & Technical Attributes</SectionTitle>
            <div className="flex flex-col gap-2">
              {attrs.map(a => {
                const val = Math.min(10, Math.max(0, rpNumber(rp, a.key)));
                return (
                  <div key={a.key}>
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      <span>{a.label}</span>
                      <span className="text-white font-bold">{val}/10</span>
                    </div>
                    <ProgressBar value={val} max={10} color={val >= 8 ? 'green' : val >= 6 ? 'gold' : 'red'} />
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}

      {/* ── Mental Attributes (out of 10) ── */}
      {(() => {
        const mental = [
          { key: 'vision', label: 'Vision / Awareness', icon: Eye },
          { key: 'decisionMaking', label: 'Decision Making', icon: Brain },
          { key: 'leadership', label: 'Leadership', icon: Star },
          { key: 'workRate', label: 'Work Rate', icon: Bolt },
          { key: 'composure', label: 'Composure', icon: HeartIcon },
        ].filter(m => rpNumber(rp, m.key) > 0);
        if (mental.length === 0) return null;
        return (
          <Card hover>
            <SectionTitle icon={Brain}>Mental Attributes</SectionTitle>
            <div className="flex flex-col gap-2">
              {mental.map(m => {
                const val = Math.min(10, Math.max(0, rpNumber(rp, m.key)));
                return (
                  <div key={m.key}>
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      <span>{m.label}</span>
                      <span className="text-white font-bold">{val}/10</span>
                    </div>
                    <ProgressBar value={val} max={10} color={val >= 8 ? 'green' : val >= 6 ? 'gold' : 'red'} />
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
