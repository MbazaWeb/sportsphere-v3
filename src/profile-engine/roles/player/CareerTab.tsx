'use client';

// ─── Player Career Tab ─────────────────────────────────────────
//
// Shows:
//   - Current club + contract status
//   - International career
//   - Transfer history timeline (parses roleProfile.transferHistory
//     which the user enters as one-per-line:
//     "2024 | Club A → Club B | €10M | Transfer")

import { Trophy, MapPin, Calendar, Flag, ArrowRight, Building2, GraduationCap } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, EmptyState, TimelineItem, KeyValueRow, Badge, rpString, rpNumber } from '../../shared/ui';

interface TransferEntry {
  year: string;
  from: string;
  to: string;
  fee: string;
  type: string;
}

function parseTransfers(raw: string): TransferEntry[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split('|').map(p => p.trim());
      // Try to parse "from → to" out of parts[1]
      let from = '', to = '';
      if (parts[1]) {
        const m = parts[1].split(/→|->/).map(s => s.trim());
        from = m[0] || '';
        to = m[1] || '';
      }
      return {
        year: parts[0] || '',
        from,
        to,
        fee: parts[2] || '',
        type: parts[3] || 'Transfer',
      };
    })
    .filter(t => t.year || t.from || t.to);
}

export function PlayerCareerTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const currentClub = rpString(rp, 'currentClub');
  const contractUntil = rpString(rp, 'contractUntil');
  const contractStatus = rpString(rp, 'contractStatus');
  const academy = rpString(rp, 'academy');
  const debutYear = rpString(rp, 'debutYear');
  const nationalTeam = rpString(rp, 'nationalTeam');
  const internationalCaps = rpNumber(rp, 'internationalCaps');
  const internationalGoals = rpNumber(rp, 'internationalGoals');
  const transfers = parseTransfers(rpString(rp, 'transferHistory'));

  const hasAny = currentClub || academy || debutYear || nationalTeam || transfers.length > 0;

  if (!hasAny) {
    return (
      <EmptyState
        icon={Trophy}
        title="No career history yet"
        message="Add your current club, debut, transfers, and international career from Edit Profile."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Current club */}
      {currentClub && (
        <Card hover>
          <SectionTitle icon={Building2}>Current Club</SectionTitle>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-base font-bold text-white">{currentClub}</p>
              {contractStatus && <Badge color={contractStatus === 'Free Agent' ? 'red' : contractStatus === 'Under Contract' ? 'green' : 'gold'}>{contractStatus}</Badge>}
            </div>
            {contractUntil && (
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase">Contract Until</p>
                <p className="text-sm font-bold text-gold">{contractUntil}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* International career */}
      {nationalTeam && (
        <Card hover>
          <SectionTitle icon={Flag}>International Career</SectionTitle>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-white">{nationalTeam}</p>
              <p className="text-xs text-muted-foreground">
                {internationalCaps} caps · {internationalGoals} goals
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Academy / debut */}
      {(academy || debutYear) && (
        <Card>
          <SectionTitle icon={GraduationCap}>Origins</SectionTitle>
          {academy && <KeyValueRow label="Youth Academy" value={academy} />}
          {debutYear && <KeyValueRow label="Senior Debut" value={debutYear} />}
        </Card>
      )}

      {/* Transfer history timeline */}
      {transfers.length > 0 && (
        <Card hover>
          <SectionTitle icon={Calendar}>Transfer History</SectionTitle>
          <div className="flex flex-col">
            {transfers.map((t, i) => (
              <div key={i} className="flex gap-3 py-2 border-b border-surface-border/40 last:border-b-0">
                <div className="flex-shrink-0 w-12 text-right">
                  <p className="text-[10px] text-gold font-bold uppercase">{t.year}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                    <span className="truncate">{t.from || '—'}</span>
                    <ArrowRight className="h-3 w-3 text-gold flex-shrink-0" />
                    <span className="truncate">{t.to || '—'}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {t.fee && <span className="text-xs text-muted-foreground">{t.fee}</span>}
                    {t.type && <Badge color={t.type.toLowerCase().includes('loan') ? 'blue' : 'muted'}>{t.type}</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
