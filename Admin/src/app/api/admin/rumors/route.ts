import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { slugify } from '@/lib/sports-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/rumors
 *   ?status=&createdByAI=&page=&limit=
 *
 * POST /api/admin/rumors
 *   Manual rumor creation.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const createdByAI = searchParams.get('createdByAI');
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));

    const where: any = {};
    if (status) where.status = status;
    if (createdByAI === 'true') where.createdByAI = true;
    if (createdByAI === 'false') where.createdByAI = false;

    const [total, rumors] = await Promise.all([
      db.rumor.count({ where }),
      db.rumor.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sport: { select: { id: true, name: true, icon: true } },
          league: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
          player: { select: { id: true, name: true } },
          coach: { select: { id: true, name: true } },
        },
      }),
    ]);

    return NextResponse.json({ data: rumors, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch rumors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rumors', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      body?: string;
      credibility?: number;
      tags?: string[];
      status?: string;
      sportId?: string;
      leagueId?: string;
      teamId?: string;
      playerId?: string;
      coachId?: string;
      externalUrl?: string;
    };

    const title = (body.title || '').trim();
    const bodyText = (body.body || '').trim();
    if (!title || !bodyText) {
      return NextResponse.json(
        { error: 'Title and body are required.' },
        { status: 400 }
      );
    }

    let slug = slugify(title);
    if (!slug) slug = `rumor-${Date.now()}`;
    let existing = await db.rumor.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const status = body.status || 'draft';
    const credibility =
      typeof body.credibility === 'number'
        ? Math.max(0, Math.min(100, Math.round(body.credibility)))
        : 50;

    const data: any = {
      title,
      slug,
      body: bodyText,
      source: 'manual',
      credibility,
      tags: body.tags || [],
      sportId: body.sportId || null,
      leagueId: body.leagueId || null,
      teamId: body.teamId || null,
      playerId: body.playerId || null,
      coachId: body.coachId || null,
      createdByAI: false,
      authorId: auth.user.sub,
      status,
      publishedAt: status === 'published' ? new Date() : null,
      externalUrl: body.externalUrl || null,
    };

    const created = await db.rumor.create({ data });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'rumor.create',
        module: 'rumors',
        targetId: created.id,
        targetType: 'Rumor',
        newValue: data as any,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create rumor:', error);
    return NextResponse.json(
      { error: 'Failed to create rumor', detail: String(error) },
      { status: 500 }
    );
  }
}
