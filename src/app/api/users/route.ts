import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const handle = searchParams.get('handle');

    if (handle) {
      const user = await db.user.findUnique({
        where: { handle },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        ...user,
        roleData: JSON.parse(user.roleData),
        sportsFollowing: JSON.parse(user.sportsFollowing),
      });
    }

    const users = await db.user.findMany({
      take: 50,
      orderBy: { followerCount: 'desc' },
    });

    const parsed = users.map((u) => ({
      ...u,
      roleData: JSON.parse(u.roleData),
      sportsFollowing: JSON.parse(u.sportsFollowing),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
