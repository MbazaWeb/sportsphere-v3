import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';
import { slugify } from '@/lib/sports-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/news
 *   ?status=&createdByAI=&category=&page=&limit=
 *
 * POST /api/admin/news
 *   Admin manual news creation: sets source='manual', createdByAI=false,
 *   authorId from session, status from body.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const createdByAI = searchParams.get('createdByAI');
    const category = searchParams.get('category') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')));

    const where: any = {};
    if (status) where.status = status;
    if (createdByAI === 'true') where.createdByAI = true;
    if (createdByAI === 'false') where.createdByAI = false;
    if (category) where.category = category;

    const [total, news] = await Promise.all([
      db.newsItem.count({ where }),
      db.newsItem.findMany({
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

    return NextResponse.json({ data: news, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', detail: String(error) },
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
      summary?: string;
      category?: string;
      tags?: string[];
      imageUrl?: string;
      imageOwnerName?: string;
      imageOwnerUrl?: string;
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

    // Unique slug — append a random suffix if needed
    let slug = slugify(title);
    if (!slug) slug = `news-${Date.now()}`;
    let existing = await db.newsItem.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const status = body.status || 'draft';
    const data: any = {
      title,
      slug,
      body: bodyText,
      summary: body.summary || bodyText.slice(0, 200),
      category: body.category || 'general',
      tags: body.tags || [],
      imageUrl: body.imageUrl || null,
      imageOwnerName: body.imageOwnerName || null,
      imageOwnerUrl: body.imageOwnerUrl || null,
      source: 'manual',
      createdByAI: false,
      authorId: auth.user.sub,
      status,
      publishedAt: status === 'published' ? new Date() : null,
      externalUrl: body.externalUrl || null,
      sportId: body.sportId || null,
      leagueId: body.leagueId || null,
      teamId: body.teamId || null,
      playerId: body.playerId || null,
      coachId: body.coachId || null,
    };

    const created = await db.newsItem.create({ data });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'news.create',
        module: 'news',
        targetId: created.id,
        targetType: 'NewsItem',
        newValue: data as any,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Failed to create news:', error);
    return NextResponse.json(
      { error: 'Failed to create news', detail: String(error) },
      { status: 500 }
    );
  }
}
