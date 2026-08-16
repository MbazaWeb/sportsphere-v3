import { createApiClient } from './index';

/**
 * Messages API
 * ------------
 */
export interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerHandle: string;
  partnerAvatar: string;
  isVerified: boolean;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

export interface Message {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: any;
  receiver: any;
}

export function createMessagesApi(client: ReturnType<typeof createApiClient>) {
  return {
    /** GET /api/messages — list current user's conversations */
    listConversations: () => client.get<Conversation[]>('/api/messages'),

    /** POST /api/messages — send a message */
    sendMessage: (recipientId: string, content: string) =>
      client.post<Message>('/api/messages', { recipientId, content }),
  };
}

export type MessagesApi = ReturnType<typeof createMessagesApi>;
