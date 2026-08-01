import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    const comments = await db.comment.findMany({
      where: { postId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // Parse JSON string fields on user
    const parsed = comments.map((c) => ({
      ...c,
      user: {
        ...c.user,
        roleData: JSON.parse(c.user.roleData),
        sportsFollowing: JSON.parse(c.user.sportsFollowing),
      },
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Comments API error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}
