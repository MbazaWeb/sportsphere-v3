'use client';

// ─── Player Overview Tab ───────────────────────────────────────
//
// Hero summary: identity card (position, foot, height/weight, jersey),
// top 3 performance highlights, current club, market value.
//
// NEW: Fun Facts / Trivia, Spotlight badges, Team Achievements link.

import { Footprints, Activity, TrendingUp, DollarSign, Building2, Flag, Ruler, Weight, Star, Heart, Instagram, Twitter, MapPin, Sparkles } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString, rpNumber } from '../../shared/ui';
import { PerformanceCard } from '@/components/performance/PerformanceCard';

export function PlayerOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'player');
  const position = rpString(rp, 'position');
  const preferredFoot = rpString(rp, 'preferredFoot');
  const height = rpNumber(rp, 'height');
  const weight = rpNumber(rp, 'weight');
  const jerseyNumber = rpString(rp, 'jerseyNumber');
  const currentClub = rpString(rp, 'currentClub');
  const nationality = rpString(rp, 'nationality');
  const marketValue = rpString(rp, 'marketValue');
  const form = rpString(rp, 'form');
  const goals = rpNumber(rp, 'goals');
  const assists = rpNumber(rp, 'assists');
  const appearances = rpNumber(rp, 'appearances');
  const rating = rpNumber(rp, 'rating');

  // New fields
  const nickname = rpString(rp, 'nickname');
  const placeOfBirth = rpString(rp, 'placeOfBirth');
  const idol = rpString(rp, 'idol');
  const hobbies = rpString(rp, 'hobbies');
  const socialInstagram = rpString(rp, 'socialInstagram');
  const socialTwitter = rpString(rp, 'socialTwitter');
  const dateOfBirth = rpString(rp, 'dateOfBirth');

  return (
    <div className="flex flex-col gap-3">
      {/* ── Performance Engine headline (compact: score, tier, rank, form) ── */}
      {apiUser?.id && <PerformanceCard userId={apiUser.id} compact />}

      {/* Identity card */}
      <Card hover>
        <SectionTitle icon={Footprints}>Player Card</SectionTitle>
        <div className="flex items-center gap-3 mb-3">
          {jerseyNumber && (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 border border-gold/30">
              <span className="text-base font-black text-gold">{jerseyNumber}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">
              {position || 'Position not set'}
              {preferredFoot && <span className="text-xs text-muted-foreground ml-2">· {preferredFoot} foot</span>}
            </p>
            {nickname && <p className="text-xs text-gold italic">&ldquo;{nickname}&rdquo;</p>}
            {currentClub && <p className="text-xs text-gold">{currentClub}</p>}
            {nationality && <p className="text-xs text-muted-foreground">{nationality}{placeOfBirth ? ` · ${placeOfBirth}` : ''}</p>}
          </div>
          {form && <Badge color={form === 'Excellent' ? 'green' : form === 'Injured' || form === 'Poor' ? 'red' : 'gold'}>{form}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {height > 0 && <KeyValueRow label="Height" value={`${height} cm`} />}
          {weight > 0 && <KeyValueRow label="Weight" value={`${weight} kg`} />}
          {rpString(rp, 'secondaryPosition') && <KeyValueRow label="Alt Position" value={rpString(rp, 'secondaryPosition')} />}
          {rpString(rp, 'playerType') && <KeyValueRow label="Type" value={rpString(rp, 'playerType')} />}
          {rpString(rp, 'careerStatus') && <KeyValueRow label="Status" value={rpString(rp, 'careerStatus')} />}
          {rpString(rp, 'contractUntil') && <KeyValueRow label="Contract" value={rpString(rp, 'contractUntil')} />}
          {dateOfBirth && <KeyValueRow label="Born" value={dateOfBirth} />}
        </div>
      </Card>

      {/* Top stats */}
      {(goals || assists || appearances || rating) ? (
        <Card hover>
          <SectionTitle icon={Activity}>Season Highlights</SectionTitle>
          <StatGrid cols={4}>
            {goals > 0 && <StatTile icon={Activity} label="Goals" value={goals} accent="gold" />}
            {assists > 0 && <StatTile icon={TrendingUp} label="Assists" value={assists} />}
            {appearances > 0 && <StatTile icon={Footprints} label="Apps" value={appearances} />}
            {rating > 0 && <StatTile icon={Activity} label="Rating" value={rating.toFixed(1)} accent="gold" />}
          </StatGrid>
        </Card>
      ) : null}

      {/* Market value */}
      {marketValue && (
        <Card hover>
          <SectionTitle icon={DollarSign}>Market Value</SectionTitle>
          <p className="text-2xl font-black text-gold">{marketValue}</p>
        </Card>
      )}

      {/* ── Fun Facts / Trivia ── */}
      {(nickname || idol || hobbies || socialInstagram || socialTwitter) && (
        <Card hover>
          <SectionTitle icon={Sparkles}>Fun Facts</SectionTitle>
          <div className="flex flex-col gap-1">
            {idol && <KeyValueRow label="Idol / Role Model" value={idol} />}
            {hobbies && <KeyValueRow label="Hobbies" value={hobbies} />}
            {(socialInstagram || socialTwitter) && (
              <div className="flex items-center gap-2 py-2 border-b border-surface-border/40 last:border-b-0">
                <span className="text-xs text-muted-foreground">Social</span>
                <div className="flex items-center gap-2 ml-auto">
                  {socialInstagram && (
                    <a href={`https://instagram.com/${socialInstagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300">
                      <Instagram className="h-3.5 w-3.5" />{socialInstagram}
                    </a>
                  )}
                  {socialTwitter && (
                    <a href={`https://x.com/${socialTwitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                      <Twitter className="h-3.5 w-3.5" />{socialTwitter}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
