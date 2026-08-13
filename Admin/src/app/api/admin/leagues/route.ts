import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { randomUUID } from 'crypto';
import { realtime } from '@/lib/realtime';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/leagues
 * POST /api/admin/leagues — create competition / league
 * Body: { name, type?, country?, countryCode?, season?, sportId?, logoUrl?, description?, verified?, teamIds?: string[] }
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sportId = searchParams.get('sportId') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || '20')));

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
          Sport: { select: { id: true, name: true, icon: true } },
          _count: { select: { Team: true } },
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

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 });
    }

    const id = randomUUID();
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'league';
    const slug = `${baseSlug}-${id.slice(0, 6)}`;

    const type = String(body.type || 'league').toLowerCase();
    const allowedTypes = new Set(['league', 'cup', 'tournament', 'friendly', 'international', 'competition']);
    const leagueType = allowedTypes.has(type) ? type : 'league';

    const league = await db.league.create({
      data: {
        id,
        name,
        slug,
        type: leagueType,
        country: body.country?.trim() || null,
        countryCode: body.countryCode?.trim() || null,
        season: body.season?.trim() || null,
        sportId: body.sportId || null,
        logoUrl: body.logoUrl?.trim() || null,
        description: body.description?.trim() || null,
        source: 'admin',
        verified: Boolean(body.verified),
        createdByAI: false,
        isActive: body.isActive !== false,
        metadata: {
          format: body.format || null,
          startDate: body.startDate || null,
          endDate: body.endDate || null,
        },
        updatedAt: new Date(),
      },
    });

    // Attach teams if provided
    const teamIds: string[] = Array.isArray(body.teamIds)
      ? body.teamIds.filter((x: unknown) => typeof x === 'string' && x)
      : [];
    if (teamIds.length) {
      await db.team.updateMany({
        where: { id: { in: teamIds } },
        data: { leagueId: id, updatedAt: new Date() },
      });
    }

    try {
      await db.auditLog.create({
        data: {
          actorId: auth.user.sub,
          action: 'league.create',
          module: 'sports-data',
          targetId: id,
          targetType: 'League',
          newValue: { name, teamIds } as any,
        },
      });
    } catch { /* optional */ }

    realtime.leagueUpdate(id, {
      id,
      name: league.name,
      type: league.type,
      teamCount: teamIds.length,
      action: 'created',
    });

    return NextResponse.json(
      { ok: true, league, teamsAttached: teamIds.length },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('POST /api/admin/leagues:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
