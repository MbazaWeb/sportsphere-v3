/**
 * SportSphere — Real-time WebSocket Server
 * ----------------------------------------
 * Separate Node.js process to handle WebSockets (Socket.io).
 * Proxyed by Nginx at /socket.io
 */
import { Server } from 'socket.io';
import http from 'http';

const PORT = process.env.WS_PORT || 3004;

const httpServer = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('SportSphere WebSocket Server is running\n');
});

const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: "*", // Controlled by Nginx in production
    methods: ["GET", "POST"]
  }
});

// Presence tracking
const activeUsers = new Set();

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  socket.on('join_match', (matchId) => {
    socket.join(`match_${matchId}`);
    console.log(`[WS] Socket ${socket.id} joined match_${matchId}`);
  });

  socket.on('leave_match', (matchId) => {
    socket.leave(`match_${matchId}`);
    console.log(`[WS] Socket ${socket.id} left match_${matchId}`);
  });

  // Generic room joining (for posts, DMs, etc.)
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`[WS] Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`[WS] Socket ${socket.id} left room ${roomId}`);
  });

  // DM sending
  socket.on('send_message', (data) => {
    // data: { roomId, message }
    socket.to(data.roomId).emit('new_message', data.message);
  });

  // Typing indicators
  socket.on('typing_start', (data) => {
    // data: { roomId, userId, name }
    socket.to(data.roomId).emit('user_typing', data);
  });

  socket.on('typing_stop', (data) => {
    socket.to(data.roomId).emit('user_stopped_typing', data);
  });

  // Global presence
  socket.on('register_user', (userId) => {
    socket.userId = userId;
    activeUsers.add(userId);
    io.emit('presence_update', { onlineCount: activeUsers.size });
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      activeUsers.delete(socket.userId);
      io.emit('presence_update', { onlineCount: activeUsers.size });
    }
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[WS] Server listening on port ${PORT}`);
});

/**
 * API for the Next.js backend to push updates to WebSockets.
 * (Simple HTTP server for internal triggers)
 */
const internalApi = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { event, room, data } = payload;

        if (room) {
          io.to(room).emit(event, data);
        } else {
          io.emit(event, data);
        }

        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

internalApi.listen(3005, '127.0.0.1', () => {
  console.log(`[WS] Internal API listening on port 3005`);
});
