'use client';

// ─── League Champions Tab ─────────────────────────────────────
//
// Shows the roll of champions as a timeline.
// Format: Year | Champion | Runner-up

import { Crown, Medal } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, EmptyState, Badge, TimelineItem, rpString } from '../../shared/ui';

interface Champion { year: string; champion: string; runnerUp: string; }

export function LeagueChampionsTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'league');
  const reigningChampion = rpString(rp, 'champions');
  const raw = rpString(rp, 'previousChampions');

  const champions: Champion[] = raw
    ? raw.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
        const p = line.split('|').map(s => s.trim());
        return { year: p[0] || '', champion: p[1] || '', runnerUp: p[2] || '' };
      }).filter(c => c.year || c.champion)
    : [];

  if (!reigningChampion && champions.length === 0) {
    return (
      <EmptyState
        icon={Crown}
        title="No champions recorded yet"
        message="Add previous champions from Edit Profile. Format: Year | Champion | Runner-up"
      />
    );
  }

  // Sort by year descending
  const sorted = [...champions].sort((a, b) => b.year.localeCompare(a.year));

  // Most-titled club (simple count)
  const titleCounts: Record<string, number> = {};
  champions.forEach(c => {
    if (c.champion) titleCounts[c.champion] = (titleCounts[c.champion] || 0) + 1;
  });
  const mostTitled = Object.entries(titleCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Reigning champion */}
      {reigningChampion && (
        <Card hover className="border-gold/30">
          <SectionTitle icon={Crown}>Reigning Champion</SectionTitle>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 border border-gold/30 flex-shrink-0">
              <Crown className="h-6 w-6 text-gold" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-black text-gold truncate">{reigningChampion}</p>
              <p className="text-xs text-muted-foreground">Current title holder</p>
            </div>
          </div>
        </Card>
      )}

      {/* Most titled */}
      {mostTitled && (
        <Card hover>
          <SectionTitle icon={Medal}>Most Titled</SectionTitle>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">{mostTitled[0]}</p>
              <p className="text-[10px] text-muted-foreground">All-time</p>
            </div>
            <Badge color="gold">{mostTitled[1]} titles</Badge>
          </div>
        </Card>
      )}

      {/* Champions timeline */}
      {sorted.length > 0 && (
        <Card hover>
          <SectionTitle icon={Crown} action={<Badge color="muted">{sorted.length} seasons</Badge>}>
            Honours Roll
          </SectionTitle>
          <div className="flex flex-col">
            {sorted.map((c, i) => (
              <TimelineItem
                key={i}
                year={c.year}
                title={c.champion || 'Unknown'}
                subtitle={c.runnerUp ? `Runner-up: ${c.runnerUp}` : undefined}
                icon={i === 0 ? Crown : Medal}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
