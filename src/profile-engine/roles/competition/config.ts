// ─── Competition Role Config ──────────────────────────────────
//
// Competition = tournaments, cups, leagues (the event itself, not the
// governing body). Signature features:
//   - Standings table (parsed from textarea)
//   - Fixtures list (parsed from textarea)
//   - Honours / previous winners timeline
//   - Knockout bracket (if format is Knockout or Group + Knockout)

import { Trophy } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const COMPETITION_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'feeds',     label: 'Feeds'     },
  { id: 'standings', label: 'Standings' },
  { id: 'fixtures',  label: 'Fixtures'  },
  { id: 'trophies',  label: 'History'   },
  { id: 'about',     label: 'About'     },
];

export const COMPETITION_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'competitionName', label: 'Competition Name', type: 'text', section: 'identity', group: 'Identity', required: true },
  { key: 'season',          label: 'Current Season',   type: 'text', section: 'identity', group: 'Identity', placeholder: '2026/27' },
  { key: 'organizer',       label: 'Organizer',        type: 'text', section: 'identity', group: 'Identity' },
  { key: 'country',         label: 'Country',          type: 'text', section: 'identity', group: 'Identity' },
  { key: 'level',           label: 'Level',            type: 'select', section: 'identity', group: 'Identity',
    options: ['Domestic', 'Continental', 'International', 'Youth', 'Women', 'Amateur'] },
  { key: 'format',          label: 'Format',           type: 'select', section: 'identity', group: 'Identity',
    options: ['League', 'Knockout', 'Group + Knockout', 'Round Robin', 'Tournament'] },

  // ── Current season ──
  { key: 'participants',    label: 'Number of Teams',  type: 'number', section: 'performance', group: 'Season' },
  { key: 'topScorer',       label: 'Top Scorer',       type: 'text', section: 'performance', group: 'Season' },
  { key: 'topAssists',      label: 'Top Assists',      type: 'text', section: 'performance', group: 'Season' },

  // ── Standings (signature) ──
  { key: 'standings',       label: 'Standings',        type: 'textarea', section: 'performance', group: 'Standings',
    hint: 'One per line: Pos | Team | P | W | D | L | GF | GA | GD | Pts' },

  // ── Fixtures (signature) ──
  { key: 'fixtures',        label: 'Fixtures',         type: 'textarea', section: 'performance', group: 'Fixtures',
    hint: 'One per line: Date | Home | Score | Away | Round | Status (Scheduled/Live/Finished)' },

  // ── History ──
  { key: 'previousWinners', label: 'Previous Winners', type: 'textarea', section: 'performance', group: 'History',
    hint: 'One per line: Year | Winner | Runner-up | Score' },
  { key: 'records',         label: 'Competition Records', type: 'textarea', section: 'performance', group: 'History',
    hint: 'One per line: Record | Holder | Year' },

  // ── Knockout bracket (signature for knockout format) ──
  { key: 'bracket',         label: 'Knockout Bracket', type: 'textarea', section: 'performance', group: 'Bracket',
    hint: 'One match per line: Round | Home | Score | Away  ·  Rounds: Round of 16 / Quarterfinal / Semifinal / Final' },
];

export const competitionConfig: RoleConfig = {
  role: 'competition',
  label: 'Competition',
  icon: Trophy,
  accent: '#F5C518',
  tagline: 'Sports competitions, tournaments, cups.',
  tabs: COMPETITION_TABS,
  fields: COMPETITION_FIELDS,
};
