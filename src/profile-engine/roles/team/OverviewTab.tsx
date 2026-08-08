'use client';

// ─── Team Overview Tab ─────────────────────────────────────────
//
// Hero: club identity (founded, country, stadium, capacity, league,
// coach, owner). Plus current season position + form + 3 most recent
// trophies.

import { Users, Building2, MapPin, Calendar, Trophy, Crown, User, Activity, TrendingUp } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString, rpNumber } from '../../shared/ui';

export function TeamOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;

  const nickname = rpString(rp, 'nickname');
  const foundedYear = rpString(rp, 'foundedYear');
  const country = rpString(rp, 'country');
  const city = rpString(rp, 'city');
  const stadium = rpString(rp, 'stadium');
  const capacity = rpNumber(rp, 'capacity');
  const league = rpString(rp, 'league');
  const division = rpString(rp, 'division');
  const coach = rpString(rp, 'coach');
  const owner = rpString(rp, 'owner');
  const colors = rpString(rp, 'colors');

  const position = rpString(rp, 'position');
  const points = rpNumber(rp, 'points');
  const matches = rpNumber(rp, 'matchesPlayed');
  const wins = rpNumber(rp, 'wins');
  const form = rpString(rp, 'form');

  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Identity card */}
      <Card hover>
        <SectionTitle icon={Building2}>Club Information</SectionTitle>
        {nickname && (
          <p className="text-base font-bold text-gold mb-2">&ldquo;{nickname}&rdquo;</p>
        )}
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {foundedYear && <KeyValueRow label="Founded" value={foundedYear} />}
          {country &&     <KeyValueRow label="Country" value={country} />}
          {city &&        <KeyValueRow label="City" value={city} />}
          {stadium &&     <KeyValueRow label="Stadium" value={stadium} />}
          {capacity > 0 && <KeyValueRow label="Capacity" value={capacity.toLocaleString()} />}
          {league &&      <KeyValueRow label="League" value={league} />}
          {division &&    <KeyValueRow label="Division" value={division} />}
          {coach &&       <KeyValueRow label="Coach" value={coach} />}
          {owner &&       <KeyValueRow label="Owner" value={owner} />}
          {colors &&      <KeyValueRow label="Colors" value={colors} />}
        </div>
      </Card>

      {/* Current season */}
      {(position || points || matches) && (
        <Card hover>
          <SectionTitle icon={Activity}>Current Season</SectionTitle>
          <StatGrid cols={4}>
            {position && <StatTile icon={TrendingUp} label="Position" value={position} accent="gold" />}
            {points > 0 && <StatTile icon={Trophy} label="Points" value={points} />}
            {matches > 0 && <StatTile icon={Activity} label="Matches" value={matches} />}
            {winRate > 0 && <StatTile icon={TrendingUp} label="Win %" value={`${winRate}%`} accent="green" />}
          </StatGrid>
          {form && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Form:</span>
              <div className="flex gap-1">
                {form.toUpperCase().split('').filter(c => ['W', 'D', 'L'].includes(c)).map((f, i) => (
                  <span key={i} className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                    f === 'W' ? 'bg-emerald-500/80 text-white'
                    : f === 'D' ? 'bg-surface-elevated text-muted-foreground'
                    : 'bg-red-500/80 text-white'
                  }`}>{f}</span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
