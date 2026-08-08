'use client';

// ─── Team Trophies Tab ─────────────────────────────────────────

import { Crown, Trophy, Award, Medal, Star } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, EmptyState, Badge, rpString } from '../../shared/ui';

interface Trophy {
  year: string;
  title: string;
  category: string;
}

function parseTrophies(raw: string): Trophy[] {
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

function categoryIcon(cat: string): typeof Trophy {
  const c = cat.toLowerCase();
  if (c.includes('league') || c.includes('title')) return Trophy;
  if (c.includes('cup')) return Crown;
  if (c.includes('continental') || c.includes('international')) return Star;
  if (c.includes('medal')) return Medal;
  return Award;
}

function categoryColor(cat: string): 'gold' | 'green' | 'blue' | 'muted' | 'red' {
  const c = cat.toLowerCase();
  if (c.includes('league') || c.includes('title')) return 'gold';
  if (c.includes('cup')) return 'blue';
  if (c.includes('continental') || c.includes('international')) return 'green';
  return 'muted';
}

export function TeamTrophiesTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const trophies = parseTrophies(rpString(rp, 'achievements'));

  // Count by category
  const byCategory = new Map<string, number>();
  for (const t of trophies) {
    const c = t.category || 'Trophy';
    byCategory.set(c, (byCategory.get(c) || 0) + 1);
  }

  // Group by year descending
  const byYear = new Map<string, Trophy[]>();
  for (const t of trophies) {
    const y = t.year || '—';
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(t);
  }
  const sortedYears = Array.from(byYear.keys()).sort((a, b) => b.localeCompare(a));

  if (trophies.length === 0) {
    return (
      <EmptyState
        icon={Crown}
        title="No trophies added yet"
        message="Add league titles, cups, and continental honours. Format: Year | Trophy | Category"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Trophy count summary */}
      <Card hover>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 border border-gold/30">
            <Trophy className="h-6 w-6 text-gold" />
          </div>
          <div>
            <p className="text-2xl font-black text-gold">{trophies.length}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Trophies</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from(byCategory.entries()).map(([cat, count]) => (
            <Badge key={cat} color={categoryColor(cat)}>{count} {cat}</Badge>
          ))}
        </div>
      </Card>

      {/* Trophies by year */}
      <Card hover>
        <SectionTitle icon={Crown}>Honours</SectionTitle>
        <div className="flex flex-col gap-3">
          {sortedYears.map(year => (
            <div key={year}>
              <p className="text-[10px] text-gold font-bold uppercase tracking-wider mb-1.5">{year}</p>
              <div className="flex flex-col gap-1.5">
                {byYear.get(year)!.map((t, i) => {
                  const Icon = categoryIcon(t.category);
                  const color = categoryColor(t.category);
                  return (
                    <div key={i} className="flex items-center gap-2 rounded-xl bg-surface p-2.5 border border-surface-border/40">
                      <Icon className="h-4 w-4 text-gold flex-shrink-0" />
                      <p className="text-sm font-bold text-white flex-1">{t.title}</p>
                      <Badge color={color}>{t.category}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
