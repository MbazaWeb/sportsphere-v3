'use client';

// ─── Coach Overview Tab ────────────────────────────────────────
//
// Hero: role + current team + license. Top stats: win rate, PPG,
// trophies, years coaching.

import { Megaphone, Building2, Award, TrendingUp, Trophy, Clock, Flag } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, ProgressBar, rpString, rpNumber } from '../../shared/ui';

export function CoachOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'coach');
  const coachingRole = rpString(rp, 'coachingRole');
  const currentTeam = rpString(rp, 'currentTeam');
  const license = rpString(rp, 'license');
  const licenseFederation = rpString(rp, 'licenseFederation');
  const nationality = rpString(rp, 'nationality');
  const yearsCoaching = rpNumber(rp, 'yearsCoaching');

  const matches = rpNumber(rp, 'matchesManaged');
  const wins = rpNumber(rp, 'wins');
  const ppg = rpNumber(rp, 'pointsPerGame');
  const trophies = rpNumber(rp, 'trophiesWon');
  const formation = rpString(rp, 'preferredFormation');

  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Identity card */}
      <Card hover>
        <SectionTitle icon={Megaphone}>Coach Card</SectionTitle>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30">
            <Megaphone className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{coachingRole || 'Coach'}</p>
            {currentTeam && <p className="text-xs text-gold">{currentTeam}</p>}
            {nationality && <p className="text-xs text-muted-foreground">{nationality}</p>}
          </div>
          {license && license !== 'None' && (
            <Badge color={license === 'Pro License' ? 'gold' : 'muted'}>{license}</Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {formation && <KeyValueRow label="Formation" value={formation} />}
          {licenseFederation && <KeyValueRow label="Federation" value={licenseFederation} />}
          {yearsCoaching > 0 && <KeyValueRow label="Years Coaching" value={yearsCoaching} />}
          {rpString(rp, 'dateOfBirth') && <KeyValueRow label="Born" value={rpString(rp, 'dateOfBirth')} />}
        </div>
      </Card>

      {/* Top stats */}
      {(winRate > 0 || ppg > 0 || trophies > 0 || matches > 0) && (
        <Card hover>
          <SectionTitle icon={TrendingUp}>Career Summary</SectionTitle>
          <StatGrid cols={4}>
            {winRate > 0 && <StatTile icon={TrendingUp} label="Win Rate" value={`${winRate}%`} accent="gold" />}
            {ppg > 0 &&     <StatTile icon={TrendingUp} label="PPG" value={ppg.toFixed(2)} />}
            {trophies > 0 && <StatTile icon={Trophy}    label="Trophies" value={trophies} accent="gold" />}
            {matches > 0 &&  <StatTile icon={Clock}     label="Matches" value={matches} />}
          </StatGrid>
          {winRate > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                <span>Win Rate</span>
                <span>{winRate}%</span>
              </div>
              <ProgressBar value={winRate} color={winRate >= 50 ? 'green' : winRate >= 30 ? 'gold' : 'red'} />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
