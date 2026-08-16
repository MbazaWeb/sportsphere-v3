// ─── Organization Role Config ─────────────────────────────────
//
// Organization = governing bodies, federations, associations.
// Signature feature is the **Governance Hub** — leadership, departments,
// affiliates, and competitions organized under one entity.
//
// leadership is parsed from a textarea: "Name | Role | Since"
// departments is parsed from a textarea: "Name | Head | Description"
// affiliates is parsed from a textarea: "Name | Type | Country"
// competitions is parsed from a textarea: "Name | Type | Frequency"

import { Building2 } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const ORGANIZATION_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'feeds',    label: 'Feeds'    },
  { id: 'programs', label: 'Governance' },
  { id: 'about',    label: 'About'    },
];

export const ORGANIZATION_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'orgType',         label: 'Organization Type', type: 'select', section: 'identity', group: 'Identity', required: true,
    options: ['Federation', 'Olympic Committee', 'National Association', 'Regional Association', 'NGO / Charity', 'Government Organization'] },
  { key: 'country',         label: 'Country',         type: 'text', section: 'identity', group: 'Identity' },
  { key: 'headquarters',    label: 'Headquarters',    type: 'text', section: 'identity', group: 'Identity' },
  { key: 'foundedYear',     label: 'Founded Year',    type: 'text', section: 'identity', group: 'Identity' },

  // ── Governance (signature fields) ──
  { key: 'leadership',      label: 'Leadership',      type: 'textarea', section: 'performance', group: 'Structure',
    hint: 'One per line: Name | Role | Since' },
  { key: 'departments',     label: 'Departments',     type: 'textarea', section: 'performance', group: 'Structure',
    hint: 'One per line: Name | Head | Description' },
  { key: 'affiliates',      label: 'Affiliates',      type: 'textarea', section: 'performance', group: 'Structure',
    hint: 'One per line: Name | Type | Country' },
  { key: 'competitions',    label: 'Competitions Organized', type: 'textarea', section: 'performance', group: 'Activities',
    hint: 'One per line: Name | Type | Frequency' },
  { key: 'programs',        label: 'Development Programs', type: 'textarea', section: 'performance', group: 'Activities',
    hint: 'One per line: Name | Focus | Reach' },
];

export const organizationConfig: RoleConfig = {
  role: 'organization',
  label: 'Organization',
  icon: Building2,
  accent: '#3B82F6',
  tagline: 'Governing bodies, federations, associations.',
  tabs: ORGANIZATION_TABS,
  fields: ORGANIZATION_FIELDS,
};
