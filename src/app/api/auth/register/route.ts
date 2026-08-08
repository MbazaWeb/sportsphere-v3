import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  hashPassword,
  signSession,
  buildSessionCookie,
  serializePublicUser,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE_RE = /^@?[a-zA-Z0-9_]{3,30}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      handle,
      password,
      sports = [],
      // Phase 5: Registration ONLY creates Fan accounts.
      // Role upgrades are handled through the Pro Upgrade flow (/api/roles/upgrade).
      // The 'role' field is ignored — all new registrations are Fan.
      role: _ignoredRole,
      roleData: _ignoredRoleData,
    } = body as {
      name?: string;
      email?: string;
      handle?: string;
      password?: string;
      sports?: string[];
      role?: string;
      roleData?: Record<string, string>;
    };

    // ─── Validate ─────────────────────────────────────────────
    const errors: string[] = [];
    if (!name || !String(name).trim()) errors.push('Name is required.');
    if (!email || !EMAIL_RE.test(String(email))) errors.push('A valid email is required.');
    if (!handle || !HANDLE_RE.test(String(handle))) errors.push('Handle must be 3–30 alphanumeric/underscore chars.');
    if (!password || String(password).length < 8) errors.push('Password must be at least 8 characters.');
    if (errors.length) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedHandle = String(handle).startsWith('@') ? String(handle) : `@${handle}`;

    // ─── Uniqueness check ────────────────────────────────────
    const existing = await db.user.findFirst({
      where: { OR: [{ email: normalizedEmail }, { handle: normalizedHandle }] },
      select: { email: true, handle: true },
    });
    if (existing) {
      if (existing.email === normalizedEmail) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'This handle is already taken.' }, { status: 409 });
    }

    // ─── Resolve Fan role and Casual Fan type from DB ────────
    // Self-healing: if the Role/RoleType tables haven't been seeded yet,
    // create the Fan role + Casual Fan type on the fly so registration
    // always succeeds. (Previously this fell back to the literal string
    // 'fan-default-role' which violated the foreign key constraint → P2003.)
    const fanRole = await db.role.upsert({
      where: { slug: 'fan' },
      update: {},
      create: {
        slug: 'fan',
        name: 'Fan',
        icon: '👤',
        category: 'individual',
        description: 'Sports enthusiast who follows teams, players, and communities',
        displayOrder: 1,
        isActive: true,
      },
    });
    const casualType = await db.roleType.upsert({
      where: { roleId_slug: { roleId: fanRole.id, slug: 'casual' } },
      update: {},
      create: {
        roleId: fanRole.id,
        slug: 'casual',
        name: 'Casual Fan',
        description: 'Follows sports casually for entertainment',
        displayOrder: 1,
        isActive: true,
      },
    });

    const roleId = fanRole.id;
    const roleTypeId = casualType.id;

    // ─── Resolve sports from DB ──────────────────────────────
    let sportIds: string[] = [];
    if (sports.length > 0) {
      const sportRecords = await db.sport.findMany({
        where: {
          isActive: true,
          OR: [
            { slug: { in: sports.map((s: string) => s.toLowerCase().replace(/\s+/g, '-')) } },
            { name: { in: sports } },
          ],
        },
        select: { id: true },
      });
      sportIds = sportRecords.map(s => s.id);
    }

    // ─── Create user ─────────────────────────────────────────
    const passwordHash = await hashPassword(String(password));

    const user = await db.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        handle: normalizedHandle,
        passwordHash,
        role: 'fan', // legacy slug — kept in sync
        roleId,
        roleTypeId,
        verificationStatus: 'none',
        sportsFollowing: sports,
      },
    });

    // Create UserSport records for many-to-many
    if (sportIds.length > 0) {
      await db.userSport.createMany({
        data: sportIds.map(sportId => ({
          userId: user.id,
          sportId,
        })),
        skipDuplicates: true,
      });
    }

    // ─── Issue session ───────────────────────────────────────
    const token = await signSession({
      sub: user.id,
      email: user.email,
      handle: user.handle,
      role: user.role,
      roleId: user.roleId,
      roleTypeId: user.roleTypeId,
    });

    const response = NextResponse.json(serializePublicUser(user));
    response.headers.set('Set-Cookie', buildSessionCookie(token));
    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
