// ─── SportSphere — RBAC Permission Matrix ─────────────────────
// Defines all admin roles, their tier, module, and permissions.
// Used by:
//   - adminGuard.ts to check if a user can access a route
//   - dashboard layout to show/hide sidebar sections
//   - The seed script to populate AdminRole table
//
// 4-tier hierarchy:
//   Tier 1: SUPER_ADMIN (1-2 people) — god mode, all permissions
//   Tier 2: Directors (5 types) — oversee a whole module
//   Tier 3: Specialists (10 types) — day-to-day operations in a module
//   Tier 4: Moderators (3 types) — regional/language scoped

export interface AdminRoleDef {
  slug: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  module: 'users' | 'trust_safety' | 'sports_content' | 'community' | 'platform' | 'cross';
  description: string;
  permissions: string[];
  scopeLevel: 'global' | 'regional' | 'language';
}

// ─── Permission catalog ─────────────────────────────────────
// Format: <module>.<action>[.scope]
// Examples: 'users.read', 'users.suspend', 'news.publish', 'claims.approve'
export const PERMISSIONS = {
  // Users module
  USERS_READ: 'users.read',
  USERS_SUSPEND: 'users.suspend',
  USERS_DELETE: 'users.delete',
  USERS_VERIFY: 'users.verify',
  USERS_ROLE_ASSIGN: 'users.role_assign',
  USERS_EXPORT: 'users.export',

  // Trust & Safety
  KYC_REVIEW: 'kyc.review',
  KYC_APPROVE: 'kyc.approve',
  KYC_REJECT: 'kyc.reject',
  FRAUD_REVIEW: 'fraud.review',
  FRAUD_FLAG: 'fraud.flag',
  FRAUD_BAN: 'fraud.ban',
  MODERATION_REVIEW: 'moderation.review',
  MODERATION_DELETE: 'moderation.delete',
  MODERATION_RESTORE: 'moderation.restore',

  // Sports Content
  SPORTS_SYNC: 'sports.sync',
  SPORTS_CREATE: 'sports.create',
  SPORTS_EDIT: 'sports.edit',
  SPORTS_DELETE: 'sports.delete',
  SPORTS_VERIFY: 'sports.verify',
  NEWS_CREATE: 'news.create',
  NEWS_EDIT: 'news.edit',
  NEWS_PUBLISH: 'news.publish',
  NEWS_DELETE: 'news.delete',
  RUMORS_CREATE: 'rumors.create',
  RUMORS_EDIT: 'rumors.edit',
  RUMORS_PUBLISH: 'rumors.publish',
  RUMORS_DEBUNK: 'rumors.debunk',
  CLAIMS_REVIEW: 'claims.review',
  CLAIMS_APPROVE: 'claims.approve',
  CLAIMS_REJECT: 'claims.reject',
  AI_SYNC: 'ai.sync',
  AI_GENERATE: 'ai.generate',
  AI_VERIFY: 'ai.verify',

  // Community
  COMMUNITY_REVIEW: 'community.review',
  COMMUNITY_BAN: 'community.ban',
  COMMUNITY_FEATURE: 'community.feature',
  SUPPORT_TICKETS: 'support.tickets',
  SUPPORT_ESCALATE: 'support.escalate',

  // Platform
  BILLING_REVIEW: 'billing.review',
  BILLING_REFUND: 'billing.refund',
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
  HEALTH_VIEW: 'health.view',
  AUDIT_VIEW: 'audit.view',
  ROLES_MANAGE: 'roles.manage',
  DELEGATE: 'delegate',  // grant/revoke admin roles
} as const;

// ─── All permissions (helper) ───────────────────────────────
const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// ─── Role definitions ───────────────────────────────────────
export const ADMIN_ROLES: AdminRoleDef[] = [
  // ─── Tier 1: Super Admin ─────────────────────────────────
  {
    slug: 'SUPER_ADMIN',
    name: 'Super Admin',
    tier: 1,
    module: 'cross',
    description: 'Full system access. 1-2 people only. Can delegate any role.',
    permissions: ALL_PERMISSIONS,
    scopeLevel: 'global',
  },

  // ─── Tier 2: Operations Directors ────────────────────────
  {
    slug: 'DIR_USER_OPS',
    name: 'Director, User Operations',
    tier: 2,
    module: 'users',
    description: 'Oversees user management, KYC, support. Can delegate Tier 3 user roles.',
    permissions: [
      PERMISSIONS.USERS_READ, PERMISSIONS.USERS_SUSPEND, PERMISSIONS.USERS_DELETE,
      PERMISSIONS.USERS_VERIFY, PERMISSIONS.USERS_ROLE_ASSIGN, PERMISSIONS.USERS_EXPORT,
      PERMISSIONS.KYC_REVIEW, PERMISSIONS.KYC_APPROVE, PERMISSIONS.KYC_REJECT,
      PERMISSIONS.SUPPORT_TICKETS, PERMISSIONS.SUPPORT_ESCALATE,
      PERMISSIONS.AUDIT_VIEW, PERMISSIONS.DELEGATE,
    ],
    scopeLevel: 'global',
  },
  {
    slug: 'DIR_TRUST_SAFETY',
    name: 'Director, Trust & Safety',
    tier: 2,
    module: 'trust_safety',
    description: 'Oversees moderation, fraud, content safety. Can delegate Tier 3 T&S roles.',
    permissions: [
      PERMISSIONS.USERS_READ, PERMISSIONS.USERS_SUSPEND,
      PERMISSIONS.FRAUD_REVIEW, PERMISSIONS.FRAUD_FLAG, PERMISSIONS.FRAUD_BAN,
      PERMISSIONS.MODERATION_REVIEW, PERMISSIONS.MODERATION_DELETE, PERMISSIONS.MODERATION_RESTORE,
      PERMISSIONS.AUDIT_VIEW, PERMISSIONS.DELEGATE,
    ],
    scopeLevel: 'global',
  },
  {
    slug: 'DIR_SPORTS_CONTENT',
    name: 'Director, Sports Content',
    tier: 2,
    module: 'sports_content',
    description: 'Oversees sports data, news, rumors, claims, AI agent. Can delegate Tier 3 sports roles.',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.SPORTS_SYNC, PERMISSIONS.SPORTS_CREATE, PERMISSIONS.SPORTS_EDIT,
      PERMISSIONS.SPORTS_DELETE, PERMISSIONS.SPORTS_VERIFY,
      PERMISSIONS.NEWS_CREATE, PERMISSIONS.NEWS_EDIT, PERMISSIONS.NEWS_PUBLISH, PERMISSIONS.NEWS_DELETE,
      PERMISSIONS.RUMORS_CREATE, PERMISSIONS.RUMORS_EDIT, PERMISSIONS.RUMORS_PUBLISH, PERMISSIONS.RUMORS_DEBUNK,
      PERMISSIONS.CLAIMS_REVIEW, PERMISSIONS.CLAIMS_APPROVE, PERMISSIONS.CLAIMS_REJECT,
      PERMISSIONS.AI_SYNC, PERMISSIONS.AI_GENERATE, PERMISSIONS.AI_VERIFY,
      PERMISSIONS.AUDIT_VIEW, PERMISSIONS.DELEGATE,
    ],
    scopeLevel: 'global',
  },
  {
    slug: 'DIR_COMMUNITY',
    name: 'Director, Community',
    tier: 2,
    module: 'community',
    description: 'Oversees community managers, support agents. Can delegate Tier 3 community roles.',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.COMMUNITY_REVIEW, PERMISSIONS.COMMUNITY_BAN, PERMISSIONS.COMMUNITY_FEATURE,
      PERMISSIONS.SUPPORT_TICKETS, PERMISSIONS.SUPPORT_ESCALATE,
      PERMISSIONS.AUDIT_VIEW, PERMISSIONS.DELEGATE,
    ],
    scopeLevel: 'global',
  },
  {
    slug: 'DIR_PLATFORM',
    name: 'Director, Platform',
    tier: 2,
    module: 'platform',
    description: 'Oversees billing, analytics, system health. Can delegate Tier 3 platform roles.',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.BILLING_REVIEW, PERMISSIONS.BILLING_REFUND,
      PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_EXPORT,
      PERMISSIONS.HEALTH_VIEW, PERMISSIONS.AUDIT_VIEW, PERMISSIONS.DELEGATE,
    ],
    scopeLevel: 'global',
  },

  // ─── Tier 3: Specialized Admins ──────────────────────────
  {
    slug: 'ADMIN_USER',
    name: 'User Admin',
    tier: 3,
    module: 'users',
    description: 'Manages user accounts — suspend, verify, edit profile.',
    permissions: [
      PERMISSIONS.USERS_READ, PERMISSIONS.USERS_SUSPEND, PERMISSIONS.USERS_VERIFY,
      PERMISSIONS.USERS_EXPORT, PERMISSIONS.AUDIT_VIEW,
    ],
    scopeLevel: 'global',
  },
  {
    slug: 'ADMIN_KYC',
    name: 'KYC Admin',
    tier: 3,
    module: 'users',
    description: 'Reviews and approves/rejects KYC verification requests.',
    permissions: [
      PERMISSIONS.USERS_READ, PERMISSIONS.KYC_REVIEW, PERMISSIONS.KYC_APPROVE,
      PERMISSIONS.KYC_REJECT, PERMISSIONS.AUDIT_VIEW,
    ],
    scopeLevel: 'global',
  },
  {
    slug: 'ADMIN_MODERATION',
    name: 'Content Moderator',
    tier: 3,
    module: 'trust_safety',
    description: 'Reviews flagged posts/comments, deletes or restores content.',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.MODERATION_REVIEW, PERMISSIONS.MODERATION_DELETE,
      PERMISSIONS.MODERATION_RESTORE, PERMISSIONS.AUDIT_VIEW,
    ],
    scopeLevel: 'global',
  },
  {
    slug: 'ADMIN_FRAUD',
    name: 'Fraud Analyst',
    tier: 3,
    module: 'trust_safety',
    description: 'Investigates suspicious accounts, flags and bans fraudsters.',
    permissions: [
      PERMISSIONS.USERS_READ, PERMISSIONS.USERS_SUSPEND,
      PERMISSIONS.FRAUD_REVIEW, PERMISSIONS.FRAUD_FLAG, PERMISSIONS.FRAUD_BAN,
      PERMISSIONS.AUDIT_VIEW,
    ],
    scopeLevel: 'global',
  },
  {
    slug: 'ADMIN_SPORTS',
    name: 'Sports Data Admin',
    tier: 3,
    module: 'sports_content',
    description: 'Syncs sports data from external APIs, manages teams/players/coaches.',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.SPORTS_SYNC, PERMISSIONS.SPORTS_CREATE, PERMISSIONS.SPORTS_EDIT,
      PERMISSIONS.SPORTS_VERIFY,
      PERMISSIONS.AI_SYNC,
      PERMISSIONS.AUDIT_VIEW,
    ],
    scopeLevel: 'global',
  },
  {
    slug: 'ADMIN_LIVE',
    name: 'Live Content Admin',
    tier: 3,
    module: 'sports_content',
    description: 'Manages live match data, publishes real-time updates.',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.SPORTS_EDIT, PERMISSIONS.SPORTS_VERIFY,
      PERMISSIONS.NEWS_CREATE, PERMISSIONS.NEWS_EDIT, PERMISSIONS.NEWS_PUBLISH,
      PERMISSIONS.AUDIT_VIEW,
    ],
    scopeLevel: 'global',
  },
  {
    slug: 'ADMIN_COMMUNITY',
    name: 'Community Manager',
    tier: 3,
    module: 'community',
    description: 'Manages communities, features content, handles community disputes.',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.COMMUNITY_REVIEW, PERMISSIONS.COMMUNITY_FEATURE,
      PERMISSIONS.AUDIT_VIEW,
    ],
    scopeLevel: 'global',
  },
  {
    slug: 'ADMIN_SUPPORT',
    name: 'Support Agent',
    tier: 3,
    module: 'community',
    description: 'Handles user support tickets, escalates when needed.',
    permissions: [
      PERMISSIONS.USERS_READ, PERMISSIONS.SUPPORT_TICKETS, PERMISSIONS.SUPPORT_ESCALATE,
      PERMISSIONS.AUDIT_VIEW,
    ],
    scopeLevel: 'global',
  },
  {
    slug: 'ADMIN_BILLING',
    name: 'Billing Admin',
    tier: 3,
    module: 'platform',
    description: 'Reviews transactions, processes refunds, manages subscriptions.',
    permissions: [
      PERMISSIONS.USERS_READ, PERMISSIONS.BILLING_REVIEW, PERMISSIONS.BILLING_REFUND,
      PERMISSIONS.AUDIT_VIEW,
    ],
    scopeLevel: 'global',
  },
  {
    slug: 'ADMIN_ANALYTICS',
    name: 'Analytics Admin',
    tier: 3,
    module: 'platform',
    description: 'Views and exports platform analytics, monitors system health.',
    permissions: [
      PERMISSIONS.USERS_READ, PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_EXPORT,
      PERMISSIONS.HEALTH_VIEW, PERMISSIONS.AUDIT_VIEW,
    ],
    scopeLevel: 'global',
  },

  // ─── Tier 4: Regional/Language Moderators ────────────────
  {
    slug: 'MOD_REGIONAL',
    name: 'Regional Moderator',
    tier: 4,
    module: 'trust_safety',
    description: 'Moderates content in a specific region. Scoped to regionCode.',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.MODERATION_REVIEW, PERMISSIONS.MODERATION_DELETE,
      PERMISSIONS.AUDIT_VIEW,
    ],
    scopeLevel: 'regional',
  },
  {
    slug: 'MOD_LANGUAGE',
    name: 'Language Moderator',
    tier: 4,
    module: 'trust_safety',
    description: 'Moderates content in a specific language. Scoped to languageCode.',
    permissions: [
      PERMISSIONS.USERS_READ,
      PERMISSIONS.MODERATION_REVIEW, PERMISSIONS.MODERATION_DELETE,
      PERMISSIONS.AUDIT_VIEW,
    ],
    scopeLevel: 'language',
  },
  {
    slug: 'MOD_ONCALL',
    name: 'On-Call Moderator',
    tier: 4,
    module: 'trust_safety',
    description: 'Emergency moderator for after-hours escalations. Time-limited scope.',
    permissions: [
      PERMISSIONS.USERS_READ, PERMISSIONS.USERS_SUSPEND,
      PERMISSIONS.MODERATION_REVIEW, PERMISSIONS.MODERATION_DELETE,
      PERMISSIONS.AUDIT_VIEW,
    ],
    scopeLevel: 'global',
  },
];

// ─── Sidebar section → required permission ─────────────────
// Used by the dashboard layout to show/hide sidebar sections.
export const SECTION_PERMISSIONS: Record<string, string[]> = {
  '/dashboard': [], // overview — visible to all admins
  '/dashboard/users': [PERMISSIONS.USERS_READ],
  '/dashboard/sports': [PERMISSIONS.SPORTS_CREATE, PERMISSIONS.SPORTS_EDIT],
  '/dashboard/sports-data': [PERMISSIONS.SPORTS_SYNC, PERMISSIONS.SPORTS_EDIT],
  '/dashboard/ai-agent': [PERMISSIONS.AI_SYNC, PERMISSIONS.AI_GENERATE],
  '/dashboard/news': [PERMISSIONS.NEWS_CREATE, PERMISSIONS.NEWS_EDIT, PERMISSIONS.NEWS_PUBLISH],
  '/dashboard/rumors': [PERMISSIONS.RUMORS_CREATE, PERMISSIONS.RUMORS_EDIT, PERMISSIONS.RUMORS_PUBLISH],
  '/dashboard/claims': [PERMISSIONS.CLAIMS_REVIEW, PERMISSIONS.CLAIMS_APPROVE],
  '/dashboard/roles': [PERMISSIONS.USERS_ROLE_ASSIGN],
  '/dashboard/posts': [PERMISSIONS.MODERATION_REVIEW],
  '/dashboard/moderation': [PERMISSIONS.MODERATION_REVIEW],
  '/dashboard/verifications': [PERMISSIONS.KYC_REVIEW],
  '/dashboard/audit': [PERMISSIONS.AUDIT_VIEW],
};

// ─── Helper: check if user has permission ──────────────────
// In the admin app, the JWT contains the user's role string (e.g. 'ADMINISTRATOR').
// We map that to AdminRole slugs. The SUPER_ADMIN always has all permissions.
export function hasPermission(userRole: string, permission: string): boolean {
  const role = userRole.toUpperCase();
  if (role === 'SUPER_ADMIN' || role === 'ADMINISTRATOR') return true;

  const roleDef = ADMIN_ROLES.find((r) => r.slug === role);
  if (!roleDef) return false;
  return roleDef.permissions.includes(permission);
}

export function hasAnyPermission(userRole: string, permissions: string[]): boolean {
  if (permissions.length === 0) return true; // empty = visible to all
  return permissions.some((p) => hasPermission(userRole, p));
}

export function canAccessSection(userRole: string, sectionPath: string): boolean {
  const required = SECTION_PERMISSIONS[sectionPath];
  if (!required || required.length === 0) return true;
  return hasAnyPermission(userRole, required);
}
