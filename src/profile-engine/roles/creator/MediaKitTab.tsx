'use client';

// ─── Creator Media Kit Tab (signature feature) ───────────────
//
// A polished media-kit-style card with:
//   - Audience snapshot (followers, engagement, avg views, reach)
//   - Audience demographics (location, age, gender split)
//   - Top content list (parsed from textarea)
//   - Brand collaborations list (parsed from textarea)
//   - Booking contact CTA

import {
  Camera, Users, Eye, TrendingUp, MapPin, Calendar, DollarSign, Mail,
  Youtube, Instagram, Play, Heart, ExternalLink, Sparkles,
} from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, EmptyState, Badge, StatGrid, StatTile, KeyValueRow, ProgressBar, rpString, rpNumber, rpArray } from '../../shared/ui';

interface TopContent {
  title: string;
  platform: string;
  type: string;
  url: string;
  views: number;
  likes: number;
}

interface BrandCollab {
  brand: string;
  campaign: string;
  year: string;
  value: string;
}

function parseCount(v: string): number {
  if (!v) return 0;
  const s = v.trim().toLowerCase().replace(/,/g, '');
  const m = s.match(/^([\d.]+)\s*([km])?$/);
  if (!m) return parseInt(s, 10) || 0;
  const n = parseFloat(m[1]);
  if (m[2] === 'k') return Math.round(n * 1000);
  if (m[2] === 'm') return Math.round(n * 1_000_000);
  return Math.round(n);
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function parseTopContent(raw: string): TopContent[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const p = line.split('|').map(s => s.trim());
      return {
        title: p[0] || 'Untitled',
        platform: p[1] || '',
        type: p[2] || '',
        url: p[3] || '',
        views: parseCount(p[4] || ''),
        likes: parseCount(p[5] || ''),
      };
    })
    .filter(c => c.title !== 'Untitled' || c.url);
}

function parseBrandCollabs(raw: string): BrandCollab[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const p = line.split('|').map(s => s.trim());
      return {
        brand: p[0] || '',
        campaign: p[1] || '',
        year: p[2] || '',
        value: p[3] || '',
      };
    })
    .filter(c => c.brand);
}

function PlatformIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes('you')) return <Youtube className="h-3 w-3 text-red-400" />;
  if (n.includes('insta')) return <Instagram className="h-3 w-3 text-pink-400" />;
  if (n.includes('tik')) return <Play className="h-3 w-3 text-cyan-400" />;
  return <Camera className="h-3 w-3 text-muted-foreground" />;
}

export function CreatorMediaKitTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const creatorType = rpString(rp, 'creatorType');
  const platforms = rpArray(rp, 'platforms').map(String);
  const niche = rpString(rp, 'niche');
  const audienceLoc = rpString(rp, 'audienceLocation');
  const audienceAge = rpString(rp, 'audienceAgeRange');
  const audienceGender = rpString(rp, 'audienceGender');

  const followers = parseCount(rpString(rp, 'followers'));
  const engagement = rpNumber(rp, 'engagementRate');
  const avgViews = parseCount(rpString(rp, 'avgViews'));
  const reach = parseCount(rpString(rp, 'reach'));
  const postsPerWeek = rpNumber(rp, 'postsPerWeek');

  const topContent = parseTopContent(rpString(rp, 'topContent'));
  const collabs = parseBrandCollabs(rpString(rp, 'brandCollabs'));
  const bookingEmail = rpString(rp, 'bookingEmail');

  const hasAny =
    creatorType || platforms.length || followers || engagement || avgViews ||
    topContent.length || collabs.length || bookingEmail;

  if (!hasAny) {
    return (
      <EmptyState
        icon={Camera}
        title="Your media kit is empty"
        message="Add your platforms, audience analytics, and top content from Edit Profile to generate a shareable media kit."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Media Kit header */}
      <Card hover className="border-gold/30">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-orange-500/30 flex-shrink-0">
            <Camera className="h-6 w-6 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Media Kit</p>
            <p className="text-base font-black text-white truncate">{apiUser?.name || 'Creator'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {creatorType}{niche ? ` · ${niche}` : ''}
            </p>
          </div>
          {bookingEmail && (
            <a
              href={`mailto:${bookingEmail}`}
              className="inline-flex items-center gap-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] font-bold uppercase px-2.5 py-1 hover:bg-gold/25 transition-colors flex-shrink-0"
            >
              <Mail className="h-3 w-3" />Book
            </a>
          )}
        </div>
        {platforms.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-surface border border-surface-border px-2 py-0.5 text-[10px] font-semibold text-white">
                <PlatformIcon name={p} />{p}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Audience snapshot */}
      {(followers || engagement || avgViews || reach) ? (
        <Card hover>
          <SectionTitle icon={Users}>Audience Snapshot</SectionTitle>
          <StatGrid cols={4}>
            {followers > 0 &&   <StatTile icon={Users}      label="Followers"  value={formatCount(followers)} accent="gold" />}
            {engagement > 0 &&  <StatTile icon={TrendingUp} label="Engagement" value={`${engagement}%`} accent="green" />}
            {avgViews > 0 &&    <StatTile icon={Eye}        label="Avg Views"  value={formatCount(avgViews)} />}
            {reach > 0 &&       <StatTile icon={Sparkles}   label="Monthly Reach" value={formatCount(reach)} />}
          </StatGrid>
          {postsPerWeek > 0 && (
            <p className="text-[10px] text-muted-foreground mt-2">Posts {postsPerWeek}×/week</p>
          )}
        </Card>
      ) : null}

      {/* Demographics */}
      {(audienceLoc || audienceAge || audienceGender) && (
        <Card hover>
          <SectionTitle icon={MapPin}>Audience Demographics</SectionTitle>
          {audienceLoc &&   <KeyValueRow label="Location"   value={audienceLoc} />}
          {audienceAge &&    <KeyValueRow label="Age Range"  value={audienceAge} />}
          {audienceGender && <KeyValueRow label="Gender Split" value={audienceGender} />}
        </Card>
      )}

      {/* Top content */}
      {topContent.length > 0 && (
        <Card hover>
          <SectionTitle icon={Play} action={<Badge color="muted">{topContent.length} pieces</Badge>}>
            Top Content
          </SectionTitle>
          <div className="flex flex-col">
            {topContent.map((c, i) => {
              const maxViews = Math.max(...topContent.map(t => t.views), 1);
              return (
                <div key={i} className="py-2 border-b border-surface-border/40 last:border-b-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-bold text-white flex-1 min-w-0 leading-tight">{c.title}</p>
                    {c.platform && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
                        <PlatformIcon name={c.platform} />{c.platform}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Eye className="h-3 w-3" /><span className="font-semibold text-white">{formatCount(c.views)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Heart className="h-3 w-3" /><span className="font-semibold text-white">{formatCount(c.likes)}</span>
                    </span>
                    {c.type && <Badge color="muted">{c.type}</Badge>}
                  </div>
                  <ProgressBar value={c.views} max={maxViews} color="gold" />
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-gold hover:underline">
                      <ExternalLink className="h-3 w-3" />View
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Brand collaborations */}
      {collabs.length > 0 && (
        <Card hover>
          <SectionTitle icon={DollarSign} action={<Badge color="gold">{collabs.length} collabs</Badge>}>
            Brand Collaborations
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {collabs.map((c, i) => (
              <div key={i} className="rounded-lg bg-surface border border-surface-border/50 p-2.5">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs font-bold text-white truncate">{c.brand}</p>
                  {c.year && <span className="text-[10px] text-muted-foreground">{c.year}</span>}
                </div>
                {c.campaign && <p className="text-[11px] text-gold truncate">{c.campaign}</p>}
                {c.value && <p className="text-[10px] text-muted-foreground mt-0.5">{c.value}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
