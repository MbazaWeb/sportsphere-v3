// ─── Profile Engine — Types ────────────────────────────────────
//
// The Profile Engine is the single source of truth for:
//   1. What tabs each role shows
//   2. What fields each role's roleProfile JSON contains (typed schema)
//   3. How to render each tab for each role (dispatcher)
//   4. What fields contribute to "profile completeness" per role
//
// The engine is intentionally TYPE-DRIVEN, not data-driven at runtime.
// Each role has a typed module under `roles/<role>/` that exports a
// `RoleConfig`. The registry imports them all and exposes:
//
//   - getRoleConfig(role): RoleConfig | null
//   - getTabsForRole(role): TabDef[]
//   - renderTab(role, tabId, props): ReactNode
//   - computeCompleteness(role, roleProfile): { pct, missing[] }
//
// This replaces:
//   - ProfileTabs.getTabsForRole (regex-driven, no schema)
//   - RoleContentTab + 16 wrappers (all the same generic grid)
//   - EditProfileModal.RoleProfileSection.roleConfigs (hardcoded inline)

import type { ReactNode } from 'react';

// ─── Tab IDs ───────────────────────────────────────────────────
// The full set of tab IDs the engine knows about. Each role's config
// picks a subset. IDs are stable strings so deep-linking works.
export type TabId =
  | 'overview'    // dashboard / hero summary
  | 'feeds'       // user's posts + media
  | 'about'       // contact + bio + socials
  | 'shop'        // merch / products / services
  // ── Player / Coach / Athlete ──
  | 'stats'       // performance dashboard (position-aware for players)
  | 'career'      // career timeline + transfer/loan history
  | 'achievements'// trophies, individual awards, records
  | 'scouting'    // scouting report, market value, strengths/weaknesses
  // ── Team / Entity ──
  | 'squad'       // squad grouped by position
  | 'performance' // matches, form, points, position
  | 'trophies'    // club honours
  | 'fixtures'    // upcoming + recent matches
  | 'standings'   // league table
  // ── Coach-specific ──
  | 'tactical'    // formations, philosophy, pressing style
  // ── Scout-specific ──
  | 'reports'     // scouting reports / scouting board
  // ── Media / Content ──
  | 'articles'    // published work
  | 'spotlight'   // creator spotlight (videos, reels, podcasts)
  // ── Analyst ──
  | 'tools'       // analytics tools / models / prediction record
  // ── Commercial ──
  | 'portfolio'   // sponsorship / partnership portfolio
  | 'services'    // business services
  | 'programs'    // academy / org programs
  | 'clients'     // agent clients
  | 'members'     // community members
  | 'facilities'  // venue facilities
  // ── Internal (admin) ──
  | 'console';    // admin console (permissions-gated)

export interface TabDef {
  id: TabId;
  label: string;
  /** Optional lucide icon override; default is per-tab. */
  icon?: unknown;
}

// ─── Field schema (for edit forms + completeness) ──────────────
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'chips'
  | 'url'
  | 'toggle';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];          // for select / multiselect / chips
  group?: string;              // visual grouping in the edit form
  required?: boolean;          // contributes to completeness
  /** Hint shown under the input. */
  hint?: string;
  /** Section in the edit modal where this field appears. */
  section?: 'identity' | 'performance' | 'career' | 'contact' | 'social';
}

// ─── Per-role config ───────────────────────────────────────────
export interface RoleConfig {
  /** Role slug from the DB (e.g., 'player', 'coach', 'team'). */
  role: string;
  /** Human label for the role. */
  label: string;
  /** Lucide icon (component type, not instance). */
  icon: unknown;
  /** Accent color (CSS color string) for hero gradients, badges. */
  accent: string;
  /** One-line tagline shown on the role's empty-state. */
  tagline: string;
  /** Tabs this role shows, in order. */
  tabs: TabDef[];
  /** Field schema for the edit form + completeness engine. */
  fields: FieldDef[];
  /** Optional: a custom renderer for a specific tab. Falls back to engine default. */
  renderTab?: (tabId: TabId, props: TabRenderProps) => ReactNode | null;
}

// ─── Tab render props ──────────────────────────────────────────
export interface TabRenderProps {
  apiUser: ApiUserLike | null;
  role: string;
  /** The viewer's handle (for "edit" affordances on own profile). */
  viewerHandle?: string | null;
}

// Minimal ApiUser shape the engine needs. Real ApiUser has more fields;
// we accept a structural subset so we don't import the (currently
// duplicated) ApiUser type from two places.
export interface ApiUserLike {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string | null;
  avatarInitials?: string | null;
  isVerified?: boolean;
  isPro?: boolean;
  bio?: string | null;
  aboutMe?: string | null;
  role: string;
  roleId?: string;
  roleTypeId?: string;
  roleName?: string;
  roleSlug?: string;
  roleIcon?: string;
  roleCategory?: string;
  typeName?: string;
  location?: string | null;
  countryOfOrigin?: string | null;
  city?: string | null;
  coverGradient?: string;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  registeredAt?: string;
  roleProfile?: Record<string, unknown> | null;
  // ─── Phase 4: typed profile row (attached by API layer) ────
  // When the user has a custom role, the API layer fetches the
  // matching typed table row (PlayerProfile, CoachProfile, etc.)
  // and attaches it here as a plain Record. Renderers should call
  // `getRoleProfile(apiUser, role)` which prefers `typedProfile`
  // for custom roles and falls back to `roleProfile` JSON for
  // generic roles.
  typedProfile?: Record<string, unknown> | null;
  // social links
  website?: string | null;
  socialInstagram?: string | null;
  socialTwitter?: string | null;
  socialYoutube?: string | null;
  socialLinkedin?: string | null;
  // role-specific extras live here in practice
  [key: string]: unknown;
}

// ─── Completeness ──────────────────────────────────────────────
export interface CompletenessResult {
  /** 0-100 */
  pct: number;
  /** Field labels that are missing/empty (for the "complete your profile" UI). */
  missing: Array<{ key: string; label: string }>;
  /** Field labels that are filled. */
  filled: Array<{ key: string; label: string }>;
}
