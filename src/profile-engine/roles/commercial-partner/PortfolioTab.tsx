'use client';

// ─── Commercial Partner Sponsorship Portfolio Tab (signature) ─
//
// Shows sponsored teams, players, competitions, events, and active
// campaigns — all parsed from textareas.

import {
  Handshake, Trophy, Users, Medal, Calendar, TrendingUp, ExternalLink,
} from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, EmptyState, Badge, StatGrid, StatTile, rpString } from '../../shared/ui';

interface Sponsorship { name: string; sinceOrYear: string; value: string; status: string; }
interface Campaign { name: string; reach: string; status: string; }

const STATUS_BADGE: Record<string, 'green' | 'gold' | 'red' | 'muted'> = {
  active:   'green',
  pending:  'gold',
  ended:    'muted',
  expired:  'muted',
  cancelled:'red',
};

function parseSponsorships(raw: string): Sponsorship[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const p = line.split('|').map(s => s.trim());
      return { name: p[0] || '', sinceOrYear: p[1] || '', value: p[2] || '', status: p[3] || 'Active' };
    })
    .filter(s => s.name);
}

function parseCampaigns(raw: string): Campaign[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const p = line.split('|').map(s => s.trim());
      return { name: p[0] || '', reach: p[1] || '', status: p[2] || 'Active' };
    })
    .filter(c => c.name);
}

function SponsorshipRow({ s, icon }: { s: Sponsorship; icon: typeof Trophy }) {
  const Icon = icon;
  const statusKey = s.status.toLowerCase();
  const badgeColor = STATUS_BADGE[statusKey] || 'muted';
  return (
    <div className="py-2 border-b border-surface-border/40 last:border-b-0 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <Icon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        <p className="text-xs font-bold text-white truncate">{s.name}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {s.sinceOrYear && <span className="text-[10px] text-muted-foreground">{s.sinceOrYear}</span>}
        {s.value && <span className="text-[11px] text-gold font-bold">{s.value}</span>}
        <Badge color={badgeColor}>{s.status}</Badge>
      </div>
    </div>
  );
}

export function CommercialPartnerPortfolioTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const teams = parseSponsorships(rpString(rp, 'sponsoredTeams'));
  const players = parseSponsorships(rpString(rp, 'sponsoredPlayers'));
  const competitions = parseSponsorships(rpString(rp, 'sponsoredCompetitions'));
  const events = parseSponsorships(rpString(rp, 'sponsoredEvents'));
  const campaigns = parseCampaigns(rpString(rp, 'activeCampaigns'));

  const totalSponsorships = teams.length + players.length + competitions.length + events.length;

  if (totalSponsorships === 0 && campaigns.length === 0) {
    return (
      <EmptyState
        icon={Handshake}
        title="No sponsorship portfolio yet"
        message="Add sponsored teams, players, competitions, and events from Edit Profile → Portfolio."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Aggregate stats */}
      {totalSponsorships > 0 && (
        <Card hover>
          <SectionTitle icon={Handshake}>Portfolio Overview</SectionTitle>
          <StatGrid cols={4}>
            <StatTile icon={Trophy} label="Teams"        value={teams.length} accent="gold" />
            <StatTile icon={Users}  label="Players"      value={players.length} />
            <StatTile icon={Medal}  label="Competitions" value={competitions.length} />
            <StatTile icon={Calendar} label="Events"     value={events.length} />
          </StatGrid>
        </Card>
      )}

      {/* Sponsored teams */}
      {teams.length > 0 && (
        <Card hover>
          <SectionTitle icon={Trophy} action={<Badge color="muted">{teams.length}</Badge>}>
            Sponsored Teams
          </SectionTitle>
          <div className="flex flex-col">
            {teams.map((s, i) => <SponsorshipRow key={i} s={s} icon={Trophy} />)}
          </div>
        </Card>
      )}

      {/* Sponsored players */}
      {players.length > 0 && (
        <Card hover>
          <SectionTitle icon={Users} action={<Badge color="muted">{players.length}</Badge>}>
            Sponsored Players
          </SectionTitle>
          <div className="flex flex-col">
            {players.map((s, i) => <SponsorshipRow key={i} s={s} icon={Users} />)}
          </div>
        </Card>
      )}

      {/* Sponsored competitions */}
      {competitions.length > 0 && (
        <Card hover>
          <SectionTitle icon={Medal} action={<Badge color="muted">{competitions.length}</Badge>}>
            Sponsored Competitions
          </SectionTitle>
          <div className="flex flex-col">
            {competitions.map((s, i) => <SponsorshipRow key={i} s={s} icon={Medal} />)}
          </div>
        </Card>
      )}

      {/* Sponsored events */}
      {events.length > 0 && (
        <Card hover>
          <SectionTitle icon={Calendar} action={<Badge color="muted">{events.length}</Badge>}>
            Sponsored Events
          </SectionTitle>
          <div className="flex flex-col">
            {events.map((s, i) => <SponsorshipRow key={i} s={s} icon={Calendar} />)}
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
              const statusKey = c.status.toLowerCase();
              const badgeColor = STATUS_BADGE[statusKey] || 'muted';
              return (
                <div key={i} className="py-2 border-b border-surface-border/40 last:border-b-0 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-white truncate">{c.name}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c.reach && <span className="text-[10px] text-muted-foreground">Reach: {c.reach}</span>}
                    <Badge color={badgeColor}>{c.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
