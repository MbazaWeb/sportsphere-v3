'use client';

// ─── Team Overview Tab ─────────────────────────────────────────
//
// Hero: club identity (founded, country, stadium, capacity, league,
// coach, owner). Plus current season position + form + 3 most recent
// trophies.
//
// NEW: Quick Stats (performance + achievements), Club History & Identity,
// Playing Style, Country Rank.

import { useState, useEffect } from 'react';
import { Users, Building2, MapPin, Calendar, Trophy, Crown, User, Activity, TrendingUp, Star, Swords, Lightbulb, Target } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString, rpNumber } from '../../shared/ui';
import { PerformanceCard } from '@/components/performance/PerformanceCard';

function parseTrophies(raw: string): { year: string; title: string; category: string }[] {
  if (!raw) return [];
  return raw.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const parts = line.split('|').map(p => p.trim());
    return { year: parts[0] || '', title: parts[1] || line, category: parts[2] || 'Trophy' };
  });
}

export function TeamOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'team');

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
  const draws = rpNumber(rp, 'draws');
  const losses = rpNumber(rp, 'losses');
  const goalsFor = rpNumber(rp, 'goalsFor');
  const form = rpString(rp, 'form');

  // New fields
  const topScorer = rpString(rp, 'topScorer');
  const mostAssists = rpString(rp, 'mostAssists');
  const seasonObjective = rpString(rp, 'seasonObjective');
  const motto = rpString(rp, 'motto');
  const rivalries = rpString(rp, 'rivalries');
  const fanCulture = rpString(rp, 'fanCulture');
  const clubLegends = rpString(rp, 'clubLegends');
  const tacticalFormation = rpString(rp, 'tacticalFormation');
  const styleOfPlay = rpString(rp, 'styleOfPlay');
  const keyPrinciples = rpString(rp, 'keyPrinciples');

  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const trophies = parseTrophies(rpString(rp, 'achievements'));

  // Country rank from standings
  const [countryRank, setCountryRank] = useState<{ pos: number; pts: number } | null>(null);

  useEffect(() => {
    if (!league || !apiUser?.name) return;
    let cancelled = false;
    (async () => {
      try {
        const slug = league.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const res = await fetch(`/api/standings?league=${encodeURIComponent(slug)}`);
        if (cancelled || !res.ok) return;
        const json = await res.json();
        if (json.standings) {
          const row = json.standings.find((s: any) =>
            s.team.toLowerCase().includes(apiUser.name.toLowerCase()) ||
            apiUser.name.toLowerCase().includes(s.team.toLowerCase())
          );
          if (row && !cancelled) setCountryRank({ pos: row.pos, pts: row.pts });
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [league, apiUser?.name]);

  const rivalList = rivalries.split('\n').map(s => s.trim()).filter(Boolean);
  const legendList = clubLegends.split('\n').map(s => s.trim()).filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      {/* ── Performance Engine headline (compact: score, tier, rank, form) ── */}
      {apiUser?.id && <PerformanceCard userId={apiUser.id} compact />}

      {/* ── Quick Stats: Performance & Achievements ── */}
      <Card hover>
        <SectionTitle icon={Star}>Quick Stats</SectionTitle>
        <StatGrid cols={4}>
          {position && <StatTile icon={TrendingUp} label="League Pos" value={position} accent="gold" />}
          {points > 0 && <StatTile icon={Trophy} label="Points" value={points} accent="gold" />}
          {trophies.length > 0 && <StatTile icon={Crown} label="Trophies" value={trophies.length} accent="gold" />}
          {winRate > 0 && <StatTile icon={Activity} label="Win Rate" value={`${winRate}%`} accent={winRate >= 50 ? 'green' : 'gold'} />}
          {matches > 0 && <StatTile icon={Activity} label="Played" value={matches} />}
          {wins > 0 && <StatTile icon={Trophy} label="Wins" value={wins} accent="green" />}
          {goalsFor > 0 && <StatTile icon={Target} label="Goals For" value={goalsFor} />}
          {countryRank && <StatTile icon={MapPin} label="Country Rank" value={`#${countryRank.pos}`} accent="blue" />}
        </StatGrid>
      </Card>

      {/* Identity card */}
      <Card hover>
        <SectionTitle icon={Building2}>Club Information</SectionTitle>
        {nickname && (
          <p className="text-base font-bold text-gold mb-2">&ldquo;{nickname}&rdquo;</p>
        )}
        {motto && (
          <p className="text-xs text-muted-foreground italic mb-2">&ldquo;{motto}&rdquo;</p>
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

      {/* ── Country Rank & Points ── */}
      {countryRank && (
        <Card hover>
          <SectionTitle icon={MapPin}>Country Ranking</SectionTitle>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rank in {country}</p>
              <p className="text-3xl font-black text-gold">#{countryRank.pos}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Points</p>
              <p className="text-3xl font-black text-gold">{countryRank.pts}</p>
            </div>
          </div>
        </Card>
      )}

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
          {/* Season top scorer / assists / objective */}
          {(topScorer || mostAssists || seasonObjective) && (
            <div className="mt-3 pt-3 border-t border-surface-border/40">
              {topScorer && <KeyValueRow label="Top Scorer" value={topScorer} />}
              {mostAssists && <KeyValueRow label="Most Assists" value={mostAssists} />}
              {seasonObjective && (
                <KeyValueRow label="Season Objective" value={<Badge color="gold">{seasonObjective}</Badge>} />
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── Playing Style & Philosophy ── */}
      {(tacticalFormation || styleOfPlay || keyPrinciples) && (
        <Card hover>
          <SectionTitle icon={Lightbulb}>Playing Style</SectionTitle>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0">
            {tacticalFormation && <KeyValueRow label="Formation" value={<Badge color="gold">{tacticalFormation}</Badge>} />}
            {styleOfPlay && <KeyValueRow label="Style" value={styleOfPlay} />}
          </div>
          {keyPrinciples && (
            <div className="mt-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Key Principles</p>
              <p className="text-sm text-white leading-relaxed">{keyPrinciples}</p>
            </div>
          )}
        </Card>
      )}

      {/* ── Club History & Identity ── */}
      {(rivalList.length > 0 || fanCulture || legendList.length > 0) && (
        <Card hover>
          <SectionTitle icon={Crown}>History & Identity</SectionTitle>
          {rivalList.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Major Rivalries</p>
              <div className="flex flex-wrap gap-1.5">
                {rivalList.map((r, i) => <Badge key={i} color="red"><Swords className="h-3 w-3 mr-1" />{r}</Badge>)}
              </div>
            </div>
          )}
          {legendList.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Club Legends</p>
              <div className="flex flex-wrap gap-1.5">
                {legendList.map((l, i) => <Badge key={i} color="gold"><Star className="h-3 w-3 mr-1" />{l}</Badge>)}
              </div>
            </div>
          )}
          {fanCulture && (
            <div className="mt-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Fan Culture</p>
              <p className="text-sm text-white leading-relaxed">{fanCulture}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}