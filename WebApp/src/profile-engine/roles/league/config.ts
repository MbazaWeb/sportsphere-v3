// ─── League Role Config ───────────────────────────────────────
//
// League = permanent sports leagues (e.g., Premier League, La Liga)
// with divisions and seasons. Similar to Competition but with
// additional "League Intelligence" stats (avg goals, attendance)
// and a permanent roll of champions.
//
// previousChampions: Year | Champion | Runner-up
// standings: same format as Competition
// fixtures: same format as Competition

import { Medal } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const LEAGUE_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'feeds',     label: 'Feeds'     },
  { id: 'standings', label: 'Standings' },
  { id: 'fixtures',  label: 'Fixtures'  },
  { id: 'trophies',  label: 'Champions' },
  { id: 'about',     label: 'About'     },
];

export const LEAGUE_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'leagueName',      label: 'League Name',      type: 'text', section: 'identity', group: 'Identity', required: true },
  { key: 'country',         label: 'Country',          type: 'text', section: 'identity', group: 'Identity' },
  { key: 'division',        label: 'Division',         type: 'text', section: 'identity', group: 'Identity', placeholder: '1st, 2nd...' },
  { key: 'organizer',       label: 'Organizer',        type: 'text', section: 'identity', group: 'Identity' },
  { key: 'foundedYear',     label: 'Founded Year',     type: 'text', section: 'identity', group: 'Identity' },
  { key: 'currentSeason',   label: 'Current Season',   type: 'text', section: 'identity', group: 'Identity', placeholder: '2026/27' },

  // ── Current season ──
  { key: 'teams',           label: 'Number of Teams',  type: 'number', section: 'performance', group: 'Current Season' },
  { key: 'matchdays',       label: 'Matchdays Played', type: 'number', section: 'performance', group: 'Current Season' },
  { key: 'topScorer',       label: 'Current Top Scorer', type: 'text', section: 'performance', group: 'Current Season' },
  { key: 'topAssists',      label: 'Current Top Assists', type: 'text', section: 'performance', group: 'Current Season' },

  // ── League intelligence (signature) ──
  { key: 'avgGoals',        label: 'Average Goals/Match', type: 'number', section: 'performance', group: 'Intelligence', placeholder: '2.7' },
  { key: 'avgAttendance',   label: 'Average Attendance',  type: 'number', section: 'performance', group: 'Intelligence' },
  { key: 'allTimeTopScorer',label: 'All-time Top Scorer', type: 'text', section: 'performance', group: 'Intelligence' },
  { key: 'allTimeTopAppearances', label: 'All-time Top Appearances', type: 'text', section: 'performance', group: 'Intelligence' },

  // ── Standings + fixtures (same format as Competition) ──
  { key: 'standings',       label: 'Standings',        type: 'textarea', section: 'performance', group: 'Standings',
    hint: 'One per line: Pos | Team | P | W | D | L | GF | GA | GD | Pts' },
  { key: 'fixtures',        label: 'Fixtures',         type: 'textarea', section: 'performance', group: 'Fixtures',
    hint: 'One per line: Date | Home | Score | Away | Round | Status' },

  // ── Champions history ──
  { key: 'champions',       label: 'Reigning Champions', type: 'text', section: 'performance', group: 'History' },
  { key: 'previousChampions', label: 'Previous Champions', type: 'textarea', section: 'performance', group: 'History',
    hint: 'One per line: Year | Champion | Runner-up' },
];

export const leagueConfig: RoleConfig = {
  role: 'league',
  label: 'League',
  icon: Medal,
  accent: '#A855F7',
  tagline: 'Permanent sports leagues with divisions and seasons.',
  tabs: LEAGUE_TABS,
  fields: LEAGUE_FIELDS,
};
