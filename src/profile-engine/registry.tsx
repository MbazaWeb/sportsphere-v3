// ─── Profile Engine — Registry ─────────────────────────────────
//
// Single source of truth. Imports every role's config (custom + generic)
// and exposes:
//   - getRoleConfig(role)
//   - getTabsForRole(role)
//   - getFieldsForRole(role)
//   - renderTab(role, tabId, props)
//
// Also exposes the per-role completeness computation.

import type { ReactNode } from 'react';
import type { RoleConfig, TabId, TabDef, FieldDef, TabRenderProps, CompletenessResult } from './types';

// Custom role modules (rich, per-role UIs)
import { playerRole } from './roles/player';
import { coachRole } from './roles/coach';
import { teamRole } from './roles/team';

// Generic role configs (typed schema, shared renderer)
import { genericConfigs } from './roles/generic/configs';
import { GenericRoleTab } from './roles/generic/GenericRoleTab';

// ─── Build the registry ────────────────────────────────────────
const REGISTRY = new Map<string, RoleConfig>();

// Custom roles
for (const cfg of [playerRole, coachRole, teamRole]) {
  REGISTRY.set(cfg.role, cfg);
}

// Generic roles
for (const cfg of genericConfigs) {
  // Don't overwrite custom roles
  if (!REGISTRY.has(cfg.role)) REGISTRY.set(cfg.role, cfg);
}

// ─── Public API ────────────────────────────────────────────────

export function getRoleConfig(role: string): RoleConfig | null {
  return REGISTRY.get(role) || REGISTRY.get('fan') || null;
}

export function getTabsForRole(role: string): TabDef[] {
  const cfg = getRoleConfig(role);
  return cfg?.tabs || [];
}

export function getFieldsForRole(role: string): FieldDef[] {
  const cfg = getRoleConfig(role);
  return cfg?.fields || [];
}

// Map tab IDs to which "group" of fields they should show in the generic
// renderer. Custom renderers ignore this.
const TAB_GROUP_MAP: Partial<Record<TabId, string[]>> = {
  stats:        ['Performance', 'Record', 'Analytics', 'Metrics', 'Activity'],
  career:       ['Career', 'History'],
  achievements: ['History', 'Trophies'],
  scouting:     ['Scouting'],
  tactical:     ['Tactical'],
  reports:      ['Activity'],
  articles:     ['Portfolio', 'Metrics'],
  spotlight:    ['Portfolio', 'Analytics'],
  tools:        ['Analytics', 'Portfolio'],
  portfolio:    ['Portfolio', 'Partnerships', 'Marketing'],
  services:     ['Offerings', 'Services'],
  programs:     ['Programs', 'Outcomes', 'Activities'],
  clients:      ['Business', 'Portfolio'],
  members:      ['Stats'],
  facilities:   ['Facilities'],
  performance:  ['Performance', 'Current Season', 'Intelligence'],
  squad:        ['Squad'],
  standings:    ['Current Season'],
  fixtures:     ['Calendar', 'Current Season'],
};

export function renderTab(role: string, tabId: TabId, props: TabRenderProps): ReactNode {
  const cfg = getRoleConfig(role);
  if (!cfg) return null;

  // 1. Try the role's custom renderer first
  if (cfg.renderTab) {
    const node = cfg.renderTab(tabId, props);
    if (node !== null) return node;
  }

  // 2. Engine defaults for shared tabs
  //    (overview / feeds / about / shop are handled by the caller
  //    via OverviewTab / FeedsTab / AboutTab / ShopTab in the existing
  //    profiles/tabs/ folder — we return null so the caller knows to
  //    fall back to those.)
  if (tabId === 'overview' || tabId === 'feeds' || tabId === 'about' || tabId === 'shop') {
    return null;
  }

  // 3. Generic renderer for role-specific tabs (stats, career, tactical,
  //    reports, articles, spotlight, tools, portfolio, etc.)
  //    Filter the role's fields by the tab's group mapping.
  const groups = TAB_GROUP_MAP[tabId] || [];
  if (groups.length > 0) {
    // Render one GenericRoleTab per group, concatenated
    return (
      <>
        {groups.map(g => (
          <GenericRoleTab
            key={g}
            apiUser={props.apiUser}
            roleConfig={cfg}
            groupFilter={g}
            title={g}
          />
        ))}
      </>
    );
  }

  // 4. Final fallback — render all fields
  return <GenericRoleTab apiUser={props.apiUser} roleConfig={cfg} />;
}

// ─── Completeness Engine ───────────────────────────────────────
//
// Computes a 0-100 completeness score for a role profile based on
// which `required` and non-required fields have values. Required
// fields are weighted 3x more than optional fields.
//
// Returns the missing field labels so the UI can prompt the user.

export function computeCompleteness(
  role: string,
  roleProfile: Record<string, unknown> | null | undefined
): CompletenessResult {
  const cfg = getRoleConfig(role);
  if (!cfg) return { pct: 0, missing: [], filled: [] };

  const rp = roleProfile || {};
  const required = cfg.fields.filter(f => f.required);
  const optional = cfg.fields.filter(f => !f.required);

  const isFilled = (key: string): boolean => {
    const v = rp[key];
    if (v === null || v === undefined) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'number') return v > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.keys(v).length > 0;
    return true;
  };

  const filledRequired = required.filter(f => isFilled(f.key));
  const filledOptional = optional.filter(f => isFilled(f.key));
  const missingRequired = required.filter(f => !isFilled(f.key));
  const missingOptional = optional.filter(f => !isFilled(f.key));

  // Weighted: required fields = 3 points each, optional = 1 point each
  const totalPoints = required.length * 3 + optional.length * 1;
  const filledPoints = filledRequired.length * 3 + filledOptional.length * 1;
  const pct = totalPoints > 0 ? Math.round((filledPoints / totalPoints) * 100) : 0;

  return {
    pct,
    missing: [
      ...missingRequired.map(f => ({ key: f.key, label: f.label })),
      ...missingOptional.map(f => ({ key: f.key, label: f.label })),
    ],
    filled: [
      ...filledRequired.map(f => ({ key: f.key, label: f.label })),
      ...filledOptional.map(f => ({ key: f.key, label: f.label })),
    ],
  };
}

// ─── For debugging / introspection ─────────────────────────────
export function listRegisteredRoles(): string[] {
  return Array.from(REGISTRY.keys()).sort();
}

export function isCustomRole(role: string): boolean {
  const cfg = REGISTRY.get(role);
  return !!cfg && !!cfg.renderTab;
}
