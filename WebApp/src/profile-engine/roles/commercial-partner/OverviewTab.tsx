'use client';

// ─── Commercial Partner Overview Tab ──────────────────────────
//
// Hero summary: partner card (type, brand, sports category, status),
// portfolio stats (teams/players/competitions/events counts), website CTA.

import { Handshake, MapPin, ExternalLink, Trophy, Users, Medal, Calendar } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString } from '../../shared/ui';

function countLines(raw: string): number {
  if (!raw) return 0;
  return raw.split('\n').map(l => l.trim()).filter(Boolean).length;
}

export function CommercialPartnerOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'commercial-partner');
  const partnerType = rpString(rp, 'partnerType');
  const brand = rpString(rp, 'brand');
  const sportsCategory = rpString(rp, 'sportsCategory');
  const partnershipStatus = rpString(rp, 'partnershipStatus');
  const foundedYear = rpString(rp, 'foundedYear');
  const headquarters = rpString(rp, 'headquarters');
  const website = rpString(rp, 'website');

  const teamCount = countLines(rpString(rp, 'sponsoredTeams'));
  const playerCount = countLines(rpString(rp, 'sponsoredPlayers'));
  const compCount = countLines(rpString(rp, 'sponsoredCompetitions'));
  const eventCount = countLines(rpString(rp, 'sponsoredEvents'));

  const statusBadgeColor: 'green' | 'gold' | 'red' | 'muted' =
    partnershipStatus === 'Active' ? 'green' :
    partnershipStatus === 'Pending' ? 'gold' :
    partnershipStatus === 'Ended' ? 'muted' : 'muted';

  return (
    <div className="flex flex-col gap-3">
      {/* Identity */}
      <Card hover className="border-purple-500/30">
        <SectionTitle icon={Handshake}>Commercial Partner</SectionTitle>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 flex-shrink-0">
            <Handshake className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{brand || 'Brand not set'}</p>
            {partnerType && <p className="text-xs text-purple-400 truncate">{partnerType}</p>}
            {sportsCategory && <p className="text-xs text-muted-foreground truncate">{sportsCategory}</p>}
            {headquarters && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{headquarters}
              </p>
            )}
          </div>
          {partnershipStatus && <Badge color={statusBadgeColor}>{partnershipStatus}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {foundedYear && <KeyValueRow label="Brand Founded" value={foundedYear} />}
        </div>
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-gold hover:underline">
            <ExternalLink className="h-3 w-3" />{website}
          </a>
        )}
      </Card>

      {/* Portfolio stats */}
      {(teamCount || playerCount || compCount || eventCount) ? (
        <Card hover>
          <SectionTitle icon={Trophy}>Portfolio at a Glance</SectionTitle>
          <StatGrid cols={4}>
            <StatTile icon={Trophy}   label="Teams"        value={teamCount} accent="gold" />
            <StatTile icon={Users}    label="Players"      value={playerCount} />
            <StatTile icon={Medal}    label="Competitions" value={compCount} />
            <StatTile icon={Calendar} label="Events"       value={eventCount} />
          </StatGrid>
        </Card>
      ) : null}
    </div>
  );
}
