import { db } from './db';

async function getExpoClient() {
  if (typeof window !== 'undefined') return null;
  const { Expo } = await import('expo-server-sdk');
  return new Expo();
}

export interface NotificationOptions {
  userId: string;
  title: string;
  body: string;
  type?: string;
  data?: Record<string, any>;
  [key: string]: any;
}

export async function sendNotification(
  userIdOrOptions: string | NotificationOptions,
  title?: string,
  body?: string,
  data?: Record<string, any>
) {
  if (typeof window !== 'undefined') return;

  let targetUserId: string;
  let notifTitle: string;
  let notifBody: string;
  let notifData: Record<string, any> | undefined = data;

  if (typeof userIdOrOptions === 'object' && userIdOrOptions !== null) {
    targetUserId = userIdOrOptions.userId;
    notifTitle = userIdOrOptions.title;
    notifBody = userIdOrOptions.body;
    notifData = userIdOrOptions.data || (userIdOrOptions.type ? { type: userIdOrOptions.type, ...userIdOrOptions } : undefined);
  } else {
    targetUserId = userIdOrOptions;
    notifTitle = title || 'Notification';
    notifBody = body || '';
  }

  try {
    const expo = await getExpoClient();
    if (!expo) return;

    const user = await db.user.findUnique({
      where: { id: targetUserId },
      select: { pushTokens: true },
    });

    if (!user?.pushTokens) return;

    // Handle string, token object, or array of token objects/strings
    const rawTokens = Array.isArray(user.pushTokens) ? user.pushTokens : [user.pushTokens];
    const validTokens: string[] = rawTokens
      .map((t: any) => (typeof t === 'string' ? t : t?.token))
      .filter((token): token is string => typeof token === 'string' && token.trim().length > 0);

    if (validTokens.length === 0) return;

    const messages = validTokens.map((to) => ({
      to,
      sound: 'default' as const,
      title: notifTitle,
      body: notifBody,
      data: notifData,
    }));

    await expo.sendPushNotificationsAsync(messages);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
