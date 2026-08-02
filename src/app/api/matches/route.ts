import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const group = searchParams.get('group');
    const continent = searchParams.get('continent');
    const country = searchParams.get('country');
    const league = searchParams.get('league');

    const where: Record<string, unknown> = {};

    if (status) {
      if (status === 'live') {
        where.status = { in: ['live', 'ht'] };
      } else {
        where.status = status;
      }
    }

    if (group) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 3600000);

      switch (group) {
        case 'today':
          // Show today's matches regardless of status — a match that
          // kicked off at 17:30 and is live at 18:15 should still appear.
          where.kickoffAt = { gte: today, lt: tomorrow };
          where.status = { in: ['upcoming', 'live', 'ht', 'ft'] };
          break;
        case 'upcoming':
          where.status = 'upcoming';
          break;
        case 'results':
          where.status = 'ft';
          break;
      }
    }

    if (continent && continent !== 'All') {
      where.continent = continent;
    }
    if (country && country !== 'All') {
      where.country = country;
    }
    if (league && league !== 'All') {
      where.league = league;
    }

    const matches = await db.match.findMany({
      where,
      orderBy: { kickoffAt: 'asc' },
      take: 50,
    });

    const parsed = matches.map((m) => ({
      ...m,
      events: safeJsonParse(m.events, []),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Matches API error:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
