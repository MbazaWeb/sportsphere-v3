import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serializePublicUser } from '@/lib/auth';
import { USER_SELECT } from '@/lib/db-selects';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const handle = searchParams.get('handle');
    const q = searchParams.get('q')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (handle) {
      const user = await db.user.findUnique({ where: { handle }, select: USER_SELECT });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      return NextResponse.json(serializePublicUser(user));
    }

    if (q) {
      const users = await db.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { handle: { contains: q, mode: 'insensitive' } },
            { bio: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { followerCount: 'desc' },
        select: USER_SELECT,
      });
      return NextResponse.json(users.map(serializePublicUser));
    }

    const users = await db.user.findMany({
      take: limit,
      orderBy: { followerCount: 'desc' },
      select: USER_SELECT,
    });
    return NextResponse.json(users.map(serializePublicUser));
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
