import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

/**
 * GET /api/admin/delegation/search-users?q=<query>
 *
 * Searches users by name, email, or handle. Returns up to 20 results.
 * Used by the delegation panel to find users to assign roles to.
 *
 * Response: { data: [{ id, name, email, handle, role, isVerified }] }
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    if (q.length < 2) {
      return NextResponse.json({ data: [] });
    }

    // Use Prisma's case-insensitive contains (PostgreSQL).
    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { handle: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        handle: true,
        role: true,
        isVerified: true,
      },
      take: 20,
      orderBy: [{ isVerified: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json({
      data: users.map((u) => ({
        ...u,
        isVerified: !!u.isVerified,
      })),
    });
  } catch (error) {
    console.error('Failed to search users for delegation:', error);
    return NextResponse.json(
      { error: 'Failed to search users', detail: String(error) },
      { status: 500 }
    );
  }
}
