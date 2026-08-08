'use client';

// ─── Commentator Overview Tab ─────────────────────────────────
//
// Hero summary: commentator card (type, broadcaster, languages, sports),
// career stats (matches, competitions, countries, years active),
// quick broadcast log preview.

import { Mic, Building2, Calendar, Trophy, Radio, Tv, Headphones, Globe2, Clock } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString, rpNumber, rpArray } from '../../shared/ui';
import { parseBroadcasts } from './BroadcastsTab';

export function CommentatorOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const commentatorType = rpString(rp, 'commentatorType');
  const broadcaster = rpString(rp, 'broadcaster');
  const languages = rpArray(rp, 'languages').map(String);
  const sports = rpArray(rp, 'sports').map(String);
  const yearsActive = rpNumber(rp, 'yearsActive');

  const declaredMatches = rpNumber(rp, 'matchesCovered');
  const broadcasts = parseBroadcasts(rpString(rp, 'matchLog'));
  const totalMatches = Math.max(broadcasts.length, declaredMatches);
  const uniqueCompetitions = new Set(broadcasts.map(b => b.competition).filter(Boolean)).size;
  const declaredCompetitions = rpNumber(rp, 'competitions');
  const totalCompetitions = Math.max(uniqueCompetitions, declaredCompetitions);
  const countries = rpNumber(rp, 'countries');

  return (
    <div className="flex flex-col gap-3">
      {/* Identity */}
      <Card hover>
        <SectionTitle icon={Mic}>Commentator Card</SectionTitle>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 flex-shrink-0">
            <Mic className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{commentatorType || 'Type not set'}</p>
            {broadcaster && (
              <p className="text-xs text-gold truncate flex items-center gap-1">
                {broadcaster.toLowerCase().includes('tv') ? <Tv className="h-3 w-3" /> :
                 broadcaster.toLowerCase().includes('radio') ? <Radio className="h-3 w-3" /> :
                 <Headphones className="h-3 w-3" />}
                {broadcaster}
              </p>
            )}
            {sports.length > 0 && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{sports.join(' · ')}</p>
            )}
          </div>
          {yearsActive > 0 && <Badge color="gold">{yearsActive}y</Badge>}
        </div>
        {languages.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {languages.map((l, i) => <Badge key={i} color="muted">{l}</Badge>)}
          </div>
        )}
      </Card>

      {/* Career stats */}
      {(totalMatches || totalCompetitions || countries || yearsActive) ? (
        <Card hover>
          <SectionTitle icon={Trophy}>Career Stats</SectionTitle>
          <StatGrid cols={4}>
            {totalMatches > 0 &&       <StatTile icon={Mic}        label="Matches"     value={totalMatches} accent="gold" />}
            {totalCompetitions > 0 &&  <StatTile icon={Trophy}     label="Competitions" value={totalCompetitions} />}
            {countries > 0 &&          <StatTile icon={Globe2}     label="Countries"   value={countries} />}
            {yearsActive > 0 &&        <StatTile icon={Clock}      label="Years"       value={yearsActive} />}
          </StatGrid>
        </Card>
      ) : null}

      {/* Latest broadcasts preview */}
      {broadcasts.length > 0 && (
        <Card hover>
          <SectionTitle icon={Calendar} action={<Badge color="muted">{broadcasts.length} total</Badge>}>
            Recent Broadcasts
          </SectionTitle>
          <div className="flex flex-col">
            {broadcasts.slice(0, 3).map((b, i) => (
              <div key={i} className="py-2 border-b border-surface-border/40 last:border-b-0">
                <p className="text-xs font-bold text-white truncate">{b.match || '—'}</p>
                <p className="text-[10px] text-muted-foreground">
                  {b.date && <span>{b.date} · </span>}
                  {b.competition || ''}{b.competition && b.broadcaster ? ' · ' : ''}{b.broadcaster || ''}
                </p>
              </div>
            ))}
            {broadcasts.length > 3 && (
              <p className="text-[10px] text-gold mt-1.5">+{broadcasts.length - 3} more in Broadcasts tab</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
