import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/users/top — top accounts by follower count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20);

    const users = await db.user.findMany({
      where: { followerCount: { gt: 0 } },
      orderBy: { followerCount: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        handle: true,
        role: true,
        avatarUrl: true,
        isVerified: true,
        isPro: true,
        followerCount: true,
        fanCount: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Top users error:', error);
    return NextResponse.json([]);
  }
}
