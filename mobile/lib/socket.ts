import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

/**
 * Socket.io Client — mobile
 * Auto-reconnect with exponential backoff.
 */

const getSocketUrl = () => {
  if (process.env.EXPO_PUBLIC_WS_URL) {
    return process.env.EXPO_PUBLIC_WS_URL;
  }
  if (!API_BASE_URL) return 'https://sportssphere.fun';
  try {
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.host}`;
  } catch {
    return 'https://sportssphere.fun';
  }
};

const SOCKET_URL = getSocketUrl();

export const socket: Socket = io(SOCKET_URL, {
  path: '/socket.io',
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 15000,
  randomizationFactor: 0.5,
  timeout: 20000,
});

let handlersBound = false;
let lastUserId: string | undefined;

function bindLifecycleHandlers() {
  if (handlersBound) return;
  handlersBound = true;

  socket.on('connect', () => {
    console.log('[Socket] Connected', socket.id);
    if (lastUserId) {
      socket.emit('register_user', lastUserId);
    }
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason);
    // Server kicked us — force reconnect
    if (reason === 'io server disconnect') {
      socket.connect();
    }
  });

  socket.io.on('reconnect_attempt', (attempt) => {
    console.log('[Socket] Reconnect attempt', attempt);
  });

  socket.io.on('reconnect', (attempt) => {
    console.log('[Socket] Reconnected after', attempt, 'attempts');
    if (lastUserId) {
      socket.emit('register_user', lastUserId);
    }
  });

  socket.io.on('reconnect_error', (err) => {
    console.warn('[Socket] Reconnect error:', err.message);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });
}

export const connectSocket = (userId?: string) => {
  lastUserId = userId;
  bindLifecycleHandlers();

  if (socket.connected) {
    if (userId) socket.emit('register_user', userId);
    return;
  }

  socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected || socket.active) {
    socket.disconnect();
  }
};

/** Force a reconnect cycle (e.g. after app returns to foreground) */
export const reconnectSocket = (userId?: string) => {
  lastUserId = userId ?? lastUserId;
  bindLifecycleHandlers();
  if (socket.connected) {
    socket.disconnect();
  }
  socket.connect();
};
