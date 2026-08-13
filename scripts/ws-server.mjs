/**
 * SportSphere — Real-time WebSocket Server (Socket.IO)
 * Nginx proxies /socket.io/ → :3004
 * Internal emit API on 127.0.0.1:3005
 */
import { Server } from "socket.io";
import http from "http";

const PORT = Number(process.env.WS_PORT || 3004);
const INTERNAL_PORT = Number(process.env.WS_INTERNAL_PORT || 3005);

const httpServer = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, online: activeUsers.size, sockets: io.engine?.clientsCount || 0 }));
    return;
  }
  res.writeHead(200);
  res.end("SportSphere WebSocket Server\n");
});

const io = new Server(httpServer, {
  path: "/socket.io",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingInterval: 25000,
  pingTimeout: 20000,
  connectTimeout: 20000,
  // allow both transports through nginx
  transports: ["websocket", "polling"],
});

/** userId -> Set(socketId) for multi-device */
const userSockets = new Map();
const activeUsers = new Set();

function presencePayload() {
  return {
    onlineCount: activeUsers.size,
    socketCount: io.engine?.clientsCount || 0,
    at: new Date().toISOString(),
  };
}

function broadcastPresence() {
  io.emit("presence_update", presencePayload());
}

io.on("connection", (socket) => {
  console.log(`[WS] connected ${socket.id}`);

  socket.emit("welcome", {
    id: socket.id,
    ...presencePayload(),
  });

  socket.on("register_user", (userId) => {
    if (!userId || typeof userId !== "string") return;
    socket.data.userId = userId;
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);
    activeUsers.add(userId);
    socket.join(`user_${userId}`);
    broadcastPresence();
  });

  socket.on("join_match", (matchId) => {
    if (!matchId) return;
    socket.join(`match_${matchId}`);
  });
  socket.on("leave_match", (matchId) => {
    if (!matchId) return;
    socket.leave(`match_${matchId}`);
  });

  socket.on("join_room", (roomId) => {
    if (!roomId) return;
    socket.join(String(roomId));
  });
  socket.on("leave_room", (roomId) => {
    if (!roomId) return;
    socket.leave(String(roomId));
  });

  socket.on("join_feed", () => socket.join("feed"));
  socket.on("leave_feed", () => socket.leave("feed"));
  socket.on("join_admin", () => socket.join("admin"));

  socket.on("send_message", (data) => {
    if (!data?.roomId) return;
    socket.to(data.roomId).emit("new_message", data.message);
  });
  socket.on("typing_start", (data) => {
    if (!data?.roomId) return;
    socket.to(data.roomId).emit("user_typing", data);
  });
  socket.on("typing_stop", (data) => {
    if (!data?.roomId) return;
    socket.to(data.roomId).emit("user_stopped_typing", data);
  });

  socket.on("ping_alive", () => {
    socket.emit("pong_alive", { at: Date.now() });
  });

  socket.on("disconnect", () => {
    const userId = socket.data.userId;
    if (userId && userSockets.has(userId)) {
      const set = userSockets.get(userId);
      set.delete(socket.id);
      if (set.size === 0) {
        userSockets.delete(userId);
        activeUsers.delete(userId);
      }
      broadcastPresence();
    }
    console.log(`[WS] disconnected ${socket.id}`);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[WS] listening on ${PORT}`);
});

/** Internal HTTP API for Next.js to push events */
const internalApi = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.method === "GET" && (req.url === "/" || req.url === "/health")) {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, ...presencePayload() }));
    return;
  }
  if (req.method !== "POST") {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "not found" }));
    return;
  }
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", () => {
    try {
      const payload = JSON.parse(body || "{}");
      const { event, room, data, rooms } = payload;
      if (!event) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "event required" }));
        return;
      }
      if (Array.isArray(rooms) && rooms.length) {
        for (const r of rooms) io.to(r).emit(event, data);
      } else if (room) {
        io.to(room).emit(event, data);
      } else {
        io.emit(event, data);
      }
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, online: activeUsers.size }));
    } catch (e) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Invalid JSON" }));
    }
  });
});

internalApi.listen(INTERNAL_PORT, "127.0.0.1", () => {
  console.log(`[WS] internal API on ${INTERNAL_PORT}`);
});
