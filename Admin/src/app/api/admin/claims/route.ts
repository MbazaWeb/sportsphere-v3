import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/claims
 *   ?status=&profileType=&page=&limit=
 *   Paginated ClaimRequest list including user (id, name, email, handle) and
 *   profile name. Order by submittedAt desc.
 *
 * NOTE: ClaimRequest stores userId + reviewerId as raw strings (no Prisma
 * relation to User), so we manually join after fetching.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const profileType = searchParams.get('profileType') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));

    const where: any = {};
    if (status) where.status = status;
    if (profileType) where.profileType = profileType;

    const [total, claims] = await Promise.all([
      db.claimRequest.count({ where }),
      db.claimRequest.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Manual join for user + reviewer
    const userIds = Array.from(
      new Set(
        claims
          .flatMap((c) => [c.userId, c.reviewerId])
          .filter(Boolean) as string[]
      )
    );
    const users = userIds.length
      ? await db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, handle: true, avatarUrl: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = claims.map((c) => ({
      ...c,
      user: userMap.get(c.userId) || null,
      reviewer: c.reviewerId ? userMap.get(c.reviewerId) || null : null,
    }));

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch claims:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claims', detail: String(error) },
      { status: 500 }
    );
  }
}
