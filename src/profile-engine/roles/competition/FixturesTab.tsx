'use client';

// ─── Competition Fixtures Tab ─────────────────────────────────
//
// Parses the `fixtures` textarea into a list of matches grouped
// by round. Status drives the badge color and score display.
//
// Format: Date | Home | Score | Away | Round | Status

import { Calendar, Trophy } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, EmptyState, Badge, rpString } from '../../shared/ui';

interface Fixture {
  date: string;
  home: string;
  score: string;
  away: string;
  round: string;
  status: 'Scheduled' | 'Live' | 'Finished' | string;
}

const STATUS_BADGE: Record<string, 'gold' | 'red' | 'green' | 'muted'> = {
  scheduled: 'muted',
  live:      'red',
  finished:  'green',
  postponed: 'muted',
  cancelled: 'muted',
};

function parseFixtures(raw: string): Fixture[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const p = line.split('|').map(s => s.trim());
      return {
        date: p[0] || '',
        home: p[1] || '',
        score: p[2] || '',
        away: p[3] || '',
        round: p[4] || '',
        status: p[5] || 'Scheduled',
      };
    })
    .filter(f => f.home || f.away);
}

export function CompetitionFixturesTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const fixtures = parseFixtures(rpString(rp, 'fixtures'));

  if (fixtures.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No fixtures published yet"
        message="Add fixtures from Edit Profile. Format: Date | Home | Score | Away | Round | Status"
      />
    );
  }

  // Group by round
  const byRound: Record<string, Fixture[]> = {};
  fixtures.forEach(f => {
    const round = f.round || 'Matches';
    if (!byRound[round]) byRound[round] = [];
    byRound[round].push(f);
  });

  const rounds = Object.keys(byRound);

  return (
    <div className="flex flex-col gap-3">
      {rounds.map(round => (
        <Card key={round} hover>
          <SectionTitle icon={Trophy} action={<Badge color="muted">{byRound[round].length}</Badge>}>
            {round}
          </SectionTitle>
          <div className="flex flex-col">
            {byRound[round].map((f, i) => {
              const statusKey = f.status.toLowerCase();
              const badgeColor = STATUS_BADGE[statusKey] || 'muted';
              const isLive = statusKey === 'live';
              const isFinished = statusKey === 'finished' || f.score;
              return (
                <div key={i} className="py-2 border-b border-surface-border/40 last:border-b-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-xs font-bold text-white truncate">{f.home || 'TBD'}</p>
                    </div>
                    <div className="flex flex-col items-center px-2 flex-shrink-0">
                      {isFinished || isLive ? (
                        <span className={`text-sm font-black ${isLive ? 'text-red-400 animate-pulse' : 'text-gold'}`}>
                          {f.score || 'vs'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">vs</span>
                      )}
                      {f.date && <span className="text-[9px] text-muted-foreground">{f.date}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{f.away || 'TBD'}</p>
                    </div>
                    <Badge color={badgeColor} className="flex-shrink-0">{f.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
