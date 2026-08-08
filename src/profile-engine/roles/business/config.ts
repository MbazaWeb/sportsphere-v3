// ─── Business Role Config ─────────────────────────────────────
//
// Business = sports-related commercial entities (sportswear, media,
// agency, technology, nutrition, retail).
//
// Signature feature is the **Partnership Portfolio** — partner teams,
// athletes, and sponsorships organized in one place.
//
// products:        textarea "Product | Category | Price"
// partnerTeams:    textarea "Team | Since | Deal Value"
// partnerAthletes: textarea "Athlete | Since | Deal Value"
// sponsorships:    textarea "Sponsored Event | Year | Value"
// campaigns:       textarea "Campaign | Status | Reach"

import { Briefcase } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const BUSINESS_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'feeds',     label: 'Feeds'     },
  { id: 'shop',      label: 'Products'  },
  { id: 'services',  label: 'Partnerships' },
  { id: 'about',     label: 'About'     },
];

export const BUSINESS_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'companyName',     label: 'Company Name',     type: 'text', section: 'identity', group: 'Identity', required: true },
  { key: 'industry',        label: 'Industry',         type: 'select', section: 'identity', group: 'Identity',
    options: ['Sportswear', 'Sports Media', 'Sports Agency', 'Sports Technology', 'Sports Nutrition', 'Sports Retail'] },
  { key: 'foundedYear',     label: 'Founded Year',     type: 'text', section: 'identity', group: 'Identity' },
  { key: 'headquarters',    label: 'Headquarters',     type: 'text', section: 'identity', group: 'Identity' },
  { key: 'website',         label: 'Website',          type: 'url', section: 'identity', group: 'Identity' },
  { key: 'employees',       label: 'Employees',        type: 'number', section: 'identity', group: 'Identity' },

  // ── Products ──
  { key: 'products',        label: 'Products / Services', type: 'textarea', section: 'performance', group: 'Offerings',
    hint: 'One per line: Product | Category | Price' },

  // ── Partnership portfolio (signature) ──
  { key: 'partnerTeams',    label: 'Partner Teams',    type: 'textarea', section: 'performance', group: 'Partnerships',
    hint: 'One per line: Team | Since | Deal Value' },
  { key: 'partnerAthletes', label: 'Partner Athletes', type: 'textarea', section: 'performance', group: 'Partnerships',
    hint: 'One per line: Athlete | Since | Deal Value' },
  { key: 'sponsorships',    label: 'Sponsorships',     type: 'textarea', section: 'performance', group: 'Partnerships',
    hint: 'One per line: Sponsored Event | Year | Value' },

  // ── Marketing ──
  { key: 'campaigns',       label: 'Active Campaigns', type: 'textarea', section: 'performance', group: 'Marketing',
    hint: 'One per line: Campaign | Status | Reach' },
];

export const businessConfig: RoleConfig = {
  role: 'business',
  label: 'Business',
  icon: Briefcase,
  accent: '#F5C518',
  tagline: 'Sports-related businesses and commercial entities.',
  tabs: BUSINESS_TABS,
  fields: BUSINESS_FIELDS,
};
