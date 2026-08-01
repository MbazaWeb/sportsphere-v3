import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');

    // Default to david's user id from seed
    let targetUserId = userId || undefined;

    if (!targetUserId) {
      const david = await db.user.findUnique({ where: { handle: '@davidmbaza' } });
      targetUserId = david?.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ notifications: [], messages: [] });
    }

    // Fetch notifications
    const notifications = await db.notification.findMany({
      where: { userId: targetUserId },
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Fetch messages (conversations)
    const sentMessages = await db.message.findMany({
      where: { senderId: targetUserId },
      include: { receiver: true, sender: true },
      orderBy: { createdAt: 'desc' },
    });
    const receivedMessages = await db.message.findMany({
      where: { receiverId: targetUserId },
      include: { sender: true, receiver: true },
      orderBy: { createdAt: 'desc' },
    });

    const conversations = new Map<string, {
      partnerId: string;
      partnerName: string;
      partnerHandle: string;
      partnerAvatar: string;
      lastMessage: string;
      lastTime: string;
      unread: number;
      isVerified: boolean;
    }>();

    const processMessage = (msg: typeof sentMessages[number], isSender: boolean) => {
      const partner = isSender ? msg.receiver : msg.sender;
      if (!partner) return;
      const key = partner.id;
      if (!conversations.has(key)) {
        conversations.set(key, {
          partnerId: partner.id,
          partnerName: partner.name,
          partnerHandle: partner.handle,
          partnerAvatar: partner.avatarInitials || partner.name.slice(0, 2).toUpperCase(),
          lastMessage: msg.content,
          lastTime: msg.createdAt.toISOString(),
          unread: isSender ? 0 : (msg.isRead ? 0 : 1),
          isVerified: partner.isVerified,
        });
      }
    };

    sentMessages.forEach((m) => processMessage(m, true));
    receivedMessages.forEach((m) => processMessage(m, false));

    const messages = Array.from(conversations.values()).sort(
      (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    );

    return NextResponse.json({ notifications, messages });
  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
