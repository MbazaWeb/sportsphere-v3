'use client';

// ─── Commentator Broadcasts Tab (signature feature) ──────────
//
// Parses the `matchLog` textarea into a list of broadcasts with
// competition, broadcaster, co-commentator, and role.
//
// Format: Date | Match | Competition | Broadcaster | Co-commentator | Role
// Role drives the badge color.

import { Mic, Calendar, Building2, Trophy, Users, Radio, Tv, Headphones } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, EmptyState, Badge, StatGrid, StatTile, rpString, rpNumber } from '../../shared/ui';

interface Broadcast {
  date: string;
  match: string;
  competition: string;
  broadcaster: string;
  coCommentator: string;
  role: string;
}

const ROLE_BADGE: Record<string, 'gold' | 'blue' | 'muted' | 'green' | 'red'> = {
  lead:          'gold',
  'co-commentator': 'blue',
  co:            'blue',
  presenter:     'green',
  pundit:        'red',
  studio:        'muted',
  analyst:       'muted',
};

export function parseBroadcasts(raw: string): Broadcast[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const p = line.split('|').map(s => s.trim());
      return {
        date: p[0] || '',
        match: p[1] || '',
        competition: p[2] || '',
        broadcaster: p[3] || '',
        coCommentator: p[4] || '',
        role: p[5] || 'Lead',
      };
    })
    .filter(b => b.match || b.broadcaster);
}

function BroadcasterIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes('tv') || n.includes('television')) return <Tv className="h-3 w-3 text-purple-400" />;
  if (n.includes('radio'))                          return <Radio className="h-3 w-3 text-pink-400" />;
  if (n.includes('stream') || n.includes('youtube'))return <Headphones className="h-3 w-3 text-red-400" />;
  return <Building2 className="h-3 w-3 text-muted-foreground" />;
}

export function CommentatorBroadcastsTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const broadcasts = parseBroadcasts(rpString(rp, 'matchLog'));

  if (broadcasts.length === 0) {
    return (
      <EmptyState
        icon={Mic}
        title="No broadcasts logged yet"
        message="Add your match coverage from Edit Profile → Broadcast Log. Format: Date | Match | Competition | Broadcaster | Co-commentator | Role"
      />
    );
  }

  // Aggregate from the log (or fallback to declared aggregates if log is shorter)
  const declaredMatches = rpNumber(rp, 'matchesCovered');
  const totalMatches = Math.max(broadcasts.length, declaredMatches);
  const uniqueCompetitions = new Set(broadcasts.map(b => b.competition).filter(Boolean));
  const uniqueBroadcasters = new Set(broadcasts.map(b => b.broadcaster).filter(Boolean));
  const declaredCompetitions = rpNumber(rp, 'competitions');
  const declaredCountries = rpNumber(rp, 'countries');
  const totalCompetitions = Math.max(uniqueCompetitions.size, declaredCompetitions);

  // Role breakdown
  const roleCounts: Record<string, number> = {};
  broadcasts.forEach(b => {
    const r = b.role.toLowerCase();
    roleCounts[r] = (roleCounts[r] || 0) + 1;
  });

  // Sort by date descending (lexicographic ISO date works; for free-form dates, original order)
  const sorted = [...broadcasts];

  return (
    <div className="flex flex-col gap-3">
      {/* Aggregate stats */}
      <Card hover>
        <SectionTitle icon={Mic}>Broadcast Career</SectionTitle>
        <StatGrid cols={4}>
          <StatTile icon={Mic}        label="Matches"     value={totalMatches} accent="gold" />
          <StatTile icon={Trophy}     label="Competitions" value={totalCompetitions} />
          <StatTile icon={Building2}  label="Broadcasters" value={uniqueBroadcasters.size} />
          <StatTile icon={Calendar}   label="Countries"   value={declaredCountries} />
        </StatGrid>
        {Object.keys(roleCounts).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {Object.entries(roleCounts).map(([role, count]) => (
              <Badge key={role} color={ROLE_BADGE[role] || 'muted'}>
                {count}× {role}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Broadcast list */}
      <Card hover>
        <SectionTitle icon={Calendar} action={<Badge color="muted">{broadcasts.length} entries</Badge>}>
          Recent Broadcasts
        </SectionTitle>
        <div className="flex flex-col">
          {sorted.map((b, i) => {
            const roleKey = b.role.toLowerCase();
            const roleColor = ROLE_BADGE[roleKey] || 'muted';
            return (
              <div key={i} className="py-2.5 border-b border-surface-border/40 last:border-b-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-bold text-white flex-1 min-w-0 leading-tight">{b.match || 'Unknown match'}</p>
                  <Badge color={roleColor}>{b.role}</Badge>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground">
                  {b.date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{b.date}
                    </span>
                  )}
                  {b.competition && (
                    <span className="inline-flex items-center gap-1">
                      <Trophy className="h-3 w-3" />{b.competition}
                    </span>
                  )}
                  {b.broadcaster && (
                    <span className="inline-flex items-center gap-1">
                      <BroadcasterIcon name={b.broadcaster} />{b.broadcaster}
                    </span>
                  )}
                  {b.coCommentator && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />with {b.coCommentator}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
