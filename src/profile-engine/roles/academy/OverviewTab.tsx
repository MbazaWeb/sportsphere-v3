'use client';

// ─── Academy Overview Tab ─────────────────────────────────────
//
// Hero summary: academy card (name, parent org, location, director),
// outcome stats (developed, promoted, pro, scholarships), pipeline
// preview.

import { GraduationCap, MapPin, User, Calendar, Trophy, Users, Award, DollarSign } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString, rpNumber, rpArray } from '../../shared/ui';

export function AcademyOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const name = rpString(rp, 'academyName');
  const parentOrg = rpString(rp, 'parentOrg');
  const location = rpString(rp, 'location');
  const director = rpString(rp, 'director');
  const foundedYear = rpString(rp, 'foundedYear');
  const programs = rpArray(rp, 'programs').map(String);

  const developed = rpNumber(rp, 'playersDeveloped');
  const promoted = rpNumber(rp, 'playersPromoted');
  const proGrads = rpNumber(rp, 'proGraduates');
  const scholarships = rpNumber(rp, 'scholarships');

  return (
    <div className="flex flex-col gap-3">
      {/* Identity */}
      <Card hover>
        <SectionTitle icon={GraduationCap}>Academy</SectionTitle>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex-shrink-0">
            <GraduationCap className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{name || 'Academy name not set'}</p>
            {parentOrg && <p className="text-xs text-emerald-400 truncate">{parentOrg}</p>}
            {location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{location}
              </p>
            )}
          </div>
          {foundedYear && <Badge color="green">Est. {foundedYear}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {director && <KeyValueRow label="Director" value={director} />}
        </div>
        {programs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {programs.map((p, i) => <Badge key={i} color="green">{p}</Badge>)}
          </div>
        )}
      </Card>

      {/* Outcomes */}
      {(developed || promoted || proGrads || scholarships) ? (
        <Card hover>
          <SectionTitle icon={Trophy}>Outcomes</SectionTitle>
          <StatGrid cols={4}>
            {developed > 0 &&   <StatTile icon={Users}      label="Developed"   value={developed} accent="gold" />}
            {promoted > 0 &&    <StatTile icon={Trophy}     label="Promoted"    value={promoted} accent="green" />}
            {proGrads > 0 &&    <StatTile icon={Award}      label="Pro Grads"   value={proGrads} accent="gold" />}
            {scholarships > 0 &&<StatTile icon={DollarSign} label="Scholarships" value={scholarships} />}
          </StatGrid>
        </Card>
      ) : null}
    </div>
  );
}
