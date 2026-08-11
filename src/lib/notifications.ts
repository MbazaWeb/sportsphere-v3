import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { db } from './db';

const expo = new Expo();

export interface SendPushNotificationOptions {
  userId: string;
  title: string;
  body: string;
  data?: any;
  type: string;
  referenceId?: string;
  actorId?: string;
}

/**
 * Creates a notification in the database AND sends a push notification
 * to all registered devices for that user.
 */
export async function sendNotification(options: SendPushNotificationOptions) {
  const { userId, title, body, data, type, referenceId, actorId } = options;

  try {
    // 1. Create the database record
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        actorId,
        referenceId,
      },
    });

    // 2. Fetch all push tokens for this user
    const pushTokens = await db.pushToken.findMany({
      where: { userId },
    });

    if (pushTokens.length === 0) {
      return notification;
    }

    // 3. Prepare messages
    const messages: ExpoPushMessage[] = [];
    for (const pushToken of pushTokens) {
      if (!Expo.isExpoPushToken(pushToken.token)) {
        console.error(`Push token ${pushToken.token} is not a valid Expo push token`);
        continue;
      }

      messages.push({
        to: pushToken.token,
        sound: 'default',
        title,
        body,
        data: { ...data, type, referenceId, notificationId: notification.id },
      });
    }

    // 4. Send messages in chunks
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    return notification;
  } catch (error) {
    console.error('Error in sendNotification:', error);
    throw error;
  }
}
