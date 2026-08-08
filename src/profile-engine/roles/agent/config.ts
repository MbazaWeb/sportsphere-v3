// ─── Agent Role Config ────────────────────────────────────────
//
// Agent's signature feature is the **Client Roster** — a list of
// clients (players or coaches) with their club, status, and contract
// value.
//
// Clients are entered in the edit form as a textarea, one per line:
//   "Name | Role | Club | Status | Contract Value | Contract Until"
//
// Status = Active / Negotiating / Free Agent / Loaned / Retired
// Role = Player / Coach / Staff

import { Handshake } from 'lucide-react';
import type { RoleConfig, TabId } from '../../types';

export const AGENT_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'feeds',    label: 'Feeds'    },
  { id: 'clients',  label: 'Clients'  },
  { id: 'career',   label: 'Career'   },
  { id: 'about',    label: 'About'    },
];

export const AGENT_FIELDS: RoleConfig['fields'] = [
  // ── Identity ──
  { key: 'agentType',       label: 'Agent Type',           type: 'select', section: 'identity', group: 'Identity', required: true,
    options: ['Player Agent', 'Coach Agent', 'Licensed Agent'] },
  { key: 'agency',          label: 'Agency',               type: 'text', section: 'identity', group: 'Identity' },
  { key: 'license',         label: 'License Number',       type: 'text', section: 'identity', group: 'Identity' },
  { key: 'federation',      label: 'Federation',           type: 'text', section: 'identity', group: 'Identity', placeholder: 'FIFA' },
  { key: 'countries',       label: 'Operating Countries',  type: 'chips', section: 'identity', group: 'Identity' },

  // ── Business metrics ──
  { key: 'playersRepresented', label: 'Players Represented', type: 'number', section: 'performance', group: 'Business' },
  { key: 'coachesRepresented', label: 'Coaches Represented', type: 'number', section: 'performance', group: 'Business' },
  { key: 'transfersCompleted', label: 'Transfers Completed', type: 'number', section: 'performance', group: 'Business' },
  { key: 'totalTransferValue', label: 'Total Transfer Value', type: 'text',   section: 'performance', group: 'Business', placeholder: '€8.2M' },
  { key: 'activeNegotiations', label: 'Active Negotiations', type: 'number', section: 'performance', group: 'Business' },
  { key: 'contractsManaged',   label: 'Contracts Managed',   type: 'number', section: 'performance', group: 'Business' },

  // ── Client roster (the signature field) ──
  { key: 'clientRoster',   label: 'Client Roster',       type: 'textarea', section: 'performance', group: 'Clients',
    hint: 'One per line: Name | Role (Player/Coach/Staff) | Club | Status (Active/Negotiating/Free Agent/Loaned/Retired) | Contract Value | Contract Until' },
];

export const agentConfig: RoleConfig = {
  role: 'agent',
  label: 'Agent',
  icon: Handshake,
  accent: '#F5C518',
  tagline: 'Representation: clients, transfers, contracts.',
  tabs: AGENT_TABS,
  fields: AGENT_FIELDS,
};
