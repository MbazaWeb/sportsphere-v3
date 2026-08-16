import { db } from './db';
import { sendFcmToTokens } from './firebase-admin';

async function getExpoClient() {
  if (typeof window !== 'undefined') return null;
  try {
    const { Expo } = await import('expo-server-sdk');
    return new Expo();
  } catch {
    return null;
  }
}

function isExpoToken(token: string): boolean {
  return token.startsWith('ExponentPushToken') || token.startsWith('ExpoPushToken');
}

export interface NotificationOptions {
  userId: string;
  title: string;
  body: string;
  type?: string;
  data?: Record<string, any>;
  [key: string]: any;
}

/**
 * Persist in-app notification + send push (FCM for Flutter, Expo for legacy).
 */
export async function sendNotification(
  userIdOrOptions: string | NotificationOptions,
  title?: string,
  body?: string,
  data?: Record<string, any>,
) {
  if (typeof window !== 'undefined') return;

  let targetUserId: string;
  let notifTitle: string;
  let notifBody: string;
  let notifData: Record<string, any> | undefined = data;
  let notifType = 'system';

  if (typeof userIdOrOptions === 'object' && userIdOrOptions !== null) {
    targetUserId = userIdOrOptions.userId;
    notifTitle = userIdOrOptions.title;
    notifBody = userIdOrOptions.body;
    notifData = userIdOrOptions.data || (userIdOrOptions.type ? { type: userIdOrOptions.type } : undefined);
    notifType = userIdOrOptions.type || 'system';
  } else {
    targetUserId = userIdOrOptions;
    notifTitle = title || 'Notification';
    notifBody = body || '';
  }

  try {
    // In-app notification row (best-effort)
    await db.notification
      .create({
        data: {
          userId: targetUserId,
          type: notifType,
          title: notifTitle,
          body: notifBody,
        },
      })
      .catch(() => null);

    const tokens = await db.pushToken.findMany({
      where: { userId: targetUserId },
      select: { token: true },
    });

    const all = tokens
      .map((t) => t.token)
      .filter((token): token is string => typeof token === 'string' && token.trim().length > 0);

    if (all.length === 0) return;

    const expoTokens = all.filter(isExpoToken);
    const fcmTokens = all.filter((t) => !isExpoToken(t));

    // Flutter / native FCM
    if (fcmTokens.length > 0) {
      await sendFcmToTokens(fcmTokens, notifTitle, notifBody, notifData).catch((e) =>
        console.error('FCM send error:', e),
      );
    }

    // Legacy Expo tokens (if any remain)
    if (expoTokens.length > 0) {
      const expo = await getExpoClient();
      if (expo) {
        const messages = expoTokens.map((to) => ({
          to,
          sound: 'default' as const,
          title: notifTitle,
          body: notifBody,
          data: notifData,
        }));
        await expo.sendPushNotificationsAsync(messages);
      }
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
