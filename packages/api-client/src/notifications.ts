import type { PublicUser } from '@sportsphere/types/auth';
import { createApiClient } from './index';

/**
 * Notifications API
 * -----------------
 * Server returns an array of notifications directly (not wrapped).
 *
 * Notification types include: 'follow', 'like', 'comment', 'mention',
 * 'reply', 'verification', 'rank_change', 'system'.
 */
export type NotificationType =
  | 'follow'
  | 'like'
  | 'comment'
  | 'mention'
  | 'reply'
  | 'verification'
  | 'rank_change'
  | 'system'
  | string;

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  referenceId?: string | null;
  createdAt: string;
  actor?: PublicUser | null;
}

export function createNotificationsApi(client: ReturnType<typeof createApiClient>) {
  return {
    /** GET /api/notifications — list current user's notifications (auth required) */
    list: () => client.get<Notification[]>('/api/notifications'),
    /** POST /api/notifications/register-device — register Expo push token */
    registerToken: (token: string, platform: string) =>
      client.post<{ ok: boolean }>('/api/notifications/register-device', { token, platform }),
  };
}

export type NotificationsApi = ReturnType<typeof createNotificationsApi>;
