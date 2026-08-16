// ─── Commercial-Partner Role Config ───────────────────────────
//
// Commercial Partner = sponsors, broadcasters, streaming platforms,
// ticketing providers, data providers, event organizers.
//
// Signature feature is the **Sponsorship Portfolio** — sponsored
// teams, players, competitions, and events in one place.
//
// sponsoredTeams:        textarea "Team | Since | Value | Status"
// sponsoredPlayers:      textarea "Player | Since | Value | Status"
// sponsoredCompetitions: textarea "Competition | Since | Value | Status"
// sponsoredEvents:       textarea "Event | Year | Value | Status"
// activeCampaigns:       textarea "Campaign | Reach | Status"

import { Handshake } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const COMMERCIAL_PARTNER_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'feeds',     label: 'Feeds'     },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'about',     label: 'About'     },
];

export const COMMERCIAL_PARTNER_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'partnerType',     label: 'Partner Type',     type: 'select', section: 'identity', group: 'Identity', required: true,
    options: ['Sponsor', 'Title Sponsor', 'Broadcaster', 'Streaming Platform', 'Ticketing Provider', 'Travel Partner', 'Data Provider', 'Event Organizer'] },
  { key: 'brand',           label: 'Brand',            type: 'text', section: 'identity', group: 'Identity', required: true },
  { key: 'sportsCategory',  label: 'Sports Category',  type: 'text', section: 'identity', group: 'Identity' },
  { key: 'partnershipStatus', label: 'Partnership Status', type: 'select', section: 'identity', group: 'Identity',
    options: ['Active', 'Ended', 'Pending'] },
  { key: 'foundedYear',     label: 'Brand Founded',    type: 'text', section: 'identity', group: 'Identity' },
  { key: 'headquarters',    label: 'Headquarters',     type: 'text', section: 'identity', group: 'Identity' },
  { key: 'website',         label: 'Website',          type: 'url', section: 'identity', group: 'Identity' },

  // ── Sponsorship portfolio (signature) ──
  { key: 'sponsoredTeams',    label: 'Sponsored Teams',     type: 'textarea', section: 'performance', group: 'Portfolio',
    hint: 'One per line: Team | Since | Value | Status' },
  { key: 'sponsoredPlayers',  label: 'Sponsored Players',   type: 'textarea', section: 'performance', group: 'Portfolio',
    hint: 'One per line: Player | Since | Value | Status' },
  { key: 'sponsoredCompetitions', label: 'Sponsored Competitions', type: 'textarea', section: 'performance', group: 'Portfolio',
    hint: 'One per line: Competition | Since | Value | Status' },
  { key: 'sponsoredEvents',   label: 'Sponsored Events',    type: 'textarea', section: 'performance', group: 'Portfolio',
    hint: 'One per line: Event | Year | Value | Status' },

  // ── Marketing ──
  { key: 'activeCampaigns',   label: 'Active Campaigns',    type: 'textarea', section: 'performance', group: 'Marketing',
    hint: 'One per line: Campaign | Reach | Status' },
];

export const commercialPartnerConfig: RoleConfig = {
  role: 'commercial-partner',
  label: 'Commercial Partner',
  icon: Handshake,
  accent: '#A855F7',
  tagline: 'Sponsors, broadcasters, and commercial partners.',
  tabs: COMMERCIAL_PARTNER_TABS,
  fields: COMMERCIAL_PARTNER_FIELDS,
};
