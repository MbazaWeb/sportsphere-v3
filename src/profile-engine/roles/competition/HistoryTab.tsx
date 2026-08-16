'use client';

// ─── Competition History Tab ──────────────────────────────────
//
// Shows previous winners as a timeline and competition records.
//
// previousWinners: Year | Winner | Runner-up | Score
// records:         Record | Holder | Year

import { Trophy, Award, Medal } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, EmptyState, Badge, TimelineItem, rpString } from '../../shared/ui';

interface Winner { year: string; winner: string; runnerUp: string; score: string; }
interface CompetitionRecord { record: string; holder: string; year: string; }

export function CompetitionHistoryTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'competition');
  const rawWinners = rpString(rp, 'previousWinners');
  const rawRecords = rpString(rp, 'records');

  const winners: Winner[] = rawWinners
    ? rawWinners.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
        const p = line.split('|').map(s => s.trim());
        return { year: p[0] || '', winner: p[1] || '', runnerUp: p[2] || '', score: p[3] || '' };
      }).filter(w => w.year || w.winner)
    : [];

  const records: CompetitionRecord[] = rawRecords
    ? rawRecords.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
        const p = line.split('|').map(s => s.trim());
        return { record: p[0] || '', holder: p[1] || '', year: p[2] || '' };
      }).filter(r => r.record || r.holder)
    : [];

  if (winners.length === 0 && records.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No history published yet"
        message="Add previous winners and competition records from Edit Profile."
      />
    );
  }

  // Sort winners by year descending
  const sortedWinners = [...winners].sort((a, b) => b.year.localeCompare(a.year));

  return (
    <div className="flex flex-col gap-3">
      {/* Previous winners timeline */}
      {sortedWinners.length > 0 && (
        <Card hover>
          <SectionTitle icon={Trophy} action={<Badge color="gold">{sortedWinners.length}</Badge>}>
            Honours Roll
          </SectionTitle>
          <div className="flex flex-col">
            {sortedWinners.map((w, i) => (
              <TimelineItem
                key={i}
                year={w.year}
                title={w.winner || 'Unknown'}
                subtitle={
                  w.runnerUp
                    ? `def. ${w.runnerUp}${w.score ? ` ${w.score}` : ''}`
                    : undefined
                }
                icon={i === 0 ? Trophy : Medal}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Records */}
      {records.length > 0 && (
        <Card hover>
          <SectionTitle icon={Award} action={<Badge color="muted">{records.length}</Badge>}>
            Competition Records
          </SectionTitle>
          <div className="flex flex-col">
            {records.map((r, i) => (
              <div key={i} className="py-2 border-b border-surface-border/40 last:border-b-0 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{r.record}</p>
                  {r.holder && <p className="text-[11px] text-gold truncate">{r.holder}</p>}
                </div>
                {r.year && <span className="text-[10px] text-muted-foreground flex-shrink-0">{r.year}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
