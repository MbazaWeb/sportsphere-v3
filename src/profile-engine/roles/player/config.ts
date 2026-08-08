// ─── Player Role Config ────────────────────────────────────────
//
// Player is the richest profile on SportSphere. The schema is split into
// 5 groups: identity, performance, career, scouting, social.
//
// Performance metrics are POSITION-AWARE — the renderer shows different
// stats for GK / DEF / MID / FWD. See StatsTab.tsx.

import { Footprints } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const PLAYER_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview',     label: 'Overview'     },
  { id: 'feeds',        label: 'Feeds'        },
  { id: 'stats',        label: 'Performance'  },
  { id: 'career',       label: 'Career'       },
  { id: 'achievements', label: 'Achievements' },
  { id: 'scouting',     label: 'Scouting'     },
  { id: 'about',        label: 'About'        },
];

export const PLAYER_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'position',          label: 'Position',           type: 'select', section: 'identity', group: 'Identity', required: true,
    options: ['GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST'],
    hint: 'Primary position' },
  { key: 'secondaryPosition', label: 'Secondary Position', type: 'select', section: 'identity', group: 'Identity',
    options: ['—', 'GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST'] },
  { key: 'preferredFoot',     label: 'Preferred Foot',     type: 'select', section: 'identity', group: 'Identity', required: true,
    options: ['Right', 'Left', 'Both'] },
  { key: 'jerseyNumber',      label: 'Jersey Number',      type: 'text',   section: 'identity', group: 'Identity', placeholder: '10' },
  { key: 'height',            label: 'Height (cm)',        type: 'number', section: 'identity', group: 'Identity', placeholder: '180' },
  { key: 'weight',            label: 'Weight (kg)',        type: 'number', section: 'identity', group: 'Identity', placeholder: '75' },
  { key: 'dateOfBirth',       label: 'Date of Birth',      type: 'date',   section: 'identity', group: 'Identity' },
  { key: 'nationality',       label: 'Nationality',        type: 'text',   section: 'identity', group: 'Identity', placeholder: 'Tanzania' },
  { key: 'playerType',        label: 'Player Type',        type: 'select', section: 'identity', group: 'Identity',
    options: ['Professional', 'Semi-Professional', 'Amateur', 'Youth', 'Retired'] },
  { key: 'careerStatus',      label: 'Career Status',      type: 'select', section: 'identity', group: 'Identity', required: true,
    options: ['Active', 'Injured', 'Loaned', 'Retired', 'Free Agent'] },

  // ── Performance ── (stats entered by user / scout — eventually synced
  // from a stats provider. For now, manual entry via edit form.)
  { key: 'appearances',       label: 'Appearances',        type: 'number', section: 'performance', group: 'Performance' },
  { key: 'starts',            label: 'Starts',              type: 'number', section: 'performance', group: 'Performance' },
  { key: 'minutes',           label: 'Minutes Played',      type: 'number', section: 'performance', group: 'Performance' },
  { key: 'goals',             label: 'Goals',               type: 'number', section: 'performance', group: 'Performance' },
  { key: 'assists',           label: 'Assists',             type: 'number', section: 'performance', group: 'Performance' },
  { key: 'yellowCards',       label: 'Yellow Cards',        type: 'number', section: 'performance', group: 'Performance' },
  { key: 'redCards',          label: 'Red Cards',           type: 'number', section: 'performance', group: 'Performance' },
  { key: 'rating',            label: 'Average Rating',      type: 'number', section: 'performance', group: 'Performance', placeholder: '7.4' },
  { key: 'motm',              label: 'Man of the Match',    type: 'number', section: 'performance', group: 'Performance' },
  // Outfield
  { key: 'passAccuracy',      label: 'Pass Accuracy %',     type: 'number', section: 'performance', group: 'Performance' },
  { key: 'chancesCreated',    label: 'Chances Created',     type: 'number', section: 'performance', group: 'Performance' },
  { key: 'shots',             label: 'Shots',               type: 'number', section: 'performance', group: 'Performance' },
  { key: 'shotsOnTarget',     label: 'Shots on Target',     type: 'number', section: 'performance', group: 'Performance' },
  { key: 'tackles',           label: 'Tackles',             type: 'number', section: 'performance', group: 'Performance' },
  { key: 'interceptions',     label: 'Interceptions',       type: 'number', section: 'performance', group: 'Performance' },
  { key: 'duelsWon',          label: 'Duels Won %',         type: 'number', section: 'performance', group: 'Performance' },
  { key: 'aerialDuels',       label: 'Aerial Duels Won %',  type: 'number', section: 'performance', group: 'Performance' },
  // Goalkeeper
  { key: 'cleanSheets',       label: 'Clean Sheets',        type: 'number', section: 'performance', group: 'Performance' },
  { key: 'saves',             label: 'Saves',               type: 'number', section: 'performance', group: 'Performance' },
  { key: 'savePct',           label: 'Save %',              type: 'number', section: 'performance', group: 'Performance' },
  { key: 'goalsConceded',     label: 'Goals Conceded',      type: 'number', section: 'performance', group: 'Performance' },
  { key: 'penaltiesSaved',    label: 'Penalties Saved',     type: 'number', section: 'performance', group: 'Performance' },

  // ── Career ──
  { key: 'currentClub',       label: 'Current Club',        type: 'text', section: 'career', group: 'Career', required: true },
  { key: 'contractUntil',     label: 'Contract Until',      type: 'text', section: 'career', group: 'Career', placeholder: '2027' },
  { key: 'contractStatus',    label: 'Contract Status',     type: 'select', section: 'career', group: 'Career',
    options: ['Under Contract', 'Last 6 Months', 'Free Agent', 'Retired'] },
  { key: 'academy',           label: 'Youth Academy',       type: 'text', section: 'career', group: 'Career' },
  { key: 'debutYear',         label: 'Debut Year',          type: 'text', section: 'career', group: 'Career', placeholder: '2018' },
  { key: 'nationalTeam',      label: 'National Team',       type: 'text', section: 'career', group: 'Career' },
  { key: 'internationalCaps', label: 'International Caps',  type: 'number', section: 'career', group: 'Career' },
  { key: 'internationalGoals',label: 'International Goals', type: 'number', section: 'career', group: 'Career' },
  // transferHistory is an array of { year, from, to, fee, type: 'transfer'|'loan' }
  { key: 'transferHistory',   label: 'Transfer History',    type: 'textarea', section: 'career', group: 'Career',
    hint: 'One per line: 2024 | Club A → Club B | €10M | Transfer' },

  // ── Scouting ──
  { key: 'marketValue',       label: 'Market Value',        type: 'text', section: 'performance', group: 'Scouting', placeholder: '€5M' },
  { key: 'playingStyle',      label: 'Playing Style',       type: 'textarea', section: 'performance', group: 'Scouting',
    placeholder: 'Pacy winger with good dribbling and crossing...' },
  { key: 'strengths',         label: 'Strengths',           type: 'chips', section: 'performance', group: 'Scouting',
    hint: 'Press Enter to add' },
  { key: 'weaknesses',        label: 'Weaknesses',          type: 'chips', section: 'performance', group: 'Scouting' },
  { key: 'injuryHistory',     label: 'Injury History',      type: 'textarea', section: 'performance', group: 'Scouting',
    hint: 'Visible only to scouts/recruiters if privacy enabled' },
  { key: 'form',              label: 'Current Form',        type: 'select', section: 'performance', group: 'Scouting',
    options: ['Excellent', 'Good', 'Average', 'Poor', 'Injured'] },
  { key: 'ranking',           label: 'Player Ranking',      type: 'text', section: 'performance', group: 'Scouting', placeholder: '#42 in TZ' },
];

export const playerConfig: RoleConfig = {
  role: 'player',
  label: 'Player',
  icon: Footprints,
  accent: '#F5C518',
  tagline: 'Track your performance, career, and achievements.',
  tabs: PLAYER_TABS,
  fields: PLAYER_FIELDS,
};
