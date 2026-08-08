// ─── Scout Role Config ─────────────────────────────────────────
//
// Scout's signature feature is the **Scouting Board** — a Kanban-style
// view of players the scout is tracking, with 4 columns:
//
//   Watching → Shortlisted → Recommended → Signed
//
// Players are entered in the edit form as a textarea, one per line:
//   "Name | Position | Club | Rating 0-100 | Status | Note"
//
// Status drives which column the card appears in.

import { Search } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const SCOUT_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'feeds',    label: 'Feeds'    },
  { id: 'reports',  label: 'Board'    },
  { id: 'career',   label: 'Career'   },
  { id: 'about',    label: 'About'    },
];

export const SCOUT_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'scoutType',          label: 'Scout Type',          type: 'select', section: 'identity', group: 'Identity', required: true,
    options: ['Chief Scout', 'Talent Scout', 'Recruitment Manager', 'Opposition Scout', 'Data Scout'] },
  { key: 'organization',       label: 'Organization',        type: 'text',   section: 'identity', group: 'Identity', required: true },
  { key: 'geographicCoverage', label: 'Geographic Coverage', type: 'text',   section: 'identity', group: 'Identity', placeholder: 'East Africa' },
  { key: 'sportsCovered',      label: 'Sports Covered',      type: 'chips',  section: 'identity', group: 'Identity' },
  { key: 'yearsExperience',    label: 'Years Experience',    type: 'number', section: 'identity', group: 'Identity' },
  { key: 'specialization',     label: 'Specialization',      type: 'select', section: 'identity', group: 'Identity',
    options: ['Youth Scouting', 'First-Team Scouting', 'Opposition Scouting', 'Data Scouting', 'Recruitment'] },

  // ── Activity metrics ──
  { key: 'playersDiscovered',     label: 'Players Discovered',     type: 'number', section: 'performance', group: 'Activity' },
  { key: 'playersRecommended',    label: 'Players Recommended',    type: 'number', section: 'performance', group: 'Activity' },
  { key: 'successfulSignings',    label: 'Successful Signings',    type: 'number', section: 'performance', group: 'Activity' },
  { key: 'countriesCovered',      label: 'Countries Covered',      type: 'number', section: 'performance', group: 'Activity' },
  { key: 'competitionsMonitored', label: 'Competitions Monitored', type: 'number', section: 'performance', group: 'Activity' },

  // ── Scouting Board (the signature field) ──
  { key: 'scoutingBoard',   label: 'Scouting Board',   type: 'textarea', section: 'performance', group: 'Scouting',
    hint: 'One player per line: Name | Position | Club | Rating 0-100 | Status | Note  ·  Status = Watching / Shortlisted / Recommended / Signed' },
];

export const scoutConfig: RoleConfig = {
  role: 'scout',
  label: 'Scout',
  icon: Search,
  accent: '#34D399',
  tagline: 'Talent intelligence: discover, track, and recommend players.',
  tabs: SCOUT_TABS,
  fields: SCOUT_FIELDS,
};
