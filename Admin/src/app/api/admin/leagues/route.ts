import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/leagues
 *   ?search=&sportId=&page=&limit=
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sportId = searchParams.get('sportId') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (sportId) where.sportId = sportId;

    const [total, leagues] = await Promise.all([
      db.league.count({ where }),
      db.league.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sport: { select: { id: true, name: true, icon: true } },
        },
      }),
    ]);

    return NextResponse.json({ data: leagues, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch leagues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leagues', detail: String(error) },
      { status: 500 }
    );
  }
}
