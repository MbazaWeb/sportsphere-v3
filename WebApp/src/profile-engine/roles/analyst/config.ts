// ─── Analyst Role Config ──────────────────────────────────────
//
// Analyst's signature feature is the **Prediction Record** — a list
// of predictions with outcome tracking (correct / incorrect / pending)
// and an overall accuracy %.
//
// Predictions are entered in the edit form as a textarea, one per line:
//   "Match | Prediction | Actual | Result | Confidence %"
//
// Result is one of: Correct / Incorrect / Pending.
// The renderer computes overall accuracy from Correct / (Correct+Incorrect).

import { BarChart3 } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const ANALYST_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'feeds',    label: 'Feeds'    },
  { id: 'tools',    label: 'Predictions' },
  { id: 'articles', label: 'Reports'  },
  { id: 'about',    label: 'About'    },
];

export const ANALYST_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'analystType',     label: 'Analyst Type',         type: 'select', section: 'identity', group: 'Identity', required: true,
    options: ['Data Analyst', 'Tactical Analyst', 'Statistician', 'Predictive Analyst'] },
  { key: 'organization',    label: 'Organization',         type: 'text', section: 'identity', group: 'Identity' },
  { key: 'expertise',       label: 'Areas of Expertise',   type: 'chips', section: 'identity', group: 'Identity' },

  // ── Analytics portfolio ──
  { key: 'reportsPublished',label: 'Reports Published',    type: 'number', section: 'performance', group: 'Analytics' },
  { key: 'modelsCreated',   label: 'Models Created',       type: 'number', section: 'performance', group: 'Analytics' },
  { key: 'teamsAnalyzed',   label: 'Teams Analyzed',       type: 'number', section: 'performance', group: 'Analytics' },
  { key: 'playersAnalyzed', label: 'Players Analyzed',     type: 'number', section: 'performance', group: 'Analytics' },
  { key: 'topModels',       label: 'Top Models',           type: 'textarea', section: 'performance', group: 'Portfolio' },

  // ── Prediction record (the signature field) ──
  { key: 'predictions',     label: 'Prediction Record',    type: 'textarea', section: 'performance', group: 'Predictions',
    hint: 'One per line: Match | Prediction | Actual | Result | Confidence %  ·  Result = Correct / Incorrect / Pending' },
];

export const analystConfig: RoleConfig = {
  role: 'analyst',
  label: 'Analyst',
  icon: BarChart3,
  accent: '#3B82F6',
  tagline: 'Sports intelligence: data, tactics, predictions.',
  tabs: ANALYST_TABS,
  fields: ANALYST_FIELDS,
};
