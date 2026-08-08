// ─── Academy Role Config ──────────────────────────────────────
//
// Academy = youth development. Signature feature is the
// **Development Pipeline** — Youth → Development → First Team → Pro
//
// programs: chips field (U8, U10, U12, U15, U17, U20)
// graduates: textarea "Name | Year | Position | Current Club | Status"
// Status = Pro / First Team / Development / Loaned / Released

import { GraduationCap } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const ACADEMY_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'feeds',    label: 'Feeds'    },
  { id: 'squad',    label: 'Pipeline' },
  { id: 'programs', label: 'Programs' },
  { id: 'about',    label: 'About'    },
];

export const ACADEMY_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'academyName',     label: 'Academy Name',     type: 'text', section: 'identity', group: 'Identity', required: true },
  { key: 'parentOrg',       label: 'Parent Organization', type: 'text', section: 'identity', group: 'Identity' },
  { key: 'location',        label: 'Location',         type: 'text', section: 'identity', group: 'Identity' },
  { key: 'foundedYear',     label: 'Founded Year',     type: 'text', section: 'identity', group: 'Identity' },
  { key: 'director',        label: 'Director',         type: 'text', section: 'identity', group: 'Identity' },

  // ── Programs ──
  { key: 'programs',        label: 'Programs (age groups)', type: 'chips', section: 'performance', group: 'Programs', hint: 'U8, U10, U12, U15, U17, U20' },
  { key: 'curriculum',      label: 'Curriculum / Methodology', type: 'textarea', section: 'performance', group: 'Programs' },

  // ── Outcomes ──
  { key: 'playersDeveloped',label: 'Players Developed', type: 'number', section: 'performance', group: 'Outcomes' },
  { key: 'playersPromoted', label: 'Players Promoted to First Team', type: 'number', section: 'performance', group: 'Outcomes' },
  { key: 'proGraduates',    label: 'Professional Graduates', type: 'number', section: 'performance', group: 'Outcomes' },
  { key: 'scholarships',    label: 'Scholarships Available', type: 'number', section: 'performance', group: 'Outcomes' },

  // ── Development pipeline (signature) ──
  { key: 'graduates',       label: 'Academy Graduates', type: 'textarea', section: 'performance', group: 'Pipeline',
    hint: 'One per line: Name | Year | Position | Current Club | Status (Pro/First Team/Development/Loaned/Released)' },
];

export const academyConfig: RoleConfig = {
  role: 'academy',
  label: 'Academy',
  icon: GraduationCap,
  accent: '#34D399',
  tagline: 'Develop young athletes through training programs.',
  tabs: ACADEMY_TABS,
  fields: ACADEMY_FIELDS,
};
