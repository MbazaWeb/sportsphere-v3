'use client';

// ─── Team Squad Tab ────────────────────────────────────────────
//
// Parses roleProfile.squad (textarea: "Name | Position | Number | Nat")
// and renders players grouped by position group (GK / DEF / MID / FWD).

import { Users, Goal, Shield, Zap, Footprints } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, EmptyState, Badge, rpString } from '../../shared/ui';

interface Player {
  name: string;
  position: string;
  number: string;
  nationality: string;
}

function parseSquad(raw: string): Player[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        name: parts[0] || '',
        position: parts[1] || '',
        number: parts[2] || '',
        nationality: parts[3] || '',
      };
    })
    .filter(p => p.name);
}

function positionGroup(position: string): 'GK' | 'DEF' | 'MID' | 'FWD' | 'OTHER' {
  const p = position.toUpperCase();
  if (p === 'GK') return 'GK';
  if (['RB', 'CB', 'LB', 'RWB', 'LWB'].includes(p)) return 'DEF';
  if (['CDM', 'CM', 'CAM'].includes(p)) return 'MID';
  if (['RW', 'LW', 'ST', 'CF'].includes(p)) return 'FWD';
  return 'OTHER';
}

const GROUP_META: Record<string, { label: string; icon: typeof Users; color: 'gold' | 'green' | 'blue' | 'red' | 'muted' }> = {
  GK:   { label: 'Goalkeepers', icon: Goal,      color: 'gold' },
  DEF:  { label: 'Defenders',   icon: Shield,    color: 'blue' },
  MID:  { label: 'Midfielders', icon: Zap,       color: 'green' },
  FWD:  { label: 'Forwards',    icon: Footprints,color: 'red' },
  OTHER:{ label: 'Others',      icon: Users,     color: 'muted' },
};

export function TeamSquadTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'team');
  const squad = parseSquad(rpString(rp, 'squad'));

  // Group by position
  const grouped = new Map<string, Player[]>();
  for (const p of squad) {
    const g = positionGroup(p.position);
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g)!.push(p);
  }

  const groupOrder = ['GK', 'DEF', 'MID', 'FWD', 'OTHER'];

  if (squad.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No squad list yet"
        message="Add players from Edit Profile → Squad. Format: Name | Position | Number | Nationality"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Squad summary */}
      <Card hover>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gold" />
            <p className="text-base font-bold text-white">Squad</p>
          </div>
          <p className="text-sm font-bold text-gold">{squad.length} players</p>
        </div>
        <div className="mt-2 flex gap-1.5 flex-wrap">
          {groupOrder.filter(g => grouped.has(g)).map(g => (
            <Badge key={g} color={GROUP_META[g].color}>
              {grouped.get(g)!.length} {GROUP_META[g].label}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Grouped squad list */}
      {groupOrder.filter(g => grouped.has(g)).map(g => {
        const meta = GROUP_META[g];
        const players = grouped.get(g)!;
        const Icon = meta.icon;
        return (
          <Card key={g} hover>
            <SectionTitle icon={Icon}>{meta.label} ({players.length})</SectionTitle>
            <div className="flex flex-col gap-1.5">
              {players.map((p, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-surface p-2 border border-surface-border/40">
                  {p.number && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 border border-gold/30 flex-shrink-0">
                      <span className="text-xs font-bold text-gold">{p.number}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.position}{p.nationality && ` · ${p.nationality}`}
                    </p>
                  </div>
                  {p.position && <Badge color="muted">{p.position}</Badge>}
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
