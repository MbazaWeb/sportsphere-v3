/**
 * Seed the RBAC AdminRole catalog and grant the bootstrap admin user
 * the SUPER_ADMIN role.
 *
 * This script mirrors the ADMIN_ROLES array in src/lib/rbac.ts.
 * It is idempotent: re-running it upserts each AdminRole row and
 * re-grants SUPER_ADMIN to the bootstrap admin user if missing.
 *
 * Run on the VPS inside /var/www/sportsphere-admin so it can reuse the
 * installed @prisma/client + .env DATABASE_URL:
 *
 *   node scripts/seed-admin-roles.mjs
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// ─── Bootstrap admin user (must match scripts/create-admin.mjs) ─────────
const BOOTSTRAP_ADMIN_EMAIL = 'admin@sportsphere.com';
const BOOTSTRAP_ADMIN_ID = '5eac93ff-36c2-4900-8da1-0de926262721';
const BOOTSTRAP_ROLE_SLUG = 'SUPER_ADMIN';

// ─── Permission catalog (mirrors src/lib/rbac.ts) ──────────────────────
const P = {
  USERS_READ: 'users.read',
  USERS_SUSPEND: 'users.suspend',
  USERS_DELETE: 'users.delete',
  USERS_VERIFY: 'users.verify',
  USERS_ROLE_ASSIGN: 'users.role_assign',
  USERS_EXPORT: 'users.export',
  KYC_REVIEW: 'kyc.review',
  KYC_APPROVE: 'kyc.approve',
  KYC_REJECT: 'kyc.reject',
  FRAUD_REVIEW: 'fraud.review',
  FRAUD_FLAG: 'fraud.flag',
  FRAUD_BAN: 'fraud.ban',
  MODERATION_REVIEW: 'moderation.review',
  MODERATION_DELETE: 'moderation.delete',
  MODERATION_RESTORE: 'moderation.restore',
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
  COMMUNITY_REVIEW: 'community.review',
  COMMUNITY_BAN: 'community.ban',
  COMMUNITY_FEATURE: 'community.feature',
  SUPPORT_TICKETS: 'support.tickets',
  SUPPORT_ESCALATE: 'support.escalate',
  BILLING_REVIEW: 'billing.review',
  BILLING_REFUND: 'billing.refund',
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
  HEALTH_VIEW: 'health.view',
  AUDIT_VIEW: 'audit.view',
  ROLES_MANAGE: 'roles.manage',
  DELEGATE: 'delegate',
};

const ALL_PERMISSIONS = Object.values(P);

// ─── ADMIN_ROLES catalog (must stay in sync with src/lib/rbac.ts) ──────
const ADMIN_ROLES = [
  // ── Tier 1: Super Admin ──
  {
    slug: 'SUPER_ADMIN',
    name: 'Super Admin',
    tier: 1,
    module: 'cross',
    description: 'Full system access. 1-2 people only. Can delegate any role.',
    permissions: ALL_PERMISSIONS,
    scopeLevel: 'global',
  },
  // ── Tier 2: Directors ──
  {
    slug: 'DIR_USER_OPS',
    name: 'Director, User Operations',
    tier: 2,
    module: 'users',
    description: 'Oversees user management, KYC, support. Can delegate Tier 3 user roles.',
    permissions: [
      P.USERS_READ, P.USERS_SUSPEND, P.USERS_DELETE,
      P.USERS_VERIFY, P.USERS_ROLE_ASSIGN, P.USERS_EXPORT,
      P.KYC_REVIEW, P.KYC_APPROVE, P.KYC_REJECT,
      P.SUPPORT_TICKETS, P.SUPPORT_ESCALATE,
      P.AUDIT_VIEW, P.DELEGATE,
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
      P.USERS_READ, P.USERS_SUSPEND,
      P.FRAUD_REVIEW, P.FRAUD_FLAG, P.FRAUD_BAN,
      P.MODERATION_REVIEW, P.MODERATION_DELETE, P.MODERATION_RESTORE,
      P.AUDIT_VIEW, P.DELEGATE,
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
      P.USERS_READ,
      P.SPORTS_SYNC, P.SPORTS_CREATE, P.SPORTS_EDIT,
      P.SPORTS_DELETE, P.SPORTS_VERIFY,
      P.NEWS_CREATE, P.NEWS_EDIT, P.NEWS_PUBLISH, P.NEWS_DELETE,
      P.RUMORS_CREATE, P.RUMORS_EDIT, P.RUMORS_PUBLISH, P.RUMORS_DEBUNK,
      P.CLAIMS_REVIEW, P.CLAIMS_APPROVE, P.CLAIMS_REJECT,
      P.AI_SYNC, P.AI_GENERATE, P.AI_VERIFY,
      P.AUDIT_VIEW, P.DELEGATE,
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
      P.USERS_READ,
      P.COMMUNITY_REVIEW, P.COMMUNITY_BAN, P.COMMUNITY_FEATURE,
      P.SUPPORT_TICKETS, P.SUPPORT_ESCALATE,
      P.AUDIT_VIEW, P.DELEGATE,
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
      P.USERS_READ,
      P.BILLING_REVIEW, P.BILLING_REFUND,
      P.ANALYTICS_VIEW, P.ANALYTICS_EXPORT,
      P.HEALTH_VIEW, P.AUDIT_VIEW, P.DELEGATE,
    ],
    scopeLevel: 'global',
  },
  // ── Tier 3: Specialists ──
  {
    slug: 'ADMIN_USER',
    name: 'User Admin',
    tier: 3,
    module: 'users',
    description: 'Manages user accounts — suspend, verify, edit profile.',
    permissions: [
      P.USERS_READ, P.USERS_SUSPEND, P.USERS_VERIFY,
      P.USERS_EXPORT, P.AUDIT_VIEW,
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
      P.USERS_READ, P.KYC_REVIEW, P.KYC_APPROVE,
      P.KYC_REJECT, P.AUDIT_VIEW,
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
      P.USERS_READ,
      P.MODERATION_REVIEW, P.MODERATION_DELETE,
      P.MODERATION_RESTORE, P.AUDIT_VIEW,
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
      P.USERS_READ, P.USERS_SUSPEND,
      P.FRAUD_REVIEW, P.FRAUD_FLAG, P.FRAUD_BAN,
      P.AUDIT_VIEW,
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
      P.USERS_READ,
      P.SPORTS_SYNC, P.SPORTS_CREATE, P.SPORTS_EDIT,
      P.SPORTS_VERIFY,
      P.AI_SYNC,
      P.AUDIT_VIEW,
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
      P.USERS_READ,
      P.SPORTS_EDIT, P.SPORTS_VERIFY,
      P.NEWS_CREATE, P.NEWS_EDIT, P.NEWS_PUBLISH,
      P.AUDIT_VIEW,
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
      P.USERS_READ,
      P.COMMUNITY_REVIEW, P.COMMUNITY_FEATURE,
      P.AUDIT_VIEW,
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
      P.USERS_READ, P.SUPPORT_TICKETS, P.SUPPORT_ESCALATE,
      P.AUDIT_VIEW,
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
      P.USERS_READ, P.BILLING_REVIEW, P.BILLING_REFUND,
      P.AUDIT_VIEW,
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
      P.USERS_READ, P.ANALYTICS_VIEW, P.ANALYTICS_EXPORT,
      P.HEALTH_VIEW, P.AUDIT_VIEW,
    ],
    scopeLevel: 'global',
  },
  // ── Tier 4: Regional/Language Moderators ──
  {
    slug: 'MOD_REGIONAL',
    name: 'Regional Moderator',
    tier: 4,
    module: 'trust_safety',
    description: 'Moderates content in a specific region. Scoped to regionCode.',
    permissions: [
      P.USERS_READ,
      P.MODERATION_REVIEW, P.MODERATION_DELETE,
      P.AUDIT_VIEW,
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
      P.USERS_READ,
      P.MODERATION_REVIEW, P.MODERATION_DELETE,
      P.AUDIT_VIEW,
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
      P.USERS_READ, P.USERS_SUSPEND,
      P.MODERATION_REVIEW, P.MODERATION_DELETE,
      P.AUDIT_VIEW,
    ],
    scopeLevel: 'global',
  },
];

async function seedAdminRoles() {
  console.log(`==> Seeding ${ADMIN_ROLES.length} AdminRole rows…`);
  let created = 0;
  let updated = 0;
  for (const role of ADMIN_ROLES) {
    const existing = await db.adminRole.findUnique({ where: { slug: role.slug } });
    const data = {
      slug: role.slug,
      name: role.name,
      tier: role.tier,
      module: role.module,
      description: role.description,
      permissions: role.permissions,
      scopeLevel: role.scopeLevel,
      isActive: true,
    };
    if (!existing) {
      await db.adminRole.create({ data });
      created++;
      console.log(`  + ${role.slug.padEnd(20)} (tier ${role.tier}, module ${role.module}) — created`);
    } else {
      await db.adminRole.update({ where: { slug: role.slug }, data });
      updated++;
      console.log(`  ✓ ${role.slug.padEnd(20)} (tier ${role.tier}, module ${role.module}) — updated`);
    }
  }
  console.log(`  → ${created} created, ${updated} updated.`);
}

async function grantBootstrapAdmin() {
  console.log(`\n==> Ensuring ${BOOTSTRAP_ADMIN_EMAIL} has ${BOOTSTRAP_ROLE_SLUG} role…`);

  // Confirm the user exists. If not, warn (don't fail — operator may run
  // scripts/create-admin.mjs first).
  const user = await db.user.findUnique({
    where: { id: BOOTSTRAP_ADMIN_ID },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) {
    console.warn(
      `  !! Bootstrap admin user not found (id=${BOOTSTRAP_ADMIN_ID}).\n` +
      `     Run scripts/create-admin.mjs first, then re-run this script.`
    );
    return;
  }
  console.log(`  Found user: ${user.email} (name="${user.name}", role="${user.role}")`);

  const existing = await db.userAdminRole.findUnique({
    where: {
      userId_adminRoleSlug: {
        userId: user.id,
        adminRoleSlug: BOOTSTRAP_ROLE_SLUG,
      },
    },
  });

  if (existing) {
    if (!existing.isActive) {
      await db.userAdminRole.update({
        where: { id: existing.id },
        data: { isActive: true, revokedAt: null, assignedById: user.id },
      });
      console.log(`  ✓ Reactivated existing ${BOOTSTRAP_ROLE_SLUG} grant (was revoked).`);
    } else {
      console.log(`  ✓ ${BOOTSTRAP_ROLE_SLUG} already granted (since ${existing.assignedAt.toISOString()}).`);
    }
    return;
  }

  const grant = await db.userAdminRole.create({
    data: {
      userId: user.id,
      adminRoleSlug: BOOTSTRAP_ROLE_SLUG,
      assignedById: user.id, // self-grant for bootstrap
      isActive: true,
      notes: 'Bootstrap grant — initial SUPER_ADMIN assigned by seed script.',
    },
  });
  console.log(`  + Granted ${BOOTSTRAP_ROLE_SLUG} (id=${grant.id}).`);

  // Also log it to the DelegationLog for auditability.
  await db.delegationLog.create({
    data: {
      actorId: user.id,
      targetUserId: user.id,
      action: 'grant',
      adminRoleSlug: BOOTSTRAP_ROLE_SLUG,
      reason: 'Bootstrap grant via scripts/seed-admin-roles.mjs',
    },
  });
  console.log(`  ✓ DelegationLog entry created.`);
}

async function main() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  SportSphere — RBAC Seed Script');
  console.log('  Catalog: ' + ADMIN_ROLES.length + ' admin roles across 4 tiers');
  console.log('════════════════════════════════════════════════════════════');

  await seedAdminRoles();
  await grantBootstrapAdmin();

  console.log('\n==> Done.');
  console.log('  Next steps:');
  console.log('    1. Sign in as admin@sportsphere.com at /login');
  console.log('    2. Visit /dashboard/delegation to grant roles to other admins');
}

main()
  .catch((err) => {
    console.error('!! seed-admin-roles failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
