'use client';

// ─── Organization Governance Hub Tab (signature feature) ──────
//
// Parses 5 textareas into structured cards:
//   - Leadership (Name | Role | Since)
//   - Departments (Name | Head | Description)
//   - Affiliates (Name | Type | Country)
//   - Competitions Organized (Name | Type | Frequency)
//   - Development Programs (Name | Focus | Reach)

import {
  Building2, Users, Network, Trophy, GraduationCap, Crown,
  MapPin, Calendar, Briefcase,
} from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, EmptyState, Badge, rpString } from '../../shared/ui';

interface Leader { name: string; role: string; since: string; }
interface Department { name: string; head: string; desc: string; }
interface Affiliate { name: string; type: string; country: string; }
interface Competition { name: string; type: string; frequency: string; }
interface Program { name: string; focus: string; reach: string; }

function parseList<T>(raw: string, mapper: (parts: string[]) => T, filter: (item: T) => boolean): T[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => mapper(line.split('|').map(s => s.trim())))
    .filter(item => filter(item));
}

export function OrganizationGovernanceTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'organization');

  const leaders = parseList<Leader>(
    rpString(rp, 'leadership'),
    p => ({ name: p[0] || '', role: p[1] || '', since: p[2] || '' }),
    l => Boolean(l.name),
  );
  const departments = parseList<Department>(
    rpString(rp, 'departments'),
    p => ({ name: p[0] || '', head: p[1] || '', desc: p[2] || '' }),
    d => Boolean(d.name),
  );
  const affiliates = parseList<Affiliate>(
    rpString(rp, 'affiliates'),
    p => ({ name: p[0] || '', type: p[1] || '', country: p[2] || '' }),
    a => Boolean(a.name),
  );
  const competitions = parseList<Competition>(
    rpString(rp, 'competitions'),
    p => ({ name: p[0] || '', type: p[1] || '', frequency: p[2] || '' }),
    c => Boolean(c.name),
  );
  const programs = parseList<Program>(
    rpString(rp, 'programs'),
    p => ({ name: p[0] || '', focus: p[1] || '', reach: p[2] || '' }),
    p => Boolean(p.name),
  );

  const hasAny = leaders.length || departments.length || affiliates.length || competitions.length || programs.length;

  if (!hasAny) {
    return (
      <EmptyState
        icon={Building2}
        title="No governance info yet"
        message="Add leadership, departments, affiliates, competitions, and programs from Edit Profile to populate your governance hub."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Leadership */}
      {leaders.length > 0 && (
        <Card hover>
          <SectionTitle icon={Crown} action={<Badge color="muted">{leaders.length}</Badge>}>
            Leadership
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {leaders.map((l, i) => (
              <div key={i} className="rounded-lg bg-surface border border-surface-border/50 p-2.5">
                <p className="text-xs font-bold text-white truncate">{l.name}</p>
                <p className="text-[11px] text-gold truncate">{l.role}</p>
                {l.since && (
                  <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" />Since {l.since}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Departments */}
      {departments.length > 0 && (
        <Card hover>
          <SectionTitle icon={Briefcase} action={<Badge color="muted">{departments.length}</Badge>}>
            Departments
          </SectionTitle>
          <div className="flex flex-col">
            {departments.map((d, i) => (
              <div key={i} className="py-2 border-b border-surface-border/40 last:border-b-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-xs font-bold text-white truncate">{d.name}</p>
                  {d.head && <span className="text-[10px] text-gold truncate">{d.head}</span>}
                </div>
                {d.desc && <p className="text-[11px] text-muted-foreground leading-tight">{d.desc}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Affiliates */}
      {affiliates.length > 0 && (
        <Card hover>
          <SectionTitle icon={Network} action={<Badge color="muted">{affiliates.length}</Badge>}>
            Affiliates
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {affiliates.map((a, i) => (
              <div key={i} className="rounded-lg bg-surface border border-surface-border/50 p-2.5">
                <p className="text-xs font-bold text-white truncate">{a.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {a.type && <Badge color="blue">{a.type}</Badge>}
                  {a.country && (
                    <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{a.country}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Competitions organized */}
      {competitions.length > 0 && (
        <Card hover>
          <SectionTitle icon={Trophy} action={<Badge color="muted">{competitions.length}</Badge>}>
            Competitions Organized
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {competitions.map((c, i) => (
              <div key={i} className="rounded-lg bg-surface border border-surface-border/50 p-2.5">
                <p className="text-xs font-bold text-white truncate">{c.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {c.type && <Badge color="gold">{c.type}</Badge>}
                  {c.frequency && <span className="text-[10px] text-muted-foreground">{c.frequency}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Development programs */}
      {programs.length > 0 && (
        <Card hover>
          <SectionTitle icon={GraduationCap} action={<Badge color="muted">{programs.length}</Badge>}>
            Development Programs
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {programs.map((p, i) => (
              <div key={i} className="rounded-lg bg-surface border border-surface-border/50 p-2.5">
                <p className="text-xs font-bold text-white truncate">{p.name}</p>
                {p.focus && <p className="text-[11px] text-gold truncate">{p.focus}</p>}
                {p.reach && <p className="text-[10px] text-muted-foreground mt-0.5">{p.reach}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
