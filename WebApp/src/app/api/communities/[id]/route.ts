import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import { safeJsonParse } from '@/lib/json';

export const dynamic = 'force-dynamic';

// GET /api/communities/:id — community detail + feed
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromRequest(request).catch(() => null);
    const { id } = params;

    const community = await db.community.findUnique({
      where: { id },
      select: {
        id: true, name: true, description: true, topic: true,
        memberCount: true, createdAt: true,
        createdBy: { select: { id: true, name: true, handle: true, avatarUrl: true, role: true } },
      },
    });
    if (!community) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Check membership
    let isMember = false;
    if (userId) {
      const m = await db.communityMember.findFirst({ where: { communityId: id, userId } });
      isMember = !!m;
    }

    // Get community posts (posts tagged to this community)
    const posts = await db.post.findMany({
      where: { communityId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true, content: true, postType: true, mediaUrls: true,
        createdAt: true, likeCount: true, commentCount: true, shareCount: true,
        user: { select: { id: true, name: true, handle: true, avatarUrl: true, isVerified: true, role: true } },
      },
    });

    return NextResponse.json({
      ...community,
      isMember,
      posts: posts.map(p => ({
        ...p,
        mediaUrls: safeJsonParse(p.mediaUrls, []),
      })),
    });
  } catch (e) {
    console.error('Community detail error:', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
