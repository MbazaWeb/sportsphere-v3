import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

/**
 * GET /api/admin/delegation/roles
 *
 * Returns the catalog of available AdminRole records (all 18 RBAC roles),
 * sorted by tier then name. Public to all admins — used by the delegation
 * panel to populate the role picker dropdown.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const roles = await db.adminRole.findMany({
      where: { isActive: true },
      orderBy: [{ tier: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({
      data: roles.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        tier: r.tier,
        module: r.module,
        description: r.description,
        permissions: r.permissions,
        scopeLevel: r.scopeLevel,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch admin roles catalog:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin roles', detail: String(error) },
      { status: 500 }
    );
  }
}
