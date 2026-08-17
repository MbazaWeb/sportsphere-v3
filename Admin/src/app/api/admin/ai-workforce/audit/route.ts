import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/ai-workforce/audit
 * List audit logs with pagination and filters.
 * Query params: ?agentId=&action=&limit=50&offset=0
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId') || undefined;
    const action = searchParams.get('action') || undefined;
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || '50')));
    const offset = Math.max(0, Number(searchParams.get('offset') || '0'));

    const where: Record<string, unknown> = {};
    if (agentId) where.agentId = agentId;
    if (action) where.action = action;

    const [total, logs] = await Promise.all([
      db.aIAgentAuditLog.count({ where }),
      db.aIAgentAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          agent: { select: { id: true, name: true, department: true } },
        },
      }),
    ]);

    return NextResponse.json({ data: logs, total, offset, limit });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', detail: String(error) },
      { status: 500 }
    );
  }
}
