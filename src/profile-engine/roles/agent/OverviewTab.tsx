'use client';

// ─── Agent Overview Tab ───────────────────────────────────────
//
// Hero summary: agent card (type, agency, license, federation),
// business metrics (clients, transfers, value), roster status preview.

import { Handshake, Building2, BadgeCheck, Globe2, Users, ArrowRightLeft, DollarSign, TrendingUp, ShieldCheck } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import {getRoleProfile, Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString, rpNumber, rpArray } from '../../shared/ui';
import { parseClients } from './ClientsTab';

export function AgentOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = getRoleProfile(apiUser, 'agent');
  const agentType = rpString(rp, 'agentType');
  const agency = rpString(rp, 'agency');
  const license = rpString(rp, 'license');
  const federation = rpString(rp, 'federation');
  const countries = rpArray(rp, 'countries').map(String);

  const declaredPlayers = rpNumber(rp, 'playersRepresented');
  const declaredCoaches = rpNumber(rp, 'coachesRepresented');
  const transfersCompleted = rpNumber(rp, 'transfersCompleted');
  const activeNegotiations = rpNumber(rp, 'activeNegotiations');
  const contractsManaged = rpNumber(rp, 'contractsManaged');
  const totalTransferValue = rpString(rp, 'totalTransferValue');

  const clients = parseClients(rpString(rp, 'clientRoster'));
  const totalClients = clients.length || (declaredPlayers + declaredCoaches);

  return (
    <div className="flex flex-col gap-3">
      {/* Identity */}
      <Card hover>
        <SectionTitle icon={Handshake}>Agent Card</SectionTitle>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 border border-gold/30 flex-shrink-0">
            <Handshake className="h-5 w-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{agentType || 'Agent type not set'}</p>
            {agency && <p className="text-xs text-gold truncate">{agency}</p>}
            {federation && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <ShieldCheck className="h-3 w-3" />{federation}
              </p>
            )}
          </div>
          {license && <Badge color="green"><BadgeCheck className="h-3 w-3" />Licensed</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {license && <KeyValueRow label="License #" value={license} />}
          {countries.length > 0 && <KeyValueRow label="Operating In" value={countries.join(', ')} />}
        </div>
      </Card>

      {/* Business metrics */}
      {(totalClients || transfersCompleted || totalTransferValue) ? (
        <Card hover>
          <SectionTitle icon={TrendingUp}>Business</SectionTitle>
          <StatGrid cols={4}>
            <StatTile icon={Users}           label="Clients"     value={totalClients} accent="gold" />
            <StatTile icon={ArrowRightLeft}  label="Transfers"   value={transfersCompleted} />
            <StatTile icon={TrendingUp}      label="Negotiating" value={activeNegotiations || clients.filter(c => c.status === 'Negotiating').length} accent="gold" />
            <StatTile icon={DollarSign}      label="Contracts"   value={contractsManaged} />
          </StatGrid>
          {totalTransferValue && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" />Total Transfer Value
              </span>
              <span className="text-base font-black text-gold">{totalTransferValue}</span>
            </div>
          )}
        </Card>
      ) : null}

      {/* Roster preview */}
      {clients.length > 0 && (
        <Card hover>
          <SectionTitle icon={Handshake} action={<Badge color="muted">{clients.length} total</Badge>}>
            Top Clients
          </SectionTitle>
          <div className="flex flex-col">
            {clients.slice(0, 4).map((c, i) => (
              <div key={i} className="py-2 border-b border-surface-border/40 last:border-b-0 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.club || 'No club'}</p>
                </div>
                {c.value && <span className="text-[10px] text-gold font-bold flex-shrink-0">{c.value}</span>}
              </div>
            ))}
            {clients.length > 4 && (
              <p className="text-[10px] text-gold mt-1.5">+{clients.length - 4} more in Clients tab</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
