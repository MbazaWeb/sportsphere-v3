'use client';

// ─── Organization Overview Tab ────────────────────────────────
//
// Hero summary: organization card (type, country, HQ, founded year),
// quick stats (leaders/departments/affiliates/competitions counts).

import { Building2, MapPin, Calendar, Crown, Briefcase, Network, Trophy } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString } from '../../shared/ui';

function countLines(raw: string): number {
  if (!raw) return 0;
  return raw.split('\n').map(l => l.trim()).filter(Boolean).length;
}

export function OrganizationOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const orgType = rpString(rp, 'orgType');
  const country = rpString(rp, 'country');
  const headquarters = rpString(rp, 'headquarters');
  const foundedYear = rpString(rp, 'foundedYear');

  const leaderCount = countLines(rpString(rp, 'leadership'));
  const deptCount = countLines(rpString(rp, 'departments'));
  const affCount = countLines(rpString(rp, 'affiliates'));
  const compCount = countLines(rpString(rp, 'competitions'));

  return (
    <div className="flex flex-col gap-3">
      {/* Identity */}
      <Card hover>
        <SectionTitle icon={Building2}>Organization</SectionTitle>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 flex-shrink-0">
            <Building2 className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{orgType || 'Type not set'}</p>
            {country && <p className="text-xs text-gold truncate">{country}</p>}
            {headquarters && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{headquarters}
              </p>
            )}
          </div>
          {foundedYear && <Badge color="gold">Est. {foundedYear}</Badge>}
        </div>
      </Card>

      {/* Stats */}
      {(leaderCount || deptCount || affCount || compCount) ? (
        <Card hover>
          <SectionTitle icon={Network}>At a Glance</SectionTitle>
          <StatGrid cols={4}>
            <StatTile icon={Crown}     label="Leaders"     value={leaderCount} accent="gold" />
            <StatTile icon={Briefcase} label="Departments" value={deptCount} />
            <StatTile icon={Network}   label="Affiliates"  value={affCount} accent="blue" />
            <StatTile icon={Trophy}    label="Competitions" value={compCount} accent="gold" />
          </StatGrid>
        </Card>
      ) : null}
    </div>
  );
}
