'use client';

// ─── Coach Trophies Tab ────────────────────────────────────────
//
// Reuses the player achievements parser/format but with coach-specific
// categories (League titles, Cups, Promotions, Individual awards).

import { Crown, Award, Medal, Star, Trophy, TrendingUp } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, EmptyState, Badge, rpString, rpNumber } from '../../shared/ui';

interface Achievement {
  year: string;
  title: string;
  category: string;
}

function parseAchievements(raw: string): Achievement[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        year: parts[0] || '',
        title: parts[1] || line,
        category: parts[2] || 'Trophy',
      };
    });
}

function categoryIcon(category: string): typeof Trophy {
  const c = category.toLowerCase();
  if (c.includes('league') || c.includes('title')) return Trophy;
  if (c.includes('cup')) return Crown;
  if (c.includes('promotion')) return TrendingUp;
  if (c.includes('coach') || c.includes('manager') || c.includes('individual')) return Star;
  if (c.includes('medal')) return Medal;
  return Award;
}

function categoryColor(category: string): 'gold' | 'green' | 'blue' | 'muted' | 'red' {
  const c = category.toLowerCase();
  if (c.includes('league') || c.includes('title') || c.includes('cup')) return 'gold';
  if (c.includes('promotion')) return 'green';
  if (c.includes('record')) return 'blue';
  return 'muted';
}

export function CoachTrophiesTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'coach');
  const achievements = parseAchievements(rpString(rp, 'achievements'));
  const totalTrophies = rpNumber(rp, 'trophiesWon');

  const byYear = new Map<string, Achievement[]>();
  for (const a of achievements) {
    const y = a.year || '—';
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(a);
  }
  const sortedYears = Array.from(byYear.keys()).sort((a, b) => b.localeCompare(a));

  if (achievements.length === 0 && !totalTrophies) {
    return (
      <EmptyState
        icon={Crown}
        title="No trophies added yet"
        message="Add league titles, cups, promotions, and individual awards. Format: Year | Trophy | Category"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {totalTrophies > 0 && (
        <Card hover>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 border border-gold/30">
              <Trophy className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-black text-gold">{totalTrophies}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Trophies</p>
            </div>
          </div>
        </Card>
      )}

      {achievements.length > 0 && (
        <Card hover>
          <SectionTitle icon={Crown}>Honours</SectionTitle>
          <div className="flex flex-col gap-3">
            {sortedYears.map(year => (
              <div key={year}>
                <p className="text-[10px] text-gold font-bold uppercase tracking-wider mb-1.5">{year}</p>
                <div className="flex flex-col gap-1.5">
                  {byYear.get(year)!.map((a, i) => {
                    const Icon = categoryIcon(a.category);
                    const color = categoryColor(a.category);
                    return (
                      <div key={i} className="flex items-center gap-2 rounded-xl bg-surface p-2.5 border border-surface-border/40">
                        <Icon className="h-4 w-4 text-gold flex-shrink-0" />
                        <p className="text-sm font-bold text-white flex-1">{a.title}</p>
                        <Badge color={color}>{a.category}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
