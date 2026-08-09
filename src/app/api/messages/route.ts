import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safeJsonParse } from '@/lib/json';
import { USER_SELECT } from '@/lib/db-selects';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const payload = await verifySession(token);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    const targetUserId = payload.sub;

    const sentMessages = await db.message.findMany({
      where: { senderId: targetUserId },
      select: {
        id: true, content: true, isRead: true, createdAt: true,
        receiver: { select: USER_SELECT },
        sender: { select: USER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
    });

    const receivedMessages = await db.message.findMany({
      where: { receiverId: targetUserId },
      select: {
        id: true, content: true, isRead: true, createdAt: true,
        sender: { select: USER_SELECT },
        receiver: { select: USER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
    });

    const conversations = new Map<string, {
      partnerId: string; partnerName: string; partnerHandle: string;
      partnerAvatar: string; isVerified: boolean; lastMessage: string;
      lastTime: string; unread: number; sportsFollowing: unknown; roleData: unknown;
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
          sportsFollowing: safeJsonParse(partner.sportsFollowing, []),
          roleData: safeJsonParse(partner.roleData, {}),
        });
      }
    };

    sentMessages.forEach((m: typeof sentMessages[number]) => processMessage(m, true));
    receivedMessages.forEach((m: typeof receivedMessages[number]) => processMessage(m, false));

    const result = Array.from(conversations.values()).sort(
      (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const payload = await verifySession(token);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    const senderId = payload.sub;

    const { recipientId, content } = await request.json();
    if (!recipientId || !content || !String(content).trim()) {
      return NextResponse.json({ error: 'recipientId and content are required.' }, { status: 400 });
    }
    if (recipientId === senderId) {
      return NextResponse.json({ error: 'Cannot send message to yourself.' }, { status: 400 });
    }

    const recipient = await db.user.findUnique({ where: { id: String(recipientId) } });
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found.' }, { status: 404 });
    }

    const message = await db.message.create({
      data: { senderId, receiverId: String(recipientId), content: String(content).trim() },
      select: {
        id: true, content: true, isRead: true, createdAt: true,
        sender: { select: USER_SELECT },
        receiver: { select: USER_SELECT },
      },
    });

    return NextResponse.json({
      id: message.id, content: message.content,
      isRead: message.isRead, createdAt: message.createdAt,
      sender: { ...message.sender, roleData: safeJsonParse(message.sender.roleData, {}), sportsFollowing: safeJsonParse(message.sender.sportsFollowing, []) },
      receiver: { ...message.receiver, roleData: safeJsonParse(message.receiver.roleData, {}), sportsFollowing: safeJsonParse(message.receiver.sportsFollowing, []) },
    }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
  }
}
