'use client';

// ─── Player Overview Tab ───────────────────────────────────────
//
// Hero summary: identity card (position, foot, height/weight, jersey),
// top 3 performance highlights, current club, market value.

import { Footprints, Activity, TrendingUp, DollarSign, Building2, Flag, Ruler, Weight } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString, rpNumber } from '../../shared/ui';

export function PlayerOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const position = rpString(rp, 'position');
  const preferredFoot = rpString(rp, 'preferredFoot');
  const height = rpNumber(rp, 'height');
  const weight = rpNumber(rp, 'weight');
  const jerseyNumber = rpString(rp, 'jerseyNumber');
  const currentClub = rpString(rp, 'currentClub');
  const nationality = rpString(rp, 'nationality');
  const marketValue = rpString(rp, 'marketValue');
  const form = rpString(rp, 'form');
  const goals = rpNumber(rp, 'goals');
  const assists = rpNumber(rp, 'assists');
  const appearances = rpNumber(rp, 'appearances');
  const rating = rpNumber(rp, 'rating');

  return (
    <div className="flex flex-col gap-3">
      {/* Identity card */}
      <Card hover>
        <SectionTitle icon={Footprints}>Player Card</SectionTitle>
        <div className="flex items-center gap-3 mb-3">
          {jerseyNumber && (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 border border-gold/30">
              <span className="text-base font-black text-gold">{jerseyNumber}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">
              {position || 'Position not set'}
              {preferredFoot && <span className="text-xs text-muted-foreground ml-2">· {preferredFoot} foot</span>}
            </p>
            {currentClub && <p className="text-xs text-gold">{currentClub}</p>}
            {nationality && <p className="text-xs text-muted-foreground">{nationality}</p>}
          </div>
          {form && <Badge color={form === 'Excellent' ? 'green' : form === 'Injured' || form === 'Poor' ? 'red' : 'gold'}>{form}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {height > 0 && <KeyValueRow label="Height" value={`${height} cm`} />}
          {weight > 0 && <KeyValueRow label="Weight" value={`${weight} kg`} />}
          {rpString(rp, 'secondaryPosition') && <KeyValueRow label="Alt Position" value={rpString(rp, 'secondaryPosition')} />}
          {rpString(rp, 'playerType') && <KeyValueRow label="Type" value={rpString(rp, 'playerType')} />}
          {rpString(rp, 'careerStatus') && <KeyValueRow label="Status" value={rpString(rp, 'careerStatus')} />}
          {rpString(rp, 'contractUntil') && <KeyValueRow label="Contract" value={rpString(rp, 'contractUntil')} />}
        </div>
      </Card>

      {/* Top stats */}
      {(goals || assists || appearances || rating) ? (
        <Card hover>
          <SectionTitle icon={Activity}>Season Highlights</SectionTitle>
          <StatGrid cols={4}>
            {goals > 0 && <StatTile icon={Activity} label="Goals" value={goals} accent="gold" />}
            {assists > 0 && <StatTile icon={TrendingUp} label="Assists" value={assists} />}
            {appearances > 0 && <StatTile icon={Footprints} label="Apps" value={appearances} />}
            {rating > 0 && <StatTile icon={Activity} label="Rating" value={rating.toFixed(1)} accent="gold" />}
          </StatGrid>
        </Card>
      ) : null}

      {/* Market value */}
      {marketValue && (
        <Card hover>
          <SectionTitle icon={DollarSign}>Market Value</SectionTitle>
          <p className="text-2xl font-black text-gold">{marketValue}</p>
        </Card>
      )}
    </div>
  );
}
