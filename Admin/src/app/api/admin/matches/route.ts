import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/matches
 *   ?status=&date=&leagueId=&page=&limit=
 *   Paginated list of MatchProfile with team/league names.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const date = searchParams.get('date') || '';
    const leagueId = searchParams.get('leagueId') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));

    const where: any = {};
    if (status) where.status = status;
    if (leagueId) where.leagueId = leagueId;
    if (date) {
      // Filter matches on a specific UTC day
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);
      where.kickoffAt = { gte: start, lte: end };
    }

    const [total, matches] = await Promise.all([
      db.matchProfile.count({ where }),
      db.matchProfile.findMany({
        where,
        orderBy: { kickoffAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          league: { select: { id: true, name: true } },
          sport: { select: { id: true, name: true, icon: true } },
          homeTeam: { select: { id: true, name: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, logoUrl: true } },
        },
      }),
    ]);

    return NextResponse.json({ data: matches, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches', detail: String(error) },
      { status: 500 }
    );
  }
}
