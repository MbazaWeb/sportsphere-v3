'use client';

// ─── Business Overview Tab ────────────────────────────────────
//
// Hero summary: company card (name, industry, HQ, founded year, employees),
// quick stats (products, partners, sponsorships, campaigns counts),
// website CTA.

import { Briefcase, MapPin, Calendar, Users, Package, ExternalLink } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString, rpNumber } from '../../shared/ui';

function countLines(raw: string): number {
  if (!raw) return 0;
  return raw.split('\n').map(l => l.trim()).filter(Boolean).length;
}

export function BusinessOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'business');
  const name = rpString(rp, 'companyName');
  const industry = rpString(rp, 'industry');
  const foundedYear = rpString(rp, 'foundedYear');
  const headquarters = rpString(rp, 'headquarters');
  const website = rpString(rp, 'website');
  const employees = rpNumber(rp, 'employees');

  const productCount = countLines(rpString(rp, 'products'));
  const teamCount = countLines(rpString(rp, 'partnerTeams'));
  const athleteCount = countLines(rpString(rp, 'partnerAthletes'));
  const sponsorCount = countLines(rpString(rp, 'sponsorships'));
  const partnerTotal = teamCount + athleteCount;

  return (
    <div className="flex flex-col gap-3">
      {/* Identity */}
      <Card hover>
        <SectionTitle icon={Briefcase}>Business</SectionTitle>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 border border-gold/30 flex-shrink-0">
            <Briefcase className="h-5 w-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{name || 'Company name not set'}</p>
            {industry && <p className="text-xs text-gold truncate">{industry}</p>}
            {headquarters && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{headquarters}
              </p>
            )}
          </div>
          {foundedYear && <Badge color="gold">Est. {foundedYear}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {employees > 0 && <KeyValueRow label="Employees" value={employees.toLocaleString()} />}
        </div>
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs text-gold hover:underline"
          >
            <ExternalLink className="h-3 w-3" />{website}
          </a>
        )}
      </Card>

      {/* Quick stats */}
      {(productCount || partnerTotal || sponsorCount) ? (
        <Card hover>
          <SectionTitle icon={Package}>At a Glance</SectionTitle>
          <StatGrid cols={3}>
            {productCount > 0 &&  <StatTile icon={Package} label="Products"   value={productCount} accent="gold" />}
            {partnerTotal > 0 &&  <StatTile icon={Users}   label="Partners"   value={partnerTotal} />}
            {sponsorCount > 0 &&  <StatTile icon={Briefcase} label="Sponsorships" value={sponsorCount} />}
          </StatGrid>
        </Card>
      ) : null}
    </div>
  );
}
