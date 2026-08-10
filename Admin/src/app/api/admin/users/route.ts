import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users?q=...&role=...
 *
 * Direct DB query. Returns up to 50 users matching the search term
 * (case-insensitive name/email match) and optional role filter.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const role = searchParams.get('role');

    const where: any = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { handle: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (role && role !== 'ALL') {
      where.role = role;
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        handle: true,
        role: true,
        isVerified: true,
        verificationStatus: true,
        registeredAt: true,
        lastSeenAt: true,
        followerCount: true,
        postCount: true,
      },
      orderBy: { registeredAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch admin users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
