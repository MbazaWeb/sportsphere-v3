'use client';

// ─── Community Hub Tab (signature feature) ────────────────────
//
// Shows community events list (parsed from textarea) + community rules.
//
// events: Date | Event | Type | Attendees
// rules:  one rule per line

import { Users, Calendar, BookOpen, Shield } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, EmptyState, Badge, StatGrid, StatTile, ProgressBar, rpString, rpNumber } from '../../shared/ui';

interface CommunityEvent { date: string; event: string; type: string; attendees: number; }

function parseEvents(raw: string): CommunityEvent[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const p = line.split('|').map(s => s.trim());
      return { date: p[0] || '', event: p[1] || '', type: p[2] || '', attendees: parseInt(p[3] || '0', 10) || 0 };
    })
    .filter(e => e.event);
}

export function CommunityHubTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const memberCount = rpNumber(rp, 'memberCount');
  const activeMembers = rpNumber(rp, 'activeMembers');
  const eventCount = rpNumber(rp, 'eventCount');
  const postCount = rpNumber(rp, 'postCount');

  const events = parseEvents(rpString(rp, 'events'));
  const rules = rpString(rp, 'rules')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const engagementPct = memberCount > 0 ? Math.round((activeMembers / memberCount) * 100) : 0;

  if (events.length === 0 && rules.length === 0 && !memberCount && !eventCount) {
    return (
      <EmptyState
        icon={Users}
        title="Community hub is empty"
        message="Add members, events, and rules from Edit Profile to populate your community hub."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Member stats */}
      {(memberCount || activeMembers || eventCount || postCount) ? (
        <Card hover>
          <SectionTitle icon={Users}>Community Stats</SectionTitle>
          <StatGrid cols={4}>
            <StatTile icon={Users}    label="Members"  value={memberCount.toLocaleString()} accent="gold" />
            <StatTile icon={Users}    label="Active"   value={activeMembers.toLocaleString()} accent="green" />
            <StatTile icon={Calendar} label="Events"   value={eventCount} />
            <StatTile icon={BookOpen} label="Posts"    value={postCount.toLocaleString()} />
          </StatGrid>
          {memberCount > 0 && activeMembers > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>Engagement Rate</span>
                <span className="text-gold font-bold">{engagementPct}%</span>
              </div>
              <ProgressBar value={engagementPct} max={100} color="green" />
            </div>
          )}
        </Card>
      ) : null}

      {/* Events list */}
      {events.length > 0 && (
        <Card hover>
          <SectionTitle icon={Calendar} action={<Badge color="muted">{events.length}</Badge>}>
            Community Events
          </SectionTitle>
          <div className="flex flex-col">
            {events.map((e, i) => (
              <div key={i} className="py-2 border-b border-surface-border/40 last:border-b-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-white truncate">{e.event}</p>
                  {e.date && <span className="text-[10px] text-muted-foreground flex-shrink-0">{e.date}</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {e.type && <Badge color="muted">{e.type}</Badge>}
                  {e.attendees > 0 && <span className="text-[10px] text-gold">{e.attendees} attended</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Rules */}
      {rules.length > 0 && (
        <Card hover>
          <SectionTitle icon={Shield} action={<Badge color="muted">{rules.length}</Badge>}>
            Community Rules
          </SectionTitle>
          <ol className="flex flex-col gap-1.5">
            {rules.map((r, i) => (
              <li key={i} className="text-xs text-white flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/15 border border-gold/30 text-[10px] font-bold text-gold flex-shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 leading-snug pt-0.5">{r}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
