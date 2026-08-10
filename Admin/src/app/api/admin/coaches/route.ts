import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/coaches
 *   ?search=&teamId=&page=&limit=
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const teamId = searchParams.get('teamId') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nationality: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (teamId) where.teamId = teamId;

    const [total, coaches] = await Promise.all([
      db.coach.count({ where }),
      db.coach.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          team: { select: { id: true, name: true, logoUrl: true } },
          sport: { select: { id: true, name: true, icon: true } },
        },
      }),
    ]);

    const claimedIds = Array.from(
      new Set(coaches.map((c) => c.claimedById).filter(Boolean) as string[])
    );
    const claimers = claimedIds.length
      ? await db.user.findMany({
          where: { id: { in: claimedIds } },
          select: { id: true, name: true, handle: true, email: true },
        })
      : [];
    const claimerMap = new Map(claimers.map((u) => [u.id, u]));

    const data = coaches.map((c) => {
      const { claimedById, ...rest } = c as any;
      return {
        ...rest,
        claimedBy: claimedById ? claimerMap.get(claimedById) || null : null,
      };
    });

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch coaches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coaches', detail: String(error) },
      { status: 500 }
    );
  }
}
