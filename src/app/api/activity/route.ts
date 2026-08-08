import { NextRequest, NextResponse } from 'next/server';
import { safeJsonParse } from '@/lib/json';
import { db } from '@/lib/db';
import { USER_SELECT } from '@/lib/db-selects';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Resolve user from session cookie (no proxy required)
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const payload = await verifySession(token);
    if (!payload) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    const targetUserId = payload.sub;

    // Fetch notifications
    const notifications = await db.notification.findMany({
      where: { userId: targetUserId },
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        isRead: true,
        referenceId: true,
        createdAt: true,
        actor: { select: USER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Fetch messages (conversations)
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
      partnerAvatar: string; lastMessage: string; lastTime: string;
      unread: number; isVerified: boolean;
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

    const safeNotifications = notifications.map((n) => ({
      ...n,
      actor: n.actor ? {
        ...n.actor,
        sportsFollowing: safeJsonParse(n.actor.sportsFollowing, []),
        roleData: safeJsonParse(n.actor.roleData, {}),
      } : null,
    }));

    return NextResponse.json({ notifications: safeNotifications, messages });
  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
