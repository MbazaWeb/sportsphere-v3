import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const posts = await db.post.findMany({
      where: {
        postType: { in: ['video', 'spotlight'] },
      },
      include: {
        user: true,
      },
      orderBy: { likeCount: 'desc' },
      take: 20,
    });

    // Parse JSON string fields
    const parsed = posts.map((post) => ({
      ...post,
      mediaUrls: JSON.parse(post.mediaUrls),
      user: {
        ...post.user,
        roleData: JSON.parse(post.user.roleData),
        sportsFollowing: JSON.parse(post.user.sportsFollowing),
      },
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Spotlight API error:', error);
    return NextResponse.json({ error: 'Failed to fetch spotlight items' }, { status: 500 });
  }
}
