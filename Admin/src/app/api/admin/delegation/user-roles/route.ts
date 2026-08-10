import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

/**
 * GET /api/admin/delegation/user-roles?userId=<uuid>
 *
 * Returns all UserAdminRole records for the given user (or the current
 * admin if no userId is provided), including the AdminRole details
 * (name, tier, module, permissions) and the assigned-by user's name.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const userId = (searchParams.get('userId') || auth.user.sub).trim();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const grants = await db.userAdminRole.findMany({
      where: { userId },
      include: {
        adminRole: true,
      },
      orderBy: [{ isActive: 'desc' }, { assignedAt: 'desc' }],
    });

    // Manually join assignedBy users (assignedById is a bare string FK).
    const assignerIds = Array.from(
      new Set(grants.map((g) => g.assignedById).filter(Boolean) as string[])
    );
    const assigners = assignerIds.length
      ? await db.user.findMany({
          where: { id: { in: assignerIds } },
          select: {
            id: true,
            name: true,
            email: true,
            handle: true,
          },
        })
      : [];
    const assignerMap = new Map(assigners.map((u) => [u.id, u]));

    return NextResponse.json({
      data: grants.map((g) => ({
        id: g.id,
        userId: g.userId,
        adminRoleSlug: g.adminRoleSlug,
        assignedById: g.assignedById,
        assignedBy: g.assignedById ? assignerMap.get(g.assignedById) || null : null,
        assignedAt: g.assignedAt.toISOString(),
        revokedAt: g.revokedAt?.toISOString() || null,
        isActive: g.isActive,
        regionCode: g.regionCode,
        languageCode: g.languageCode,
        notes: g.notes,
        adminRole: {
          id: g.adminRole.id,
          slug: g.adminRole.slug,
          name: g.adminRole.name,
          tier: g.adminRole.tier,
          module: g.adminRole.module,
          description: g.adminRole.description,
          permissions: g.adminRole.permissions,
          scopeLevel: g.adminRole.scopeLevel,
        },
      })),
    });
  } catch (error) {
    console.error('Failed to fetch user admin roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user admin roles', detail: String(error) },
      { status: 500 }
    );
  }
}
