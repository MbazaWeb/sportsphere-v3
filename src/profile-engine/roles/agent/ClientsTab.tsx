'use client';

// ─── Agent Client Roster Tab (signature feature) ─────────────
//
// Parses the `clientRoster` textarea into a list of clients with
// role, club, status, contract value, and contract end date.
//
// Format: Name | Role | Club | Status | Contract Value | Contract Until
//
// Status drives the badge color:
//   Active       → green
//   Negotiating  → gold
//   Free Agent   → blue
//   Loaned       → muted
//   Retired      → red
//
// Note: Sensitive data controls (hiding specific clients / values)
// are a Phase 4 feature — for now, the roster is visible to anyone
// who can view the agent's profile.

import { Handshake, Users, User, UserCheck, DollarSign, ArrowRightLeft, Briefcase, TrendingUp, Calendar } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, EmptyState, Badge, StatGrid, StatTile, KeyValueRow, ProgressBar, rpString, rpNumber } from '../../shared/ui';

interface Client {
  name: string;
  role: string;          // Player / Coach / Staff
  club: string;
  status: 'Active' | 'Negotiating' | 'Free Agent' | 'Loaned' | 'Retired' | string;
  value: string;         // e.g. "€2.5M"
  contractUntil: string; // e.g. "2027"
}

const STATUS_BADGE: Record<string, 'green' | 'gold' | 'blue' | 'muted' | 'red'> = {
  active:        'green',
  negotiating:   'gold',
  'free agent':  'blue',
  'free':        'blue',
  loaned:        'muted',
  retired:       'red',
};

export function parseClients(raw: string): Client[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const p = line.split('|').map(s => s.trim());
      const rawStatus = (p[3] || 'Active').toLowerCase();
      const status: Client['status'] =
        Object.keys(STATUS_BADGE).find(s => rawStatus.includes(s))?.toLowerCase().includes('free') ? 'Free Agent' :
        rawStatus.includes('negot') ? 'Negotiating' :
        rawStatus.includes('loan') ? 'Loaned' :
        rawStatus.includes('retired') || rawStatus.includes('retir') ? 'Retired' :
        rawStatus.includes('active') ? 'Active' : 'Active';
      return {
        name: p[0] || 'Unknown client',
        role: p[1] || 'Player',
        club: p[2] || '',
        status,
        value: p[4] || '',
        contractUntil: p[5] || '',
      };
    })
    .filter(c => c.name !== 'Unknown client' || c.club);
}

function ClientCard({ client }: { client: Client }) {
  const statusKey = client.status.toLowerCase();
  const badgeColor = STATUS_BADGE[statusKey] || 'muted';
  const roleIcon = client.role.toLowerCase().includes('coach') ? <UserCheck className="h-3 w-3" /> : <User className="h-3 w-3" />;
  return (
    <div className="rounded-lg bg-surface border border-surface-border/60 p-2.5 hover:border-gold/40 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {roleIcon}
          <p className="text-xs font-bold text-white truncate">{client.name}</p>
        </div>
        <Badge color={badgeColor}>{client.status}</Badge>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="truncate">{client.club || 'No club'}</span>
        {client.role && <span className="text-muted-foreground flex-shrink-0">{client.role}</span>}
      </div>
      {(client.value || client.contractUntil) && (
        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-surface-border/40">
          {client.value && (
            <span className="text-[11px] text-gold font-bold">{client.value}</span>
          )}
          {client.contractUntil && (
            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />Until {client.contractUntil}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function AgentClientsTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const clients = parseClients(rpString(rp, 'clientRoster'));

  // Aggregate metrics (use declared values if roster is empty, otherwise compute)
  const declaredPlayers = rpNumber(rp, 'playersRepresented');
  const declaredCoaches = rpNumber(rp, 'coachesRepresented');
  const playerCount = clients.length > 0
    ? clients.filter(c => c.role.toLowerCase().includes('player') || !c.role.toLowerCase().includes('coach')).length
    : declaredPlayers;
  const coachCount = clients.length > 0
    ? clients.filter(c => c.role.toLowerCase().includes('coach')).length
    : declaredCoaches;
  const totalClients = clients.length || (playerCount + coachCount);

  const transfersCompleted = rpNumber(rp, 'transfersCompleted');
  const activeNegotiations = rpNumber(rp, 'activeNegotiations');
  const contractsManaged = rpNumber(rp, 'contractsManaged');
  const totalTransferValue = rpString(rp, 'totalTransferValue');

  if (clients.length === 0 && !totalClients && !transfersCompleted) {
    return (
      <EmptyState
        icon={Handshake}
        title="No clients yet"
        message="Add your clients from Edit Profile → Client Roster. Format: Name | Role | Club | Status | Contract Value | Contract Until"
      />
    );
  }

  // Sort: Negotiating first (actionable), then Active, then others
  const statusOrder: Record<string, number> = { negotiating: 0, active: 1, 'free agent': 2, loaned: 3, retired: 4 };
  const sorted = [...clients].sort((a, b) => {
    const sa = statusOrder[a.status.toLowerCase()] ?? 5;
    const sb = statusOrder[b.status.toLowerCase()] ?? 5;
    return sa - sb;
  });

  // Status counts for the breakdown bar
  const statusCounts: Record<string, number> = {};
  clients.forEach(c => {
    const k = c.status.toLowerCase();
    statusCounts[k] = (statusCounts[k] || 0) + 1;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Business metrics */}
      <Card hover>
        <SectionTitle icon={Briefcase}>Business</SectionTitle>
        <StatGrid cols={4}>
          <StatTile icon={Users}           label="Clients"     value={totalClients} accent="gold" />
          <StatTile icon={ArrowRightLeft}  label="Transfers"   value={transfersCompleted} />
          <StatTile icon={TrendingUp}      label="Negotiating" value={activeNegotiations || clients.filter(c => c.status === 'Negotiating').length} accent="gold" />
          <StatTile icon={DollarSign}      label="Contracts"   value={contractsManaged} />
        </StatGrid>
        {totalTransferValue && (
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />Total Transfer Value
            </span>
            <span className="text-base font-black text-gold">{totalTransferValue}</span>
          </div>
        )}
      </Card>

      {/* Status breakdown bar */}
      {clients.length > 0 && (
        <Card>
          <SectionTitle icon={Users}>Roster Status</SectionTitle>
          <div className="flex h-2 rounded-full overflow-hidden bg-surface">
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = (count / clients.length) * 100;
              const color =
                status.includes('active') ? 'bg-emerald-500' :
                status.includes('negot') ? 'bg-gold' :
                status.includes('free') ? 'bg-blue-500' :
                status.includes('loan') ? 'bg-surface-border' :
                status.includes('retired') ? 'bg-red-500' : 'bg-surface-border';
              return (
                <div
                  key={status}
                  className={color}
                  style={{ width: `${pct}%` }}
                  title={`${status}: ${count}`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {Object.entries(statusCounts).map(([status, count]) => {
              const statusKey = status.toLowerCase();
              const badgeColor = STATUS_BADGE[statusKey] || 'muted';
              return (
                <Badge key={status} color={badgeColor}>
                  {count} {status}
                </Badge>
              );
            })}
          </div>
        </Card>
      )}

      {/* Client grid */}
      {clients.length > 0 && (
        <Card hover>
          <SectionTitle icon={Handshake} action={<Badge color="muted">{clients.length} clients</Badge>}>
            Client Roster
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sorted.map((c, i) => <ClientCard key={i} client={c} />)}
          </div>
        </Card>
      )}
    </div>
  );
}
