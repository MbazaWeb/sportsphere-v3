import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

/**
 * POST /api/admin/delegation/revoke
 *
 * Body: { userAdminRoleId }
 *
 * Revokes a UserAdminRole grant. The actor must have the 'delegate'
 * permission and may only revoke grants whose AdminRole is in their
 * own module (or be SUPER_ADMIN, who can revoke anything).
 *
 * Sets isActive=false, revokedAt=now() — does NOT delete the row
 * (preserves audit history). Writes DelegationLog + AuditLog entries.
 */
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, 'delegate');
  if (!auth.authorized) return auth.response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      userAdminRoleId?: string;
      reason?: string | null;
    };

    const userAdminRoleId = (body.userAdminRoleId || '').trim();
    if (!userAdminRoleId) {
      return NextResponse.json(
        { error: 'userAdminRoleId is required' },
        { status: 400 }
      );
    }

    const grant = await db.userAdminRole.findUnique({
      where: { id: userAdminRoleId },
      include: { AdminRole: true },
    });
    if (!grant) {
      return NextResponse.json(
        { error: 'UserAdminRole grant not found' },
        { status: 404 }
      );
    }
    if (!grant.isActive) {
      return NextResponse.json(
        {
          error: 'Conflict: this grant is already revoked',
          revokedAt: grant.revokedAt?.toISOString() || null,
        },
        { status: 409 }
      );
    }

    // ─── Authorization: can the actor revoke THIS grant? ─────
    const actorRole = (auth.user.role || '').toUpperCase();
    const isSuperAdmin =
      actorRole === 'SUPER_ADMIN' || actorRole === 'ADMINISTRATOR';

    if (!isSuperAdmin) {
      // Directors can only revoke grants whose AdminRole is in their own module.
      if (grant.AdminRole.tier === 1) {
        return NextResponse.json(
          { error: 'Forbidden: only SUPER_ADMIN can revoke the SUPER_ADMIN role' },
          { status: 403 }
        );
      }
      if (grant.AdminRole.tier === 2) {
        return NextResponse.json(
          {
            error:
              'Forbidden: directors cannot revoke other director roles — only SUPER_ADMIN can',
          },
          { status: 403 }
        );
      }
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
      if (actorRoleDef.module !== grant.AdminRole.module) {
        return NextResponse.json(
          {
            error: `Forbidden: you can only revoke roles in your own module ('${actorRoleDef.module}'). '${grant.AdminRole.slug}' belongs to module '${grant.AdminRole.module}'.`,
          },
          { status: 403 }
        );
      }
    }

    // ─── Perform the revoke + logs in a transaction ──────────
    const now = new Date();
    await db.$transaction(async (tx) => {
      await tx.userAdminRole.update({
        where: { id: userAdminRoleId },
        data: {
          isActive: false,
          revokedAt: now,
        },
      });

      await tx.delegationLog.create({
        data: {
          actorId: auth.user.sub,
          targetUserId: grant.userId,
          action: 'revoke',
          adminRoleSlug: grant.adminRoleSlug,
          reason: body.reason ? body.reason.trim() : null,
          regionCode: grant.regionCode,
          languageCode: grant.languageCode,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: auth.user.sub,
          action: 'role.revoke',
          module: 'delegation',
          targetId: grant.userId,
          targetType: 'User',
          oldValue: {
            adminRoleSlug: grant.adminRoleSlug,
            userAdminRoleId: grant.id,
          } as any,
          newValue: {
            adminRoleSlug: grant.adminRoleSlug,
            userAdminRoleId: grant.id,
            revokedAt: now.toISOString(),
          } as any,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      revokedAt: now.toISOString(),
      userAdminRoleId,
    });
  } catch (error) {
    console.error('Failed to revoke admin role:', error);
    return NextResponse.json(
      { error: 'Failed to revoke admin role', detail: String(error) },
      { status: 500 }
    );
  }
}
