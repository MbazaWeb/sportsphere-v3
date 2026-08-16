import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/teams/search?q=simba&type=TEAM
 *
 * Public endpoint for searching teams, players, leagues in the local DB.
 * Used by the Favorites autocomplete and any other public search UI.
 *
 * Query params:
 *  q      — search term (required, min 1 char)
 *  type   — filter by targetType: TEAM | PLAYER | COACH | LEAGUE | COMPETITION | NATIONAL_TEAM | STADIUM | SPORT
 *  limit  — max results (default 20, max 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const type = (searchParams.get('type') || '').toUpperCase();
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));

    if (!q) {
      return NextResponse.json({ results: [] });
    }

    const results: { id: string; name: string; type: string; logoUrl?: string | null; extra?: string }[] = [];

    // Search teams by name, city, country
    if (!type || type === 'TEAM' || type === 'NATIONAL_TEAM') {
      const teams = await db.team.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
                { shortName: { contains: q, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: { id: true, name: true, logoUrl: true, country: true, city: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      for (const t of teams) {
        results.push({
          id: t.id,
          name: t.name,
          type: 'TEAM',
          logoUrl: t.logoUrl,
          extra: [t.city, t.country].filter(Boolean).join(', '),
        });
      }
    }

    // Search leagues/competitions
    if (!type || type === 'LEAGUE' || type === 'COMPETITION') {
      const leagues = await db.league.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { country: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, logoUrl: true, country: true, type: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      for (const l of leagues) {
        results.push({
          id: l.id,
          name: l.name,
          type: l.type === 'league' ? 'LEAGUE' : (l.type || 'COMPETITION').toUpperCase(),
          logoUrl: l.logoUrl,
          extra: l.country || undefined,
        });
      }
    }

    // Search players
    if (!type || type === 'PLAYER') {
      const players = await db.player.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, photoUrl: true, position: true, Team: { select: { name: true } } },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      for (const p of players) {
        results.push({
          id: p.id,
          name: p.name,
          type: 'PLAYER',
          logoUrl: p.photoUrl || undefined,
          extra: [p.position, p.Team?.name].filter(Boolean).join(' · '),
        });
      }
    }

    // Search coaches
    if (!type || type === 'COACH') {
      const coaches = await db.coach.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, photoUrl: true, Team: { select: { name: true } } },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      for (const c of coaches) {
        results.push({
          id: c.id,
          name: c.name,
          type: 'COACH',
          logoUrl: c.photoUrl || undefined,
          extra: c.Team?.name || undefined,
        });
      }
    }

    // Search sports
    if (!type || type === 'SPORT') {
      const sports = await db.sport.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        select: { id: true, name: true, icon: true },
        take: limit,
      });
      for (const s of sports) {
        results.push({
          id: s.id,
          name: s.name,
          type: 'SPORT',
          logoUrl: s.icon || undefined,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Team search error:', error);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
