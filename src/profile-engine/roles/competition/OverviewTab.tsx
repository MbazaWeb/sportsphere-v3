'use client';

// ─── Competition Overview Tab ─────────────────────────────────
//
// Hero summary: competition card (name, season, organizer, format),
// current season stats (participants, top scorer, top assists).

import { Trophy, MapPin, Building2, Calendar, Users, Target, Zap } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString, rpNumber } from '../../shared/ui';

export function CompetitionOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const name = rpString(rp, 'competitionName');
  const season = rpString(rp, 'season');
  const organizer = rpString(rp, 'organizer');
  const country = rpString(rp, 'country');
  const level = rpString(rp, 'level');
  const format = rpString(rp, 'format');
  const participants = rpNumber(rp, 'participants');
  const topScorer = rpString(rp, 'topScorer');
  const topAssists = rpString(rp, 'topAssists');

  return (
    <div className="flex flex-col gap-3">
      {/* Identity */}
      <Card hover className="border-gold/30">
        <SectionTitle icon={Trophy}>Competition</SectionTitle>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-yellow-500/20 border border-gold/30 flex-shrink-0">
            <Trophy className="h-6 w-6 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black text-white truncate">{name || 'Competition name not set'}</p>
            {season && <p className="text-xs text-gold truncate">{season} season</p>}
            {country && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{country}
              </p>
            )}
          </div>
          {format && <Badge color="gold">{format}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {organizer && <KeyValueRow label="Organizer" value={organizer} />}
          {level && <KeyValueRow label="Level" value={<Badge color="muted">{level}</Badge>} />}
        </div>
      </Card>

      {/* Season stats */}
      {(participants || topScorer || topAssists) ? (
        <Card hover>
          <SectionTitle icon={Calendar}>Current Season</SectionTitle>
          <StatGrid cols={3}>
            {participants > 0 && <StatTile icon={Users}  label="Teams"      value={participants} accent="gold" />}
            {topScorer &&        <StatTile icon={Target} label="Top Scorer" value={topScorer} />}
            {topAssists &&       <StatTile icon={Zap}    label="Top Assists" value={topAssists} />}
          </StatGrid>
        </Card>
      ) : null}
    </div>
  );
}
