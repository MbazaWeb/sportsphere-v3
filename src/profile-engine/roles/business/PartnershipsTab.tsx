'use client';

// ─── Business Partnership Portfolio Tab (signature feature) ───
//
// Shows partner teams, partner athletes, sponsorships, and active
// campaigns — all parsed from textareas.

import {
  Briefcase, Users, Trophy, Calendar, TrendingUp, ExternalLink,
} from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, EmptyState, Badge, rpString } from '../../shared/ui';

interface Partner { name: string; since: string; value: string; }
interface Sponsorship { event: string; year: string; value: string; }
interface Campaign { name: string; status: string; reach: string; }

function parseList<T>(raw: string, mapper: (p: string[]) => T, filter: (item: T) => boolean): T[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => mapper(line.split('|').map(s => s.trim())))
    .filter(item => filter(item));
}

export function BusinessPartnershipsTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'business');

  const teams = parseList<Partner>(
    rpString(rp, 'partnerTeams'),
    p => ({ name: p[0] || '', since: p[1] || '', value: p[2] || '' }),
    t => Boolean(t.name),
  );
  const athletes = parseList<Partner>(
    rpString(rp, 'partnerAthletes'),
    p => ({ name: p[0] || '', since: p[1] || '', value: p[2] || '' }),
    a => Boolean(a.name),
  );
  const sponsorships = parseList<Sponsorship>(
    rpString(rp, 'sponsorships'),
    p => ({ event: p[0] || '', year: p[1] || '', value: p[2] || '' }),
    s => Boolean(s.event),
  );
  const campaigns = parseList<Campaign>(
    rpString(rp, 'campaigns'),
    p => ({ name: p[0] || '', status: p[1] || '', reach: p[2] || '' }),
    c => Boolean(c.name),
  );

  const hasAny = teams.length || athletes.length || sponsorships.length || campaigns.length;

  if (!hasAny) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No partnerships published yet"
        message="Add partner teams, athletes, sponsorships, and campaigns from Edit Profile → Partnerships."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Partner teams */}
      {teams.length > 0 && (
        <Card hover>
          <SectionTitle icon={Trophy} action={<Badge color="muted">{teams.length}</Badge>}>
            Partner Teams
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {teams.map((t, i) => (
              <div key={i} className="rounded-lg bg-surface border border-surface-border/50 p-2.5">
                <p className="text-xs font-bold text-white truncate">{t.name}</p>
                <div className="flex items-center justify-between mt-0.5">
                  {t.since && <span className="text-[10px] text-muted-foreground">Since {t.since}</span>}
                  {t.value && <span className="text-[11px] text-gold font-bold">{t.value}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Partner athletes */}
      {athletes.length > 0 && (
        <Card hover>
          <SectionTitle icon={Users} action={<Badge color="muted">{athletes.length}</Badge>}>
            Partner Athletes
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {athletes.map((a, i) => (
              <div key={i} className="rounded-lg bg-surface border border-surface-border/50 p-2.5">
                <p className="text-xs font-bold text-white truncate">{a.name}</p>
                <div className="flex items-center justify-between mt-0.5">
                  {a.since && <span className="text-[10px] text-muted-foreground">Since {a.since}</span>}
                  {a.value && <span className="text-[11px] text-gold font-bold">{a.value}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sponsorships */}
      {sponsorships.length > 0 && (
        <Card hover>
          <SectionTitle icon={Calendar} action={<Badge color="muted">{sponsorships.length}</Badge>}>
            Sponsorships
          </SectionTitle>
          <div className="flex flex-col">
            {sponsorships.map((s, i) => (
              <div key={i} className="py-2 border-b border-surface-border/40 last:border-b-0 flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-white truncate">{s.event}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.year && <span className="text-[10px] text-muted-foreground">{s.year}</span>}
                  {s.value && <span className="text-[11px] text-gold font-bold">{s.value}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active campaigns */}
      {campaigns.length > 0 && (
        <Card hover>
          <SectionTitle icon={TrendingUp} action={<Badge color="muted">{campaigns.length}</Badge>}>
            Active Campaigns
          </SectionTitle>
          <div className="flex flex-col">
            {campaigns.map((c, i) => {
              const isActive = c.status.toLowerCase().includes('active');
              return (
                <div key={i} className="py-2 border-b border-surface-border/40 last:border-b-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-white truncate">{c.name}</p>
                    <Badge color={isActive ? 'green' : 'muted'}>{c.status}</Badge>
                  </div>
                  {c.reach && <p className="text-[10px] text-muted-foreground mt-0.5">Reach: {c.reach}</p>}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
