import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  handle: true,
  avatarUrl: true,
  avatarInitials: true,
  role: true,
  verificationStatus: true,
  isVerified: true,
  bio: true,
  location: true,
  coverGradient: true,
  followerCount: true,
  followingCount: true,
  postCount: true,
  sportsFollowing: true,
  roleData: true,
  registeredAt: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    // Read authenticated user from proxy-set header (NOT a query param).
    const targetUserId = request.headers.get('x-user-id');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const sentMessages = await db.message.findMany({
      where: { senderId: targetUserId },
      select: {
        id: true,
        content: true,
        isRead: true,
        createdAt: true,
        receiver: { select: USER_SELECT },
        sender: { select: USER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
    });

    const receivedMessages = await db.message.findMany({
      where: { receiverId: targetUserId },
      select: {
        id: true,
        content: true,
        isRead: true,
        createdAt: true,
        sender: { select: USER_SELECT },
        receiver: { select: USER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by conversation partner
    const conversations = new Map<string, {
      partnerId: string;
      partnerName: string;
      partnerHandle: string;
      partnerAvatar: string;
      isVerified: boolean;
      lastMessage: string;
      lastTime: string;
      unread: number;
    }>();

    const processMessage = (msg: typeof sentMessages[number], isSender: boolean) => {
      const partner = isSender ? msg.receiver : msg.sender;
      if (!partner) return;

      const key = partner.id;
      const existing = conversations.get(key);

      if (!existing) {
        conversations.set(key, {
          partnerId: partner.id,
          partnerName: partner.name,
          partnerHandle: partner.handle,
          partnerAvatar: partner.avatarInitials || partner.name.slice(0, 2).toUpperCase(),
          isVerified: partner.isVerified,
          lastMessage: msg.content,
          lastTime: msg.createdAt.toISOString(),
          unread: isSender ? 0 : (msg.isRead ? 0 : 1),
        });
      }
    };

    sentMessages.forEach((m) => processMessage(m, true));
    receivedMessages.forEach((m) => processMessage(m, false));

    const result = Array.from(conversations.values()).sort(
      (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
