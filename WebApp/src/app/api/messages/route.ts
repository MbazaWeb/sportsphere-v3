import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safeJsonParse } from '@/lib/json';
import { USER_SELECT } from '@/lib/db-selects';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  let token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
  }
  const payload = await verifySession(token);
  return payload?.sub ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const targetUserId = await getAuthUserId(request);
    if (!targetUserId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const partnerId = request.nextUrl.searchParams.get('partnerId');

    // Thread history with a specific partner
    if (partnerId) {
      const messages = await db.message.findMany({
        where: {
          OR: [
            { senderId: targetUserId, receiverId: partnerId },
            { senderId: partnerId, receiverId: targetUserId },
          ],
        },
        select: {
          id: true,
          content: true,
          isRead: true,
          createdAt: true,
          senderId: true,
          receiverId: true,
          sender: { select: USER_SELECT },
          receiver: { select: USER_SELECT },
        },
        orderBy: { createdAt: 'asc' },
        take: 200,
      });

      // Mark incoming as read
      await db.message.updateMany({
        where: {
          senderId: partnerId,
          receiverId: targetUserId,
          isRead: false,
        },
        data: { isRead: true },
      });

      return NextResponse.json(
        messages.map((m) => ({
          id: m.id,
          content: m.content,
          isRead: m.isRead,
          createdAt: m.createdAt.toISOString(),
          senderId: m.senderId,
          receiverId: m.receiverId,
          mine: m.senderId === targetUserId,
        })),
      );
    }

    // Conversation list
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

    type Conv = {
      partnerId: string;
      partnerName: string;
      partnerHandle: string;
      partnerAvatar: string;
      partnerAvatarUrl: string | null;
      isVerified: boolean;
      lastMessage: string;
      lastTime: string;
      unread: number;
    };

    const conversations = new Map<string, Conv>();

    const processMessage = (msg: (typeof sentMessages)[number], isSender: boolean) => {
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
          partnerAvatarUrl: (partner as { avatarUrl?: string | null }).avatarUrl ?? null,
          isVerified: partner.isVerified,
          lastMessage: msg.content,
          lastTime: msg.createdAt.toISOString(),
          unread: isSender ? 0 : msg.isRead ? 0 : 1,
        });
      } else if (!isSender && !msg.isRead) {
        existing.unread += 1;
      }
    };

    sentMessages.forEach((m) => processMessage(m, true));
    receivedMessages.forEach((m) => processMessage(m, false));

    const result = Array.from(conversations.values()).sort(
      (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime(),
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const senderId = await getAuthUserId(request);
    if (!senderId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

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
      data: {
        senderId,
        receiverId: String(recipientId),
        content: String(content).trim(),
      },
      select: {
        id: true,
        content: true,
        isRead: true,
        createdAt: true,
        senderId: true,
        receiverId: true,
      },
    });

    // Best-effort in-app notification
    try {
      const { sendNotification } = await import('@/lib/notifications');
      await sendNotification({
        userId: String(recipientId),
        title: 'New message',
        body: String(content).trim().slice(0, 120),
        type: 'message',
        data: { senderId },
      });
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      id: message.id,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt.toISOString(),
      senderId: message.senderId,
      receiverId: message.receiverId,
      mine: true,
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
