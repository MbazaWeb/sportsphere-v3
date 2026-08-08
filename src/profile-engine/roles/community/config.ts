// ─── Community Role Config ────────────────────────────────────
//
// Community = fan clubs, supporter groups, discussion forums,
// community clubs.
//
// Signature feature is the **Community Hub** — member stats, events,
// and community rules all in one place.
//
// events: textarea "Date | Event | Type | Attendees"
// rules:  textarea (one rule per line)

import { Users as UsersIcon } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const COMMUNITY_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'feeds',    label: 'Feeds'    },
  { id: 'members',  label: 'Hub'      },
  { id: 'about',    label: 'About'    },
];

export const COMMUNITY_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'communityName',   label: 'Community Name',   type: 'text', section: 'identity', group: 'Identity', required: true },
  { key: 'communityType',   label: 'Community Type',   type: 'select', section: 'identity', group: 'Identity',
    options: ['Fan Club', 'Supporters Group', 'Discussion Forum', 'Community Club'] },
  { key: 'foundedYear',     label: 'Founded Year',     type: 'text', section: 'identity', group: 'Identity' },
  { key: 'location',        label: 'Location',         type: 'text', section: 'identity', group: 'Identity' },
  { key: 'supportedTeam',   label: 'Supported Team',   type: 'text', section: 'identity', group: 'Identity' },
  { key: 'description',     label: 'Description',      type: 'textarea', section: 'identity', group: 'Identity' },

  // ── Stats ──
  { key: 'memberCount',     label: 'Total Members',    type: 'number', section: 'performance', group: 'Stats' },
  { key: 'activeMembers',   label: 'Active Members',   type: 'number', section: 'performance', group: 'Stats' },
  { key: 'eventCount',      label: 'Events Held',      type: 'number', section: 'performance', group: 'Stats' },
  { key: 'postCount',       label: 'Posts',            type: 'number', section: 'performance', group: 'Stats' },

  // ── Community hub (signature) ──
  { key: 'events',          label: 'Community Events', type: 'textarea', section: 'performance', group: 'Hub',
    hint: 'One per line: Date | Event | Type | Attendees' },
  { key: 'rules',           label: 'Community Rules',  type: 'textarea', section: 'performance', group: 'Hub',
    hint: 'One rule per line' },
];

export const communityConfig: RoleConfig = {
  role: 'community',
  label: 'Community',
  icon: UsersIcon,
  accent: '#FF6B35',
  tagline: 'Fan communities, supporter groups, discussion forums.',
  tabs: COMMUNITY_TABS,
  fields: COMMUNITY_FIELDS,
};
