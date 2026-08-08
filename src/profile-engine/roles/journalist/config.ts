// ─── Journalist Role Config ───────────────────────────────────
//
// Journalist's signature feature is the **Article Portfolio** with
// engagement metrics (views, likes, comments) per article.
//
// Articles are entered in the edit form as a textarea, one per line:
//   "Title | Publication | Date | URL | Views | Likes | Comments | Type"
//
// Type drives the badge color (Exclusive / Breaking / Interview / Feature / Opinion).

import { Newspaper } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const JOURNALIST_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'feeds',    label: 'Feeds'    },
  { id: 'articles', label: 'Articles' },
  { id: 'career',   label: 'Career'   },
  { id: 'about',    label: 'About'    },
];

export const JOURNALIST_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'publication',  label: 'Publication',         type: 'text',   section: 'identity', group: 'Identity', required: true },
  { key: 'beat',         label: 'Beat',                type: 'text',   section: 'identity', group: 'Identity', placeholder: 'Transfers, National team...' },
  { key: 'location',     label: 'Location',            type: 'text',   section: 'identity', group: 'Identity' },
  { key: 'yearsActive',  label: 'Years Active',        type: 'number', section: 'identity', group: 'Identity' },
  { key: 'languages',    label: 'Languages',           type: 'chips',  section: 'identity', group: 'Identity' },

  // ── Coverage ──
  { key: 'coverage',     label: 'Coverage Areas',      type: 'chips',  section: 'performance', group: 'Coverage', hint: 'Football, Basketball, Transfers...' },

  // ── Aggregate metrics ──
  { key: 'articleCount', label: 'Articles Published',  type: 'number', section: 'performance', group: 'Metrics' },
  { key: 'exclusives',   label: 'Exclusive Stories',   type: 'number', section: 'performance', group: 'Metrics' },
  { key: 'interviews',   label: 'Interviews',          type: 'number', section: 'performance', group: 'Metrics' },
  { key: 'breakingNews', label: 'Breaking News',       type: 'number', section: 'performance', group: 'Metrics' },
  { key: 'totalViews',   label: 'Total Views',         type: 'text',   section: 'performance', group: 'Metrics', placeholder: '2.4M' },

  // ── Credibility ──
  { key: 'pressCredentials', label: 'Press Credentials', type: 'textarea', section: 'performance', group: 'Credibility' },

  // ── Articles (the signature field) ──
  { key: 'articles',     label: 'Article Portfolio',   type: 'textarea', section: 'performance', group: 'Portfolio',
    hint: 'One article per line: Title | Publication | Date | URL | Views | Likes | Comments | Type (Exclusive/Breaking/Interview/Feature/Opinion)' },
];

export const journalistConfig: RoleConfig = {
  role: 'journalist',
  label: 'Journalist',
  icon: Newspaper,
  accent: '#F5C518',
  tagline: 'Professional media profile: articles, exclusives, interviews.',
  tabs: JOURNALIST_TABS,
  fields: JOURNALIST_FIELDS,
};
