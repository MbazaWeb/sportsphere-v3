'use client';

// ─── Venue Facilities Tab ─────────────────────────────────────
//
// Shows facilities as chips + tenants list parsed from textarea.
// Format: Team | Since | Sport

import { Building2, Calendar, Home } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, EmptyState, Badge, KeyValueRow, rpString, rpArray } from '../../shared/ui';

interface Tenant { team: string; since: string; sport: string; }

export function VenueFacilitiesTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const facilities = rpArray(rp, 'facilities').map(String);
  const surface = rpString(rp, 'surface');
  const owner = rpString(rp, 'owner');
  const operator = rpString(rp, 'operator');

  const rawTenants = rpString(rp, 'tenants');
  const tenants: Tenant[] = rawTenants
    ? rawTenants.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
        const p = line.split('|').map(s => s.trim());
        return { team: p[0] || '', since: p[1] || '', sport: p[2] || '' };
      }).filter(t => t.team)
    : [];

  if (facilities.length === 0 && tenants.length === 0 && !surface && !owner && !operator) {
    return (
      <EmptyState
        icon={Building2}
        title="No facilities info yet"
        message="Add facilities, surface, owner, operator, and tenants from Edit Profile."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Facilities chips */}
      {facilities.length > 0 && (
        <Card hover>
          <SectionTitle icon={Building2}>Facilities</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {facilities.map((f, i) => <Badge key={i} color="green">{f}</Badge>)}
          </div>
        </Card>
      )}

      {/* Operational info */}
      {(surface || owner || operator) && (
        <Card hover>
          <SectionTitle icon={Home}>Operational</SectionTitle>
          {surface &&  <KeyValueRow label="Surface"  value={surface} />}
          {owner &&    <KeyValueRow label="Owner"    value={owner} />}
          {operator && <KeyValueRow label="Operator" value={operator} />}
        </Card>
      )}

      {/* Tenants */}
      {tenants.length > 0 && (
        <Card hover>
          <SectionTitle icon={Calendar} action={<Badge color="muted">{tenants.length} tenants</Badge>}>
            Tenant Teams
          </SectionTitle>
          <div className="flex flex-col">
            {tenants.map((t, i) => (
              <div key={i} className="py-2 border-b border-surface-border/40 last:border-b-0 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{t.team}</p>
                  {t.sport && <p className="text-[10px] text-muted-foreground">{t.sport}</p>}
                </div>
                {t.since && <span className="text-[10px] text-gold flex-shrink-0">Since {t.since}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
