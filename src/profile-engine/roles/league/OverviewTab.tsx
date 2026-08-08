'use client';

// ─── League Overview Tab ──────────────────────────────────────
//
// Hero summary: league card (name, country, division, founded year),
// league intelligence stats (avg goals, attendance, all-time leaders),
// current season snapshot.

import { Medal, MapPin, Calendar, Users, Target, Activity, TrendingUp, Crown } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString, rpNumber } from '../../shared/ui';

export function LeagueOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'league');
  const name = rpString(rp, 'leagueName');
  const country = rpString(rp, 'country');
  const division = rpString(rp, 'division');
  const foundedYear = rpString(rp, 'foundedYear');
  const currentSeason = rpString(rp, 'currentSeason');
  const organizer = rpString(rp, 'organizer');

  const teams = rpNumber(rp, 'teams');
  const matchdays = rpNumber(rp, 'matchdays');
  const topScorer = rpString(rp, 'topScorer');
  const topAssists = rpString(rp, 'topAssists');

  const avgGoals = rpNumber(rp, 'avgGoals');
  const avgAttendance = rpNumber(rp, 'avgAttendance');
  const allTimeTopScorer = rpString(rp, 'allTimeTopScorer');
  const allTimeTopApps = rpString(rp, 'allTimeTopAppearances');

  const reigningChampion = rpString(rp, 'champions');

  return (
    <div className="flex flex-col gap-3">
      {/* Identity */}
      <Card hover className="border-purple-500/30">
        <SectionTitle icon={Medal}>League</SectionTitle>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex-shrink-0">
            <Medal className="h-6 w-6 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black text-white truncate">{name || 'League name not set'}</p>
            {division && <p className="text-xs text-purple-400 truncate">{division} division</p>}
            {country && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{country}
              </p>
            )}
          </div>
          {foundedYear && <Badge color="gold">Est. {foundedYear}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {currentSeason && <KeyValueRow label="Current Season" value={currentSeason} />}
          {organizer && <KeyValueRow label="Organizer" value={organizer} />}
        </div>
      </Card>

      {/* Reigning champion */}
      {reigningChampion && (
        <Card hover className="border-gold/30">
          <SectionTitle icon={Crown}>Reigning Champion</SectionTitle>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 border border-gold/30 flex-shrink-0">
              <Crown className="h-5 w-5 text-gold" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-black text-gold truncate">{reigningChampion}</p>
              <p className="text-xs text-muted-foreground">Current title holder</p>
            </div>
          </div>
        </Card>
      )}

      {/* League Intelligence — signature */}
      {(avgGoals || avgAttendance || allTimeTopScorer || allTimeTopApps) ? (
        <Card hover>
          <SectionTitle icon={TrendingUp}>League Intelligence</SectionTitle>
          <StatGrid cols={2}>
            {avgGoals > 0 &&         <StatTile icon={Target}   label="Avg Goals/Match" value={avgGoals.toFixed(1)} accent="gold" />}
            {avgAttendance > 0 &&    <StatTile icon={Users}    label="Avg Attendance"   value={avgAttendance.toLocaleString()} />}
            {allTimeTopScorer &&     <StatTile icon={Crown}    label="All-time Scorer"  value={allTimeTopScorer} />}
            {allTimeTopApps &&       <StatTile icon={Activity} label="All-time Apps"    value={allTimeTopApps} />}
          </StatGrid>
        </Card>
      ) : null}

      {/* Current season snapshot */}
      {(teams || matchdays || topScorer || topAssists) ? (
        <Card hover>
          <SectionTitle icon={Calendar}>Current Season</SectionTitle>
          <StatGrid cols={4}>
            {teams > 0 &&      <StatTile icon={Users}  label="Teams"      value={teams} accent="gold" />}
            {matchdays > 0 &&  <StatTile icon={Calendar} label="Matchdays" value={matchdays} />}
            {topScorer &&      <StatTile icon={Target} label="Top Scorer" value={topScorer} />}
            {topAssists &&     <StatTile icon={TrendingUp} label="Top Assists" value={topAssists} />}
          </StatGrid>
        </Card>
      ) : null}
    </div>
  );
}
