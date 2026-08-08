'use client';

// ─── Creator Overview Tab ─────────────────────────────────────
//
// Hero summary: creator card (type, niche, platforms), top audience
// metrics (followers, engagement, avg views), quick booking CTA.

import { Camera, Users, Eye, TrendingUp, MapPin, Mail, Sparkles } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString, rpNumber, rpArray } from '../../shared/ui';
import { formatCount } from './MediaKitTab';

export function CreatorOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'creator');
  const creatorType = rpString(rp, 'creatorType');
  const platforms = rpArray(rp, 'platforms').map(String);
  const niche = rpString(rp, 'niche');
  const audienceLoc = rpString(rp, 'audienceLocation');

  const followers = ((): number => {
    const v = rpString(rp, 'followers');
    const s = v.toLowerCase().replace(/,/g, '');
    const m = s.match(/^([\d.]+)\s*([km])?$/);
    if (!m) return parseInt(s, 10) || 0;
    const n = parseFloat(m[1]);
    if (m[2] === 'k') return Math.round(n * 1000);
    if (m[2] === 'm') return Math.round(n * 1_000_000);
    return Math.round(n);
  })();
  const engagement = rpNumber(rp, 'engagementRate');
  const avgViews = ((): number => {
    const v = rpString(rp, 'avgViews');
    const s = v.toLowerCase().replace(/,/g, '');
    const m = s.match(/^([\d.]+)\s*([km])?$/);
    if (!m) return parseInt(s, 10) || 0;
    const n = parseFloat(m[1]);
    if (m[2] === 'k') return Math.round(n * 1000);
    if (m[2] === 'm') return Math.round(n * 1_000_000);
    return Math.round(n);
  })();
  const bookingEmail = rpString(rp, 'bookingEmail');

  return (
    <div className="flex flex-col gap-3">
      {/* Identity */}
      <Card hover>
        <SectionTitle icon={Camera}>Creator Card</SectionTitle>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 flex-shrink-0">
            <Camera className="h-5 w-5 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{creatorType || 'Creator type not set'}</p>
            {niche && <p className="text-xs text-gold truncate">{niche}</p>}
            {audienceLoc && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{audienceLoc}
              </p>
            )}
          </div>
          {bookingEmail && (
            <a href={`mailto:${bookingEmail}`} className="inline-flex items-center gap-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] font-bold uppercase px-2.5 py-1 hover:bg-gold/25 transition-colors flex-shrink-0">
              <Mail className="h-3 w-3" />Book
            </a>
          )}
        </div>
        {platforms.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p, i) => <Badge key={i} color="muted">{p}</Badge>)}
          </div>
        )}
      </Card>

      {/* Audience metrics */}
      {(followers || engagement || avgViews) ? (
        <Card hover>
          <SectionTitle icon={Sparkles}>Audience</SectionTitle>
          <StatGrid cols={3}>
            {followers > 0 &&   <StatTile icon={Users}      label="Followers"  value={formatCount(followers)} accent="gold" />}
            {engagement > 0 &&  <StatTile icon={TrendingUp} label="Engagement" value={`${engagement}%`} accent="green" />}
            {avgViews > 0 &&    <StatTile icon={Eye}        label="Avg Views"  value={formatCount(avgViews)} />}
          </StatGrid>
        </Card>
      ) : null}
    </div>
  );
}
