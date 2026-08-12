import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

/**
 * Socket.io Client Instance
 * ------------------------
 * Connects to the WebSocket server proxied by Nginx.
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
});

export const connectSocket = (userId?: string) => {
  if (socket.connected) return;

  socket.connect();

  socket.on('connect', () => {
    console.log('[Socket] Connected to server');
    if (userId) {
      socket.emit('register_user', userId);
    }
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected from server');
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
