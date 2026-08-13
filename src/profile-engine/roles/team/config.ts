// ─── Team Role Config ─────────────────────────────────────────
//
// Team is the most important entity profile. Squad, performance,
// trophies, fixtures, shop, history.

import { Users } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const TEAM_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview',    label: 'Overview'    },
  { id: 'feeds',       label: 'Feeds'       },
  { id: 'fixtures',    label: 'Fixtures'    },
  { id: 'squad',       label: 'Squad'       },
  { id: 'performance', label: 'Performance' },
  { id: 'standings',   label: 'Standings'   },
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

  // ── Current Season Overview (2025-26) ──
  { key: 'topScorer',       label: 'Top Scorer (Season)',  type: 'text',   section: 'performance', group: 'Current Season',
    placeholder: 'Player Name' },
  { key: 'mostAssists',     label: 'Most Assists (Season)',type: 'text',   section: 'performance', group: 'Current Season',
    placeholder: 'Player Name' },
  { key: 'seasonObjective', label: 'Season Objective',    type: 'select', section: 'performance', group: 'Current Season',
    options: ['Win the League', 'Top 4 Finish', 'Cup Run', 'Avoid Relegation', 'Develop Youth', 'Champions League Qualification'] },

  // ── Club History & Identity ──
  { key: 'motto',          label: 'Club Motto / Slogan',  type: 'text',     section: 'identity', group: 'History' },
  { key: 'rivalries',      label: 'Major Rivalries',      type: 'textarea', section: 'identity', group: 'History',
    hint: 'One per line: Rival Club Name' },
  { key: 'fanCulture',     label: 'Fan Culture',          type: 'textarea', section: 'identity', group: 'History',
    placeholder: 'Brief description of the fanbase...' },
  { key: 'clubLegends',    label: 'Club Legends / Icons',  type: 'textarea', section: 'identity', group: 'History',
    hint: '3-5 all-time greats, one per line' },

  // ── Playing Style & Philosophy ──
  { key: 'tacticalFormation', label: 'Tactical Formation', type: 'select', section: 'performance', group: 'Playing Style',
    options: ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2', '4-1-4-1', '4-3-2-1'] },
  { key: 'styleOfPlay',      label: 'Style of Play',       type: 'select', section: 'performance', group: 'Playing Style',
    options: ['Possession-based', 'Counter-attacking', 'High-press', 'Direct', 'Defensive', 'Balanced'] },
  { key: 'keyPrinciples',    label: 'Key Principles',       type: 'textarea', section: 'performance', group: 'Playing Style',
    placeholder: 'What does this team always do well? e.g. Press immediately after losing the ball...' },
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
