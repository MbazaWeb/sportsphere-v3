// ─── Venue Role Config ────────────────────────────────────────
//
// Venue = stadiums, arenas, training grounds, sports complexes.
// Signature feature is the **Events Calendar** — upcoming + past
// events at the venue.
//
// upcomingEvents: textarea "Date | Event | Type | Capacity Sold | Status"
// tenants:         textarea "Team | Since | Sport"

import { Building2 } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const VENUE_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview',   label: 'Overview'   },
  { id: 'feeds',      label: 'Feeds'      },
  { id: 'facilities', label: 'Facilities' },
  { id: 'about',      label: 'About'      },
];

export const VENUE_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'venueName',       label: 'Venue Name',       type: 'text', section: 'identity', group: 'Identity', required: true },
  { key: 'venueType',       label: 'Venue Type',       type: 'select', section: 'identity', group: 'Identity',
    options: ['Stadium', 'Arena', 'Training Ground', 'Sports Complex'] },
  { key: 'location',        label: 'Location',         type: 'text', section: 'identity', group: 'Identity' },
  { key: 'capacity',        label: 'Capacity',         type: 'number', section: 'identity', group: 'Identity' },
  { key: 'surface',         label: 'Surface',          type: 'text', section: 'identity', group: 'Identity', placeholder: 'Natural grass / Artificial' },
  { key: 'opened',          label: 'Year Opened',      type: 'text', section: 'identity', group: 'Identity' },
  { key: 'owner',           label: 'Owner',            type: 'text', section: 'identity', group: 'Identity' },
  { key: 'operator',        label: 'Operator',         type: 'text', section: 'identity', group: 'Identity' },

  // ── Facilities ──
  { key: 'facilities',      label: 'Facilities',       type: 'chips', section: 'performance', group: 'Facilities', hint: 'VIP, Media, Parking, Accessibility...' },

  // ── Tenants ──
  { key: 'tenants',         label: 'Tenant Teams',     type: 'textarea', section: 'performance', group: 'Tenants',
    hint: 'One per line: Team | Since | Sport' },

  // ── Events calendar (signature) ──
  { key: 'upcomingEvents',  label: 'Upcoming Events',  type: 'textarea', section: 'performance', group: 'Calendar',
    hint: 'One per line: Date | Event | Type | Capacity Sold | Status (Scheduled/Live/Finished)' },
];

export const venueConfig: RoleConfig = {
  role: 'venue',
  label: 'Venue',
  icon: Building2,
  accent: '#34D399',
  tagline: 'Sports venues, stadiums, training facilities.',
  tabs: VENUE_TABS,
  fields: VENUE_FIELDS,
};
