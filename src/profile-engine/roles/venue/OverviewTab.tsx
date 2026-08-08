'use client';

// ─── Venue Overview Tab ───────────────────────────────────────
//
// Hero summary: venue card (name, type, location, capacity), events
// calendar preview (next 3 events).

import { Building2, MapPin, Calendar, Users, Clock, Ticket, Home } from 'lucide-react';
import type { ApiUserLike } from '../../types';
import { Card, SectionTitle, StatGrid, StatTile, KeyValueRow, Badge, rpString, rpNumber, rpArray } from '../../shared/ui';

interface VenueEvent { date: string; event: string; type: string; sold: string; status: string; }

function parseEvents(raw: string): VenueEvent[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const p = line.split('|').map(s => s.trim());
      return { date: p[0] || '', event: p[1] || '', type: p[2] || '', sold: p[3] || '', status: p[4] || 'Scheduled' };
    })
    .filter(e => e.event);
}

export function VenueOverviewTab({ apiUser }: { apiUser: ApiUserLike | null }) {
  const rp = (apiUser?.roleProfile || {}) as Record<string, unknown>;
  const name = rpString(rp, 'venueName');
  const venueType = rpString(rp, 'venueType');
  const location = rpString(rp, 'location');
  const capacity = rpNumber(rp, 'capacity');
  const surface = rpString(rp, 'surface');
  const opened = rpString(rp, 'opened');
  const owner = rpString(rp, 'owner');
  const operator = rpString(rp, 'operator');
  const facilities = rpArray(rp, 'facilities').map(String);

  const events = parseEvents(rpString(rp, 'upcomingEvents'));

  return (
    <div className="flex flex-col gap-3">
      {/* Identity */}
      <Card hover>
        <SectionTitle icon={Building2}>Venue</SectionTitle>
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex-shrink-0">
            <Building2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{name || 'Venue name not set'}</p>
            {venueType && <p className="text-xs text-emerald-400 truncate">{venueType}</p>}
            {location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{location}
              </p>
            )}
          </div>
          {opened && <Badge color="green">Opened {opened}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0">
          {capacity > 0 && <KeyValueRow label="Capacity" value={capacity.toLocaleString()} />}
          {surface &&     <KeyValueRow label="Surface"  value={surface} />}
          {owner &&       <KeyValueRow label="Owner"    value={owner} />}
          {operator &&    <KeyValueRow label="Operator" value={operator} />}
        </div>
        {facilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {facilities.slice(0, 6).map((f, i) => <Badge key={i} color="muted">{f}</Badge>)}
            {facilities.length > 6 && <Badge color="muted">+{facilities.length - 6}</Badge>}
          </div>
        )}
      </Card>

      {/* Events preview */}
      {events.length > 0 && (
        <Card hover>
          <SectionTitle icon={Calendar} action={<Badge color="muted">{events.length} events</Badge>}>
            Upcoming Events
          </SectionTitle>
          <div className="flex flex-col">
            {events.slice(0, 3).map((e, i) => (
              <div key={i} className="py-2 border-b border-surface-border/40 last:border-b-0">
                <p className="text-xs font-bold text-white truncate">{e.event}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                  {e.date && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{e.date}</span>}
                  {e.type && <Badge color="muted">{e.type}</Badge>}
                  {e.status === 'Live' && <Badge color="red">LIVE</Badge>}
                </div>
              </div>
            ))}
            {events.length > 3 && <p className="text-[10px] text-gold mt-1.5">+{events.length - 3} more in Facilities tab</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
