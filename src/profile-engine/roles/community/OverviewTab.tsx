'use client';

// ─── Community Overview Tab ───────────────────────────────────
//
// Hero summary: community card (name, type, supported team, location),
// member stats, description.

import { Users, MapPin, Calendar, Heart, BookOpen } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString, rpNumber } from '../../shared/ui';

export function CommunityOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const name = rpString(rp, 'communityName');
  const communityType = rpString(rp, 'communityType');
  const foundedYear = rpString(rp, 'foundedYear');
  const location = rpString(rp, 'location');
  const supportedTeam = rpString(rp, 'supportedTeam');
  const description = rpString(rp, 'description');

  const memberCount = rpNumber(rp, 'memberCount');
  const activeMembers = rpNumber(rp, 'activeMembers');
  const eventCount = rpNumber(rp, 'eventCount');
  const postCount = rpNumber(rp, 'postCount');

  return (
    <div className="flex flex-col gap-3">
      {/* Identity */}
      <Card hover>
        <SectionTitle icon={Users}>Community</SectionTitle>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 flex-shrink-0">
            <Users className="h-5 w-5 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{name || 'Community name not set'}</p>
            {communityType && <p className="text-xs text-orange-400 truncate">{communityType}</p>}
            {location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{location}
              </p>
            )}
          </div>
          {foundedYear && <Badge color="gold">Est. {foundedYear}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {supportedTeam && <KeyValueRow label="Supports" value={<span className="inline-flex items-center gap-1"><Heart className="h-3 w-3 text-red-400" />{supportedTeam}</span>} />}
        </div>
        {description && (
          <p className="text-xs text-white leading-relaxed mt-3 whitespace-pre-wrap">{description}</p>
        )}
      </Card>

      {/* Member stats */}
      {(memberCount || activeMembers || eventCount || postCount) ? (
        <Card hover>
          <SectionTitle icon={Calendar}>Community Pulse</SectionTitle>
          <StatGrid cols={4}>
            <StatTile icon={Users}    label="Members" value={memberCount.toLocaleString()} accent="gold" />
            <StatTile icon={Users}    label="Active"  value={activeMembers.toLocaleString()} accent="green" />
            <StatTile icon={Calendar} label="Events"  value={eventCount} />
            <StatTile icon={BookOpen} label="Posts"   value={postCount.toLocaleString()} />
          </StatGrid>
        </Card>
      ) : null}
    </div>
  );
}
