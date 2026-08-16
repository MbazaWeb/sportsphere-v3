import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

/**
 * GET /api/admin/delegation/logs?limit=50
 *
 * Returns recent DelegationLog entries, newest first, with the
 * actor and target user's name + email joined manually (no FK
 * relation declared on DelegationLog).
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(limitParam || 50, 1), 200);

    const logs = await db.delegationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Manual join — DelegationLog has no Prisma relation to User.
    const userIds = Array.from(
      new Set(
        logs.flatMap((l) => [l.actorId, l.targetUserId]).filter(Boolean)
      )
    );
    const users = userIds.length
      ? await db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, handle: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Also resolve adminRole names (slug → display name) so the UI doesn't
    // have to fetch the catalog separately.
    const slugs = Array.from(new Set(logs.map((l) => l.adminRoleSlug)));
    const roles = slugs.length
      ? await db.adminRole.findMany({
          where: { slug: { in: slugs } },
          select: { slug: true, name: true, tier: true, module: true },
        })
      : [];
    const roleMap = new Map(roles.map((r) => [r.slug, r]));

    return NextResponse.json({
      data: logs.map((l) => ({
        id: l.id,
        actorId: l.actorId,
        actor: userMap.get(l.actorId) || null,
        targetUserId: l.targetUserId,
        targetUser: userMap.get(l.targetUserId) || null,
        action: l.action,
        adminRoleSlug: l.adminRoleSlug,
        adminRole: roleMap.get(l.adminRoleSlug) || null,
        reason: l.reason,
        regionCode: l.regionCode,
        languageCode: l.languageCode,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch delegation logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delegation logs', detail: String(error) },
      { status: 500 }
    );
  }
}
