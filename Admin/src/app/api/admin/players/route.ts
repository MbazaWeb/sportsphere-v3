import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/players
 *   ?search=&teamId=&verified=&createdByAI=&page=&limit=
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const teamId = searchParams.get('teamId') || '';
    const verified = searchParams.get('verified');
    const createdByAI = searchParams.get('createdByAI');
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nationality: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (teamId) where.teamId = teamId;
    if (verified === 'true') where.verified = true;
    if (verified === 'false') where.verified = false;
    if (createdByAI === 'true') where.createdByAI = true;
    if (createdByAI === 'false') where.createdByAI = false;

    const [total, players] = await Promise.all([
      db.player.count({ where }),
      db.player.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          Team: { select: { id: true, name: true, logoUrl: true } },
          Sport: { select: { id: true, name: true, icon: true } },
        },
      }),
    ]);

    const claimedIds = Array.from(
      new Set(players.map((p) => p.claimedById).filter(Boolean) as string[])
    );
    const claimers = claimedIds.length
      ? await db.user.findMany({
          where: { id: { in: claimedIds } },
          select: { id: true, name: true, handle: true, email: true },
        })
      : [];
    const claimerMap = new Map(claimers.map((u) => [u.id, u]));

    const data = players.map((p) => {
      const { claimedById, ...rest } = p as any;
      return {
        ...rest,
        claimedBy: claimedById ? claimerMap.get(claimedById) || null : null,
      };
    });

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players', detail: String(error) },
      { status: 500 }
    );
  }
}
