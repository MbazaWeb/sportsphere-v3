// POST /api/sports/follow — Follow a sport (add to user's sports)
// DELETE /api/sports/follow — Unfollow a sport (remove from user's sports)
// Both endpoints update UserSport junction table AND sportsFollowing JSON
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';

// ─── POST /api/sports/follow ─────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const { sportId, sportSlug } = body as { sportId?: string; sportSlug?: string };

    if (!sportId && !sportSlug) {
      return NextResponse.json({ error: 'sportId or sportSlug is required.' }, { status: 400 });
    }

    // Resolve sport from ID or slug
    const sport = sportId
      ? await db.sport.findUnique({ where: { id: sportId } })
      : await db.sport.findUnique({ where: { slug: sportSlug } });

    if (!sport || !sport.isActive) {
      return NextResponse.json({ error: 'Sport not found.' }, { status: 404 });
    }

    // Create UserSport record (skip if already exists)
    await db.userSport.upsert({
      where: {
        userId_sportId: { userId, sportId: sport.id },
      },
      update: {},
      create: { userId, sportId: sport.id },
    });

    // Sync sportsFollowing JSON
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { sportsFollowing: true },
    });
    if (user) {
      const current = safeJsonParse<string[]>(user.sportsFollowing, []);
      if (!current.includes(sport.name)) {
        current.push(sport.name);
        await db.user.update({
          where: { id: userId },
          data: { sportsFollowing: JSON.stringify(current) },
        });
      }
    }

    return NextResponse.json({ success: true, sport: { id: sport.id, name: sport.name, slug: sport.slug, icon: sport.icon } });
  } catch (error) {
    console.error('Failed to follow sport:', error);
    return NextResponse.json({ error: 'Failed to follow sport' }, { status: 500 });
  }
}

// ─── DELETE /api/sports/follow ────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const { sportId, sportSlug } = body as { sportId?: string; sportSlug?: string };

    if (!sportId && !sportSlug) {
      return NextResponse.json({ error: 'sportId or sportSlug is required.' }, { status: 400 });
    }

    // Resolve sport from ID or slug
    const sport = sportId
      ? await db.sport.findUnique({ where: { id: sportId } })
      : await db.sport.findUnique({ where: { slug: sportSlug } });

    if (!sport) {
      return NextResponse.json({ error: 'Sport not found.' }, { status: 404 });
    }

    // Delete UserSport record
    await db.userSport.deleteMany({
      where: { userId, sportId: sport.id },
    });

    // Sync sportsFollowing JSON
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { sportsFollowing: true },
    });
    if (user) {
      const current = safeJsonParse<string[]>(user.sportsFollowing, []);
      const updated = current.filter(s => s !== sport.name);
      await db.user.update({
        where: { id: userId },
        data: { sportsFollowing: JSON.stringify(updated) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to unfollow sport:', error);
    return NextResponse.json({ error: 'Failed to unfollow sport' }, { status: 500 });
  }
}
