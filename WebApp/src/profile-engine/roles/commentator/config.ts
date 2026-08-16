// ─── Commentator Role Config ──────────────────────────────────
//
// Commentator's signature feature is the **Broadcast Log** — a list
// of matches covered with competition, broadcaster, and co-commentator.
//
// Matches are entered in the edit form as a textarea, one per line:
//   "Date | Match | Competition | Broadcaster | Co-commentator | Role"
//
// Role = Lead Commentator / Co-commentator / Presenter / Pundit / Studio Analyst.

import { Mic } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const COMMENTATOR_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'feeds',     label: 'Feeds'     },
  { id: 'spotlight', label: 'Broadcasts' },
  { id: 'career',    label: 'Career'    },
  { id: 'about',     label: 'About'     },
];

export const COMMENTATOR_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'commentatorType', label: 'Commentator Type', type: 'select', section: 'identity', group: 'Identity', required: true,
    options: ['TV Commentator', 'Radio Commentator', 'TV Presenter', 'Radio Presenter'] },
  { key: 'broadcaster',     label: 'Broadcaster',      type: 'text', section: 'identity', group: 'Identity', required: true },
  { key: 'languages',       label: 'Languages',        type: 'chips', section: 'identity', group: 'Identity' },
  { key: 'sports',          label: 'Sports',           type: 'chips', section: 'identity', group: 'Identity' },
  { key: 'yearsActive',     label: 'Years Active',     type: 'number', section: 'identity', group: 'Identity' },

  // ── Aggregate stats ──
  { key: 'matchesCovered',  label: 'Matches Covered',  type: 'number', section: 'performance', group: 'Career' },
  { key: 'competitions',    label: 'Competitions',     type: 'number', section: 'performance', group: 'Career' },
  { key: 'countries',       label: 'Countries',        type: 'number', section: 'performance', group: 'Career' },

  // ── Major events ──
  { key: 'majorEvents',     label: 'Major Events Covered', type: 'textarea', section: 'performance', group: 'Portfolio',
    hint: 'One per line: Year | Event | Role' },

  // ── Broadcast log (the signature field) ──
  { key: 'matchLog',        label: 'Broadcast Log',    type: 'textarea', section: 'performance', group: 'Broadcasts',
    hint: 'One per line: Date | Match | Competition | Broadcaster | Co-commentator | Role (Lead/Co/Presenter/Pundit/Studio)' },
];

export const commentatorConfig: RoleConfig = {
  role: 'commentator',
  label: 'Commentator',
  icon: Mic,
  accent: '#A855F7',
  tagline: 'Broadcast career: matches covered, competitions, networks.',
  tabs: COMMENTATOR_TABS,
  fields: COMMENTATOR_FIELDS,
};
