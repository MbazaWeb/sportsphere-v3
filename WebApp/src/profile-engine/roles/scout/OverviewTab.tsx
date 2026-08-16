'use client';

// ─── Scout Overview Tab ────────────────────────────────────────
//
// Hero summary: scout card (type, org, geo coverage), scouting
// funnel metrics (Discovered → Recommended → Signed), and a quick
// status preview of the scouting board.

import { Search, MapPin, Building2, Globe2, Eye, Star, CheckCircle2, Trophy, TrendingUp } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, ProgressBar, rpString, rpNumber } from '../../shared/ui';
import { parseScoutingBoard, STATUS_META } from './BoardTab';

export function ScoutOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'scout');
  const scoutType = rpString(rp, 'scoutType');
  const organization = rpString(rp, 'organization');
  const geo = rpString(rp, 'geographicCoverage');
  const specialization = rpString(rp, 'specialization');
  const yearsExperience = rpNumber(rp, 'yearsExperience');
  const sportsCovered = (rp['sportsCovered'] as unknown[] || []).map(String);

  const discovered = rpNumber(rp, 'playersDiscovered');
  const recommended = rpNumber(rp, 'playersRecommended');
  const signed = rpNumber(rp, 'successfulSignings');
  const countries = rpNumber(rp, 'countriesCovered');
  const competitions = rpNumber(rp, 'competitionsMonitored');

  const board = parseScoutingBoard(rpString(rp, 'scoutingBoard'));
  const boardCount = board.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Identity */}
      <Card hover>
        <SectionTitle icon={Search}>Scout Card</SectionTitle>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex-shrink-0">
            <Search className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">
              {scoutType || 'Scout type not set'}
            </p>
            {organization && <p className="text-xs text-gold truncate">{organization}</p>}
            {geo && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{geo}
              </p>
            )}
          </div>
          {specialization && <Badge color="green">{specialization}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {yearsExperience > 0 && <KeyValueRow label="Experience" value={`${yearsExperience} yrs`} />}
          {countries > 0 && <KeyValueRow label="Countries" value={countries} />}
          {competitions > 0 && <KeyValueRow label="Competitions" value={competitions} />}
          {sportsCovered.length > 0 && <KeyValueRow label="Sports" value={sportsCovered.join(', ')} />}
        </div>
      </Card>

      {/* Scouting funnel */}
      {(discovered || recommended || signed) ? (
        <Card hover>
          <SectionTitle icon={TrendingUp}>Scouting Funnel</SectionTitle>
          <StatGrid cols={3}>
            <StatTile icon={Eye}            label="Discovered"  value={discovered} accent="blue" />
            <StatTile icon={Star}           label="Recommended" value={recommended} accent="gold" />
            <StatTile icon={CheckCircle2}   label="Signed"      value={signed} accent="green" />
          </StatGrid>
          {discovered > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>Conversion Rate</span>
                <span className="text-gold font-bold">{Math.round((signed / discovered) * 100)}%</span>
              </div>
              <ProgressBar value={signed} max={discovered} color="green" />
            </div>
          )}
        </Card>
      ) : null}

      {/* Board preview */}
      {boardCount > 0 ? (
        <Card hover>
          <SectionTitle icon={Building2}>Board Snapshot</SectionTitle>
          <div className="grid grid-cols-4 gap-2">
            {(['Watching', 'Shortlisted', 'Recommended', 'Signed'] as const).map(status => {
              const count = board.filter(p => p.status === status).length;
              const meta = STATUS_META[status];
              return (
                <div key={status} className="rounded-lg bg-surface p-2 border border-surface-border/50 text-center">
                  <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: meta.dotColor }}>{meta.short}</p>
                  <p className="text-lg font-black text-white mt-0.5">{count}</p>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
            <Globe2 className="h-3 w-3" />View the Board tab for the full list
          </p>
        </Card>
      ) : null}
    </div>
  );
}
