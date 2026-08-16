/**
 * Create or update the SportSphere admin user.
 *
 * Runs on the VPS inside /var/www/sportsphere-admin so it can reuse the
 * installed @prisma/client + bcryptjs + the .env DATABASE_URL.
 *
 * Idempotent: if admin@sportsphere.com already exists, it will be promoted
 * to ADMINISTRATOR and its password reset to the one provided.
 *
 * Usage:
 *   node scripts/create-admin.mjs
 */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const EMAIL = 'admin@sportsphere.com';
const HANDLE = '@admin';
const NAME = 'SportSphere Admin';
const PASSWORD = 'Sport123!';
const ROLE_SLUG = 'ADMINISTRATOR';

const db = new PrismaClient();

async function main() {
  console.log('==> Ensuring ADMINISTRATOR role exists…');
  // Try by slug first; if that fails, try by name; if neither exists, create.
  let adminRole = await db.role.findUnique({ where: { slug: ROLE_SLUG } });
  if (!adminRole) {
    // Maybe a role with this name exists under a different slug
    adminRole = await db.role.findFirst({ where: { name: 'Administrator' } });
  }
  if (!adminRole) {
    adminRole = await db.role.create({
      data: {
        name: 'Administrator',
        slug: ROLE_SLUG,
        description: 'Full system administrator — can manage users, sports, roles, and content.',
        icon: '🛡️',
        category: 'admin',
        displayOrder: 999,
        isActive: true,
      },
    });
    console.log(`  Created Role: ${adminRole.id} (slug=${adminRole.slug})`);
  } else {
    console.log(`  Found existing Role: ${adminRole.id} (slug=${adminRole.slug}, name=${adminRole.name})`);
    // Ensure it's marked active + admin category
    if (adminRole.category !== 'admin' || !adminRole.isActive) {
      adminRole = await db.role.update({
        where: { id: adminRole.id },
        data: { category: 'admin', isActive: true },
      });
      console.log('  Promoted existing role to category=admin, isActive=true');
    }
  }

  // Find or create a RoleType under that role
  let adminRoleType = await db.roleType.findFirst({
    where: { roleId: adminRole.id, slug: 'admin-full' },
  });
  if (!adminRoleType) {
    // Fall back to ANY role type under this role
    adminRoleType = await db.roleType.findFirst({
      where: { roleId: adminRole.id },
    });
  }
  if (!adminRoleType) {
    adminRoleType = await db.roleType.create({
      data: {
        roleId: adminRole.id,
        name: 'Full Access',
        slug: 'admin-full',
        description: 'Full unrestricted admin access',
        requirements: [],
        displayOrder: 1,
        isActive: true,
      },
    });
    console.log(`  Created RoleType: ${adminRoleType.id}`);
  } else {
    console.log(`  Found existing RoleType: ${adminRoleType.id} (slug=${adminRoleType.slug})`);
  }

  console.log(`\n==> Hashing password with bcrypt (10 rounds)…`);
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  console.log('  Password hashed.');

  console.log(`\n==> Upserting user ${EMAIL}…`);
  const user = await db.user.upsert({
    where: { email: EMAIL },
    create: {
      email: EMAIL,
      handle: HANDLE,
      name: NAME,
      passwordHash,
      role: ROLE_SLUG,        // legacy slug — what the admin guard actually checks
      roleId: adminRole.id,
      roleTypeId: adminRoleType.id,
      emailVerified: true,
      isVerified: true,
      verificationStatus: 'verified',
      avatarInitials: 'SA',
    },
    update: {
      handle: HANDLE,
      name: NAME,
      passwordHash,
      role: ROLE_SLUG,        // promote to admin if they existed as a fan
      roleId: adminRole.id,
      roleTypeId: adminRoleType.id,
      emailVerified: true,
      isVerified: true,
      verificationStatus: 'verified',
    },
    select: {
      id: true,
      email: true,
      handle: true,
      name: true,
      role: true,
      roleId: true,
      roleTypeId: true,
      emailVerified: true,
      isVerified: true,
    },
  });

  console.log('\n==> User ready:');
  console.log(JSON.stringify(user, null, 2));

  // Sanity-check: bcrypt.compare
  const ok = await bcrypt.compare(PASSWORD, passwordHash);
  console.log(`\n==> bcrypt.compare('${PASSWORD}', hash) => ${ok ? 'OK ✓' : 'FAIL ✗'}`);

  // Sanity-check: admin role gate (mirrors src/app/api/auth/login/route.ts)
  const roleUpper = (user.role || '').toUpperCase();
  const isAdmin =
    roleUpper === 'ADMINISTRATOR' ||
    roleUpper === 'ADMIN' ||
    roleUpper.includes('ADMIN');
  console.log(`==> isAdmin gate check => ${isAdmin ? 'PASS ✓' : 'FAIL ✗'}`);

  if (ok && isAdmin) {
    console.log('\n============================================================');
    console.log('  Admin user ready. You can now sign in at:');
    console.log('    http://104.152.50.173:3003/login');
    console.log(`  Email:    ${EMAIL}`);
    console.log(`  Password: ${PASSWORD}`);
    console.log('============================================================');
  } else {
    console.log('\n!! Something went wrong — see diagnostics above.');
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error('!! create-admin failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
