import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

/**
 * Socket.io Client Instance
 * ------------------------
 * Connects to the WebSocket server proxyed by Nginx at /socket.io.
 * The URL is derived from the API_BASE_URL.
 */

// If API_BASE_URL is 'http://104.152.50.173:3002/sportsphere',
// we want the socket to connect to 'http://104.152.50.173:3002' (or the proxy port).
// Actually, in production it's 'https://sportssphere.fun/socket.io'
const getSocketUrl = () => {
  if (!API_BASE_URL) return '';
  try {
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.host}`;
  } catch {
    return API_BASE_URL;
  }
};

const SOCKET_URL = getSocketUrl();

export const socket: Socket = io(SOCKET_URL, {
  path: '/socket.io',
  autoConnect: false,
  transports: ['websocket'], // force websocket for performance
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
