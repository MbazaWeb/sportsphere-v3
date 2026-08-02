import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serializePublicUser } from '@/lib/auth';
import { USER_SELECT } from '@/lib/db-selects';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const handle = searchParams.get('handle');

    if (handle) {
      const user = await db.user.findUnique({
        where: { handle },
        select: USER_SELECT,
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json(serializePublicUser(user));
    }

    const users = await db.user.findMany({
      take: 50,
      orderBy: { followerCount: 'desc' },
      select: USER_SELECT,
    });

    return NextResponse.json(users.map(serializePublicUser));
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
