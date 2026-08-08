// ─── Team Role Config ─────────────────────────────────────────
//
// Team is the most important entity profile. Squad, performance,
// trophies, fixtures, shop, history.

import { Users } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const TEAM_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview',    label: 'Overview'    },
  { id: 'feeds',       label: 'Feeds'       },
  { id: 'squad',       label: 'Squad'       },
  { id: 'performance', label: 'Performance' },
  { id: 'trophies',    label: 'Trophies'    },
  { id: 'shop',        label: 'Shop'        },
  { id: 'about',       label: 'About'       },
];

export const TEAM_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'nickname',    label: 'Nickname',         type: 'text', section: 'identity', group: 'Identity' },
  { key: 'foundedYear', label: 'Founded Year',     type: 'text', section: 'identity', group: 'Identity', required: true, placeholder: '1936' },
  { key: 'country',     label: 'Country',          type: 'text', section: 'identity', group: 'Identity', required: true },
  { key: 'city',        label: 'City',             type: 'text', section: 'identity', group: 'Identity' },
  { key: 'stadium',     label: 'Stadium',          type: 'text', section: 'identity', group: 'Identity', required: true },
  { key: 'capacity',    label: 'Stadium Capacity', type: 'number', section: 'identity', group: 'Identity', placeholder: '60000' },
  { key: 'league',      label: 'Current League',   type: 'text', section: 'identity', group: 'Identity', required: true },
  { key: 'division',    label: 'Division',         type: 'text', section: 'identity', group: 'Identity', placeholder: '1st' },
  { key: 'coach',       label: 'Head Coach',       type: 'text', section: 'identity', group: 'Identity' },
  { key: 'owner',       label: 'Owner / President',type: 'text', section: 'identity', group: 'Identity' },
  { key: 'colors',      label: 'Club Colors',      type: 'text', section: 'identity', group: 'Identity', placeholder: 'Red & White' },

  // ── Performance (current season) ──
  { key: 'matchesPlayed', label: 'Matches Played', type: 'number', section: 'performance', group: 'Performance' },
  { key: 'wins',          label: 'Wins',           type: 'number', section: 'performance', group: 'Performance' },
  { key: 'draws',         label: 'Draws',          type: 'number', section: 'performance', group: 'Performance' },
  { key: 'losses',        label: 'Losses',         type: 'number', section: 'performance', group: 'Performance' },
  { key: 'goalsFor',      label: 'Goals For',      type: 'number', section: 'performance', group: 'Performance' },
  { key: 'goalsAgainst',  label: 'Goals Against',  type: 'number', section: 'performance', group: 'Performance' },
  { key: 'points',        label: 'Points',         type: 'number', section: 'performance', group: 'Performance' },
  { key: 'position',      label: 'League Position',type: 'text', section: 'performance', group: 'Performance', placeholder: '3rd' },
  { key: 'form',          label: 'Recent Form',    type: 'text', section: 'performance', group: 'Performance', hint: 'Last 5: WWDLW' },

  // ── Squad ── (textarea — one player per line: "Name | Position | Number | Nationality")
  { key: 'squad',         label: 'Squad',          type: 'textarea', section: 'career', group: 'Squad',
    hint: 'One player per line: Name | Position | Number | Nationality' },

  // ── History / Achievements ──
  { key: 'achievements',  label: 'Honours',        type: 'textarea', section: 'career', group: 'History',
    hint: 'One per line: Year | Trophy | Category (League/Cup/Continental/Other)' },
  { key: 'historicPlayers', label: 'Historic Players', type: 'textarea', section: 'career', group: 'History',
    hint: 'Notable former players, one per line' },
  { key: 'historicCoaches', label: 'Historic Coaches', type: 'textarea', section: 'career', group: 'History' },
];

export const teamConfig: RoleConfig = {
  role: 'team',
  label: 'Team',
  icon: Users,
  accent: '#3B82F6',
  tagline: 'Your team hub: squad, performance, trophies, history.',
  tabs: TEAM_TABS,
  fields: TEAM_FIELDS,
};
