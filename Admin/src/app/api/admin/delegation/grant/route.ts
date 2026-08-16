import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

/**
 * POST /api/admin/delegation/grant
 *
 * Body: { targetUserId, adminRoleSlug, regionCode?, languageCode?, notes? }
 *
 * Grants an admin role to a user. The actor must have the 'delegate'
 * permission and may only grant roles within their own module
 * (or be SUPER_ADMIN, who can grant anything).
 *
 * Writes 3 records:
 *   1. UserAdminRole  — the grant itself
 *   2. DelegationLog  — audit trail
 *   3. AuditLog       — general admin audit trail
 */
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, 'delegate');
  if (!auth.authorized) return auth.response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      targetUserId?: string;
      adminRoleSlug?: string;
      regionCode?: string | null;
      languageCode?: string | null;
      notes?: string | null;
    };

    const targetUserId = (body.targetUserId || '').trim();
    const adminRoleSlug = (body.adminRoleSlug || '').trim().toUpperCase();

    if (!targetUserId || !adminRoleSlug) {
      return NextResponse.json(
        { error: 'targetUserId and adminRoleSlug are required' },
        { status: 400 }
      );
    }

    // ─── Fetch the role definition ───────────────────────────
    const role = await db.adminRole.findUnique({
      where: { slug: adminRoleSlug },
    });
    if (!role || !role.isActive) {
      return NextResponse.json(
        { error: `Unknown admin role slug: ${adminRoleSlug}` },
        { status: 404 }
      );
    }

    // ─── Fetch the target user ───────────────────────────────
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        handle: true,
        role: true,
        isVerified: true,
      },
    });
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // ─── Authorization: can the actor grant THIS role? ───────
    const actorRole = (auth.user.role || '').toUpperCase();
    const isSuperAdmin =
      actorRole === 'SUPER_ADMIN' || actorRole === 'ADMINISTRATOR';

    if (!isSuperAdmin) {
      // Rule 1: Only SUPER_ADMIN can grant SUPER_ADMIN
      if (role.tier === 1) {
        return NextResponse.json(
          {
            error:
              'Forbidden: only SUPER_ADMIN can grant the SUPER_ADMIN role',
          },
          { status: 403 }
        );
      }
      // Rule 2: Directors can only grant roles in their own module
      //         AND only Tier 3 or Tier 4 roles (not other directors).
      if (role.tier === 2) {
        return NextResponse.json(
          {
            error:
              'Forbidden: directors cannot grant other director roles — only SUPER_ADMIN can',
          },
          { status: 403 }
        );
      }
      // Find the actor's AdminRole definition to read their module.
      const actorRoleDef = await db.adminRole.findUnique({
        where: { slug: actorRole },
      });
      if (!actorRoleDef) {
        return NextResponse.json(
          {
            error: `Forbidden: actor role '${actorRole}' is not in the AdminRole catalog`,
          },
          { status: 403 }
        );
      }
      if (actorRoleDef.module !== role.module) {
        return NextResponse.json(
          {
            error: `Forbidden: you can only grant roles in your own module ('${actorRoleDef.module}'). '${role.slug}' belongs to module '${role.module}'.`,
          },
          { status: 403 }
        );
      }
    }

    // ─── Scope validation (Tier 4 regional/language mods) ────
    let regionCode: string | null = body.regionCode ? body.regionCode.trim().toUpperCase() : null;
    let languageCode: string | null = body.languageCode ? body.languageCode.trim().toLowerCase() : null;
    if (role.scopeLevel === 'regional' && !regionCode) {
      // Don't fail — just warn via notes. The grant is global if no region.
    }
    if (role.scopeLevel !== 'regional') regionCode = null;
    if (role.scopeLevel !== 'language') languageCode = null;

    // ─── Uniqueness check (userId, adminRoleSlug) ────────────
    const existing = await db.userAdminRole.findUnique({
      where: {
        userId_adminRoleSlug: {
          userId: targetUserId,
          adminRoleSlug,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: 'Conflict: user already holds this admin role',
          existingGrant: {
            id: existing.id,
            isActive: existing.isActive,
            assignedAt: existing.assignedAt.toISOString(),
            revokedAt: existing.revokedAt?.toISOString() || null,
          },
        },
        { status: 409 }
      );
    }

    // ─── Create the grant + logs in a transaction ────────────
    const grant = await db.$transaction(async (tx) => {
      const g = await tx.userAdminRole.create({
        data: {
          userId: targetUserId,
          adminRoleSlug,
          assignedById: auth.user.sub,
          isActive: true,
          regionCode,
          languageCode,
          notes: body.notes ? body.notes.trim() : null,
        },
      });

      await tx.delegationLog.create({
        data: {
          actorId: auth.user.sub,
          targetUserId,
          action: 'grant',
          adminRoleSlug,
          reason: body.notes ? body.notes.trim() : null,
          regionCode,
          languageCode,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: auth.user.sub,
          action: 'role.grant',
          module: 'delegation',
          targetId: targetUserId,
          targetType: 'User',
          oldValue: {} as any,
          newValue: {
            adminRoleSlug,
            regionCode,
            languageCode,
            userAdminRoleId: g.id,
            targetUserName: targetUser.name,
            targetUserEmail: targetUser.email,
          } as any,
        },
      });

      return g;
    });

    return NextResponse.json({
      ok: true,
      grant: {
        id: grant.id,
        userId: grant.userId,
        adminRoleSlug: grant.adminRoleSlug,
        assignedAt: grant.assignedAt.toISOString(),
        regionCode: grant.regionCode,
        languageCode: grant.languageCode,
        notes: grant.notes,
      },
    });
  } catch (error) {
    console.error('Failed to grant admin role:', error);
    return NextResponse.json(
      { error: 'Failed to grant admin role', detail: String(error) },
      { status: 500 }
    );
  }
}
