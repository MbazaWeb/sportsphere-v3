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

    sentMessages.forEach((m: typeof sentMessages[number]) => processMessage(m, true));
    receivedMessages.forEach((m: typeof receivedMessages[number]) => processMessage(m, false));

    const messages = Array.from(conversations.values()).sort(
      (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    );

    const safeNotifications = notifications.map((n: typeof notifications[number]) => ({
      ...n,
      actor: n.actor ? {
        ...n.actor,
        sportsFollowing: safeJsonParse(n.actor.sportsFollowing, []),
        roleData: safeJsonParse(n.actor.roleData, {}),
      } : null,
    }));

    // Generate system notifications for recent sports activity
    const systemNotifs = [];

    // Check for recent matches (results)
    try {
      const recentMatches = await db.match.findMany({
        where: { status: 'finished' },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, homeTeam: true, awayTeam: true, homeScore: true, awayScore: true, league: true, updatedAt: true },
      });
      for (const m of recentMatches) {
        systemNotifs.push({
          id: `sys-match-${m.id}`,
          type: 'result',
          title: `Full Time: ${m.homeTeam} ${m.homeScore} - ${m.awayScore} ${m.awayTeam}`,
          body: m.league,
          isRead: true,
          referenceId: m.id,
          createdAt: m.updatedAt.toISOString(),
          actor: null,
        });
      }
    } catch { /* ignore if match table doesn't exist */ }

    // Check for new users (players/teams joined recently)
    try {
      const newUsers = await db.user.findMany({
        where: { role: { in: ['player', 'team', 'coach', 'media-broadcast'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, role: true, handle: true, avatarInitials: true, isVerified: true, createdAt: true },
      });
      for (const u of newUsers) {
        const roleLabel = u.role === 'media-broadcast' ? 'Media' : u.role.charAt(0).toUpperCase() + u.role.slice(1);
        systemNotifs.push({
          id: `sys-user-${u.id}`,
          type: 'community',
          title: `New ${roleLabel}: ${u.name} joined SportSphere`,
          body: `@${u.handle}`,
          isRead: true,
          referenceId: u.id,
          createdAt: u.createdAt.toISOString(),
          actor: { id: u.id, name: u.name, handle: u.handle, avatarInitials: u.avatarInitials, isVerified: u.isVerified },
        });
      }
    } catch { /* ignore */ }

    // Check for live matches
    try {
      const liveMatches = await db.match.findMany({
        where: { status: 'live' },
        take: 5,
        select: { id: true, homeTeam: true, awayTeam: true, homeScore: true, awayScore: true, league: true, minute: true, updatedAt: true },
      });
      for (const m of liveMatches) {
        systemNotifs.push({
          id: `sys-live-${m.id}`,
          type: 'goal',
          title: `LIVE: ${m.homeTeam} ${m.homeScore ?? 0} - ${m.awayScore ?? 0} ${m.awayTeam} (${m.minute}')`,
          body: m.league,
          isRead: false,
          referenceId: m.id,
          createdAt: m.updatedAt.toISOString(),
          actor: null,
        });
      }
    } catch { /* ignore */ }

    // Merge user notifications with system notifications, sort by date
    const allNotifications = [...safeNotifications, ...systemNotifs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 30);

    return NextResponse.json({ notifications: allNotifications, messages });
  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
