/**
 * SportSphere — Real-time WebSocket Server (Socket.IO)
 * Nginx proxies /socket.io/ → :3004
 * Internal emit API on 127.0.0.1:3005
 *
 * Security fixes applied (audit P1):
 * - CORS restricted to known origins (no wildcard)
 * - register_user requires a shared secret (WS_AUTH_SECRET) + userId
 * - join_admin restricted to users that registered with isAdmin flag + secret
 * - Unauthenticated sockets cannot join privileged rooms
 *
 * Env loading fix (2026-08):
 * - PM2 does NOT auto-load .env files for non-Next.js scripts. When the
 *   'sportsphere-ws' process starts via `node scripts/ws-server.mjs`, none
 *   of the WS_* vars defined in /var/www/sportsphere-nextjs/.env reach the
 *   process — which means WS_AUTH_SECRET was always "" and the server ran
 *   in insecure mode. We now explicitly load .env from process.cwd() with
 *   a tiny no-dependency parser, so the env block in ecosystem.config.cjs
 *   AND the .env file are both honoured (with .env taking precedence, only
 *   filling in vars that PM2 didn't already inject).
 */
import { Server } from "socket.io";
import http from "http";
import crypto from "crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Tiny no-dep .env loader (PM2 does not auto-load .env for non-Next scripts).
// Only sets vars that are NOT already present in process.env (so PM2's env
// block in ecosystem.config.cjs still wins for explicit overrides).
(function loadEnvFile() {
  const candidates = [
    process.env.WS_ENV_FILE, // explicit override
    join(process.cwd(), ".env"),
    "/var/www/sportsphere-nextjs/.env",
  ];
  for (const p of candidates) {
    if (!p || !existsSync(p)) continue;
    try {
      const txt = readFileSync(p, "utf8");
      for (const raw of txt.split("\n")) {
        const line = raw.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq < 1) continue;
        const key = line.slice(0, eq).trim();
        let val = line.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = val;
      }
      console.log(`[WS] loaded env from ${p}`);
      break;
    } catch (e) {
      console.warn(`[WS] failed to load env from ${p}:`, e?.message || e);
    }
  }
})();

const PORT = Number(process.env.WS_PORT || 3004);
const INTERNAL_PORT = Number(process.env.WS_INTERNAL_PORT || 3005);

/** Shared secret that clients must present when registering. Set in .env */
const WS_AUTH_SECRET = process.env.WS_AUTH_SECRET || process.env.SESSION_SECRET || "";
const ALLOWED_ORIGINS = (
  process.env.WS_ALLOWED_ORIGINS ||
  "https://sportsphere.app,https://www.sportsphere.app,https://sportsphere.fun,https://www.sportsphere.fun,http://localhost:3002,http://localhost:3000,http://127.0.0.1:3002,http://127.0.0.1:3000"
).split(",").map((s) => s.trim()).filter(Boolean);

const httpServer = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        online: activeUsers.size,
        sockets: io.engine?.clientsCount || 0,
      })
    );
    return;
  }
  res.writeHead(200);
  res.end("SportSphere WebSocket Server\n");
});

const io = new Server(httpServer, {
  path: "/socket.io",
  cors: {
    origin: (origin, callback) => {
      // Allow non-browser clients (no Origin header) and explicit allow-list
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[WS] blocked CORS origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 20000,
  connectTimeout: 20000,
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

/** Constant-time compare for secrets */
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

io.on("connection", (socket) => {
  console.log(`[WS] connected ${socket.id}`);

  socket.emit("welcome", {
    id: socket.id,
    ...presencePayload(),
  });

  /**
   * register_user — clients must send { userId, secret, isAdmin? }
   * or the legacy (userId, secret) form. Secret must match WS_AUTH_SECRET.
   * Without a valid secret the registration is rejected and the socket stays
   * anonymous (cannot join privileged rooms).
   */
  socket.on("register_user", (payload, ack) => {
    let userId, secret, isAdmin = false;

    if (typeof payload === "string") {
      // legacy single-arg form is no longer accepted for security
      if (typeof ack === "function") ack({ ok: false, error: "auth required" });
      return;
    }
    if (payload && typeof payload === "object") {
      userId = payload.userId;
      secret = payload.secret;
      isAdmin = Boolean(payload.isAdmin);
    }

    if (!userId || typeof userId !== "string") {
      if (typeof ack === "function") ack({ ok: false, error: "userId required" });
      return;
    }

    // Require shared secret when configured (production must set it)
    if (WS_AUTH_SECRET) {
      if (!secret || !safeEqual(secret, WS_AUTH_SECRET)) {
        console.warn(`[WS] rejected register_user for ${userId} — bad secret`);
        if (typeof ack === "function") ack({ ok: false, error: "unauthorized" });
        return;
      }
    } else {
      console.warn("[WS] WS_AUTH_SECRET not set — running in insecure mode");
    }

    socket.data.userId = userId;
    socket.data.isAdmin = isAdmin;
    socket.data.authenticated = true;

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);
    activeUsers.add(userId);
    socket.join(`user_${userId}`);
    broadcastPresence();

    console.log(`[WS] registered user ${userId} (admin=${isAdmin})`);
    if (typeof ack === "function") ack({ ok: true, userId });
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

  /**
   * join_admin — only allowed for sockets that successfully registered
   * with isAdmin: true (and valid secret). Prevents privilege escalation.
   */
  socket.on("join_admin", (ack) => {
    if (!socket.data.authenticated || !socket.data.isAdmin) {
      console.warn(`[WS] rejected join_admin from ${socket.id}`);
      if (typeof ack === "function") ack({ ok: false, error: "forbidden" });
      return;
    }
    socket.join("admin");
    console.log(`[WS] ${socket.data.userId} joined admin room`);
    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("send_message", (data) => {
    if (!data?.roomId) return;
    // Optionally require authentication for messaging
    if (!socket.data.authenticated) return;
    socket.to(data.roomId).emit("new_message", data.message);
  });
  socket.on("typing_start", (data) => {
    if (!data?.roomId || !socket.data.authenticated) return;
    socket.to(data.roomId).emit("user_typing", data);
  });
  socket.on("typing_stop", (data) => {
    if (!data?.roomId || !socket.data.authenticated) return;
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
  if (!WS_AUTH_SECRET) {
    console.warn(
      "[WS] WARNING: WS_AUTH_SECRET is not set. Set it in the environment for production."
    );
  }
});

/** Internal HTTP API for Next.js to push events (localhost only) */
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
