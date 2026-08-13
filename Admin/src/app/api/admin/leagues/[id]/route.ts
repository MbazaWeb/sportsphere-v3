import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { realtime } from '@/lib/realtime';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const league = await db.league.findUnique({
      where: { id },
      include: {
        Sport: { select: { id: true, name: true, icon: true } },
        Team: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true, logoUrl: true, city: true, country: true, shortName: true },
        },
      },
    });
    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }
    return NextResponse.json({
      ...league,
      teams: league.Team,
    });
  } catch (error) {
    console.error('Failed to fetch league:', error);
    return NextResponse.json(
      { error: 'Failed to fetch league', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const existing = await db.league.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Add / remove teams
    if (body.action === 'add_teams' && Array.isArray(body.teamIds)) {
      const teamIds = (body.teamIds as string[]).filter(Boolean);
      await db.team.updateMany({
        where: { id: { in: teamIds } },
        data: { leagueId: id, updatedAt: new Date() },
      });
      realtime.leagueUpdate(id, { id, action: 'teams_added', teamIds });
      const teams = await db.team.findMany({
        where: { leagueId: id },
        select: { id: true, name: true, logoUrl: true },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json({ ok: true, teams });
    }

    if (body.action === 'remove_team' && typeof body.teamId === 'string') {
      await db.team.updateMany({
        where: { id: body.teamId, leagueId: id },
        data: { leagueId: null, updatedAt: new Date() },
      });
      realtime.leagueUpdate(id, { id, action: 'team_removed', teamId: body.teamId });
      return NextResponse.json({ ok: true });
    }

    const allowed = [
      'name', 'country', 'countryCode', 'type', 'verified', 'createdByAI',
      'logoUrl', 'description', 'season', 'sportId', 'isActive',
    ];
    const data: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of allowed) {
      if (key in body) data[key] = body[key] === '' ? null : body[key];
    }

    if (Object.keys(data).length <= 1) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    const updated = await db.league.update({ where: { id }, data });
    realtime.leagueUpdate(id, { id, action: 'updated', league: updated });

    try {
      await db.auditLog.create({
        data: {
          actorId: auth.user.sub,
          action: 'league.update',
          module: 'sports-data',
          targetId: id,
          targetType: 'League',
          newValue: data as any,
        },
      });
    } catch { /* optional */ }

    return NextResponse.json({ ok: true, league: updated });
  } catch (error) {
    console.error('Failed to update league:', error);
    return NextResponse.json(
      { error: 'Failed to update league', detail: String(error) },
      { status: 500 }
    );
  }
}
