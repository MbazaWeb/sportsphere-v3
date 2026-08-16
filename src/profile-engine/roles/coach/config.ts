// ─── Coach Role Config ─────────────────────────────────────────
//
// Coach is fundamentally different from Player:
//   - No position-aware metrics
//   - Has a Tactical Identity (formations, philosophy, pressing style)
//   - Has a Coaching Record (W/D/L, PPG, trophies)
//   - No market value, no scouting report

import { Megaphone } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const COACH_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'feeds',     label: 'Feeds'     },
  { id: 'stats',     label: 'Record'    },
  { id: 'tactical',  label: 'Tactical'  },
  { id: 'career',    label: 'Career'    },
  { id: 'achievements', label: 'Trophies' },
  { id: 'about',     label: 'About'     },
];

export const COACH_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'coachingRole',  label: 'Coaching Role',    type: 'select', section: 'identity', group: 'Identity', required: true,
    options: ['Head Coach', 'Assistant Coach', 'Goalkeeping Coach', 'Fitness Coach', 'Youth Coach'] },
  { key: 'currentTeam',   label: 'Current Team',     type: 'text',   section: 'identity', group: 'Identity', required: true },
  { key: 'license',       label: 'Coaching License', type: 'select', section: 'identity', group: 'Identity',
    options: ['None', 'C License', 'B License', 'A License', 'Pro License', 'FIFA Instructor'] },
  { key: 'licenseFederation', label: 'License Federation', type: 'text', section: 'identity', group: 'Identity', placeholder: 'TFF' },
  { key: 'nationality',   label: 'Nationality',      type: 'text',   section: 'identity', group: 'Identity' },
  { key: 'dateOfBirth',   label: 'Date of Birth',    type: 'date',   section: 'identity', group: 'Identity' },
  { key: 'yearsCoaching', label: 'Years Coaching',   type: 'number', section: 'identity', group: 'Identity' },

  // ── Record ──
  { key: 'matchesManaged', label: 'Matches Managed', type: 'number', section: 'performance', group: 'Record' },
  { key: 'wins',            label: 'Wins',            type: 'number', section: 'performance', group: 'Record' },
  { key: 'draws',           label: 'Draws',           type: 'number', section: 'performance', group: 'Record' },
  { key: 'losses',          label: 'Losses',          type: 'number', section: 'performance', group: 'Record' },
  { key: 'goalsFor',        label: 'Goals For',       type: 'number', section: 'performance', group: 'Record' },
  { key: 'goalsAgainst',    label: 'Goals Against',   type: 'number', section: 'performance', group: 'Record' },
  { key: 'cleanSheets',     label: 'Clean Sheets',    type: 'number', section: 'performance', group: 'Record' },
  { key: 'pointsPerGame',   label: 'Points Per Game', type: 'number', section: 'performance', group: 'Record', placeholder: '1.85' },
  { key: 'trophiesWon',     label: 'Trophies Won',    type: 'number', section: 'performance', group: 'Record' },

  // ── Tactical Identity ──
  { key: 'preferredFormation', label: 'Preferred Formation', type: 'select', section: 'performance', group: 'Tactical',
    options: ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2', '4-1-4-1', '4-3-2-1'] },
  { key: 'alternateFormations', label: 'Alternate Formations', type: 'chips', section: 'performance', group: 'Tactical', hint: 'Press Enter to add' },
  { key: 'playingPhilosophy',   label: 'Playing Philosophy',   type: 'textarea', section: 'performance', group: 'Tactical', placeholder: 'Possession-based, build from the back...' },
  { key: 'pressingStyle',       label: 'Pressing Style',       type: 'select', section: 'performance', group: 'Tactical',
    options: ['High Press', 'Mid Block', 'Low Block', 'Counter-Press', 'Situational'] },
  { key: 'possessionStyle',     label: 'Possession Style',     type: 'select', section: 'performance', group: 'Tactical',
    options: ['Dominant', 'Direct', 'Counter', 'Mixed'] },
  { key: 'defensiveApproach',   label: 'Defensive Approach',   type: 'select', section: 'performance', group: 'Tactical',
    options: ['Man-to-Man', 'Zonal', 'Hybrid', 'High Line', 'Low Line'] },
  { key: 'buildUpStyle',        label: 'Build-up Style',       type: 'select', section: 'performance', group: 'Tactical',
    options: ['From Back', 'Long Ball', 'Mixed', 'Wide Play', 'Central Play'] },

  // ── Career ──
  { key: 'previousClubs',    label: 'Previous Clubs',     type: 'textarea', section: 'career', group: 'Career',
    hint: 'One per line: 2020-2022 | Chelsea | Assistant' },
  { key: 'nationalTeams',    label: 'National Team Roles', type: 'textarea', section: 'career', group: 'Career' },
  { key: 'academyExperience',label: 'Academy Experience',  type: 'textarea', section: 'career', group: 'Career' },
  { key: 'playingCareer',    label: 'Playing Career',      type: 'textarea', section: 'career', group: 'Career',
    hint: 'Your own playing career before coaching' },

  // ── Playing Position (as a player) ──
  { key: 'playingPosition', label: 'Playing Position (as Player)', type: 'select', section: 'identity', group: 'Identity',
    options: ['GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST'] },

  // ── Management & Leadership ──
  { key: 'inGameManagement',  label: 'In-Game Management',    type: 'select', section: 'performance', group: 'Management',
    options: ['Proactive Substituter', 'Sticks to Plan', 'Adjusts Formation Mid-Game', 'Flexible & Reactive', 'Conservative'] },
  { key: 'manManagementStyle',label: 'Man-Management Style',  type: 'select', section: 'performance', group: 'Management',
    options: ['Authoritarian', 'Father-Figure', 'Tactical Innovator', 'Player\'s Coach', 'Motivator', 'Disciplinarian'] },
  { key: 'strengths',         label: 'Key Strengths',         type: 'chips',   section: 'performance', group: 'Management',
    hint: 'Press Enter to add — e.g. Tactical Flexibility, Youth Development' },
  { key: 'weaknesses',        label: 'Areas for Improvement', type: 'chips',   section: 'performance', group: 'Management' },

  // ── Attacking / Defensive Principles ──
  { key: 'attackingPrinciples', label: 'Attacking Principles', type: 'textarea', section: 'performance', group: 'Tactical',
    placeholder: 'e.g. Build from the back, overloads in wide areas, quick transitions...' },
  { key: 'defensivePrinciples', label: 'Defensive Principles', type: 'textarea', section: 'performance', group: 'Tactical',
    placeholder: 'e.g. High press, zonal marking, compact mid-block...' },

  // ── Assistant Staff ──
  { key: 'assistantCoach',    label: 'Assistant Coach',       type: 'text', section: 'career', group: 'Staff', placeholder: 'Name' },
  { key: 'firstTeamCoach',    label: 'First-Team Coach',      type: 'text', section: 'career', group: 'Staff', placeholder: 'Name' },
  { key: 'gkCoach',            label: 'Goalkeeping Coach',     type: 'text', section: 'career', group: 'Staff', placeholder: 'Name' },
  { key: 'fitnessCoach',      label: 'Fitness / Conditioning Coach', type: 'text', section: 'career', group: 'Staff', placeholder: 'Name' },
  { key: 'setPieceCoach',     label: 'Set-Piece Coach',       type: 'text', section: 'career', group: 'Staff', placeholder: 'Name' },

  // ── Fun Facts / Trivia ──
  { key: 'playingCareerHighlight', label: 'Playing Career Highlight', type: 'text', section: 'career', group: 'Trivia' },
  { key: 'coachingIdol',     label: 'Coaching Idol / Inspiration', type: 'text', section: 'career', group: 'Trivia' },
  { key: 'knownFor',         label: 'Known For',             type: 'text', section: 'career', group: 'Trivia',
    placeholder: 'e.g. Always wears a tracksuit, Famous for half-time team talks' },
];

export const coachConfig: RoleConfig = {
  role: 'coach',
  label: 'Coach',
  icon: Megaphone,
  accent: '#34D399',
  tagline: 'Showcase your tactical identity and coaching record.',
  tabs: COACH_TABS,
  fields: COACH_FIELDS,
};
