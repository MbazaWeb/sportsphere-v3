import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/adminGuard';

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
    const news = await db.newsItem.findUnique({
      where: { id },
      include: {
        sport: { select: { id: true, name: true, icon: true } },
        league: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        player: { select: { id: true, name: true } },
        coach: { select: { id: true, name: true } },
      },
    });
    if (!news) {
      return NextResponse.json({ error: 'News item not found' }, { status: 404 });
    }
    return NextResponse.json(news);
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', detail: String(error) },
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

    const existing = await db.newsItem.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
        body: true,
        summary: true,
        category: true,
        tags: true,
        imageUrl: true,
        imageOwnerName: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'News item not found' }, { status: 404 });
    }

    const allowed = [
      'title', 'body', 'summary', 'status', 'category', 'tags',
      'imageUrl', 'imageOwnerName', 'imageOwnerUrl',
      'sportId', 'leagueId', 'teamId', 'playerId', 'coachId',
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    // Auto-set publishedAt when status changes to 'published' and was null
    if (data.status === 'published' && !existing.publishedAt) {
      data.publishedAt = new Date();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    const updated = await db.newsItem.update({ where: { id }, data });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'news.update',
        module: 'news',
        targetId: id,
        targetType: 'NewsItem',
        oldValue: existing as any,
        newValue: data as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update news:', error);
    return NextResponse.json(
      { error: 'Failed to update news', detail: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const existing = await db.newsItem.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'News item not found' }, { status: 404 });
    }

    await db.newsItem.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        actorId: auth.user.sub,
        action: 'news.delete',
        module: 'news',
        targetId: id,
        targetType: 'NewsItem',
        oldValue: existing as any,
      },
    });

    return NextResponse.json({ ok: true, deleted: id });
  } catch (error) {
    console.error('Failed to delete news:', error);
    return NextResponse.json(
      { error: 'Failed to delete news', detail: String(error) },
      { status: 500 }
    );
  }
}
