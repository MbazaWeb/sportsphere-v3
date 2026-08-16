"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/** Admin connects to main site origin Socket.IO (same host, path /socket.io) */
export function getAdminSocket(): Socket {
  if (socket) return socket;
  const url =
    typeof window !== "undefined"
      ? window.location.origin.replace(/:\\d+$/, "") // strip admin port if any
      : "https://sportssphere.fun";
  // When admin is under /sportsphere-admin on same host, origin is sportssphere.fun
  socket = io({
    path: "/socket.io",
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15000,
    autoConnect: true,
  });
  socket.on("connect", () => {
    socket?.emit("join_admin");
    console.log("[AdminSocket] connected", socket?.id);
  });
  socket.on("disconnect", (r) => console.warn("[AdminSocket] disconnect", r));
  return socket;
}
