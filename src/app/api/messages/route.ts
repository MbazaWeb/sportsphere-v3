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
      return NextResponse.json([]);
    }

    // Get all conversations for this user
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

    // Group by conversation partner
    const conversations = new Map<string, {
      partnerId: string;
      partnerName: string;
      partnerAvatar: string;
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
          partnerAvatar: partner.avatarInitials || partner.name.slice(0, 2).toUpperCase(),
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
