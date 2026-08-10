import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/audit
 *   Query params:
 *     ?module=users       — filter by module
 *     ?action=sport.create — filter by action (substring)
 *     ?actor=<userId>    — filter by actor
 *     ?limit=50          — max 200
 *     ?offset=0          — pagination
 *   Returns audit log entries with pagination metadata.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module');
    const action = searchParams.get('action');
    const actor = searchParams.get('actor');
    const limit = Math.min(200, parseInt(searchParams.get('limit') || '50', 10));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const where: any = {};
    if (module && module !== 'ALL') where.module = module;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (actor) where.actorId = actor;

    const [entries, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          actorId: true,
          action: true,
          module: true,
          targetType: true,
          targetId: true,
          oldValue: true,
          newValue: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
      }),
      db.auditLog.count({ where }),
    ]);

    // Get unique modules for filter dropdown
    const modules = await db.auditLog.findMany({
      distinct: ['module'],
      select: { module: true },
      orderBy: { module: 'asc' },
    });

    return NextResponse.json({
      entries,
      total,
      limit,
      offset,
      modules: modules.map((m) => m.module),
    });
  } catch (error) {
    console.error('Failed to fetch audit log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit log', detail: String(error) },
      { status: 500 }
    );
  }
}
