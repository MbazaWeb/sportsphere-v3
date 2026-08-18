"use client";

import { useEffect, useRef } from "react";
import { getSharedSocket, onSocketStatus } from "@/lib/socket-client";
import { useAuthStore } from "@/store/authStore";

/**
 * Bootstraps global Socket.IO connection for the fan web app:
 * - connects shared socket
 * - registers user presence
 * - joins feed room
 * - optional callbacks for feed/like/comment events
 */
export function useRealtime(handlers?: {
  onFeedUpdate?: (payload: any) => void;
  onPostCreated?: (payload: any) => void;
  onLikeUpdate?: (payload: any) => void;
  onPresence?: (payload: any) => void;
  onNotification?: (payload: any) => void;
}) {
  const userId = useAuthStore((s) => s.userProfile?.id);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let socket: any;
    let unsubStatus: (() => void) | undefined;
    let cancelled = false;

    // Public client registration token. DISTINCT from the server-side
    // WS_AUTH_SECRET (which must never be exposed to the browser). Empty
    // value = anonymous socket (feed still works, presence disabled).
    const REG_SECRET = process.env.NEXT_PUBLIC_WS_AUTH_SECRET || "";

    const registerUser = (uid: string) => {
      // ws-server.mjs (scripts/ws-server.mjs) was hardened to reject the
      // legacy bare-string `register_user` form. Send the new shape:
      //   { userId, secret, isAdmin }
      // and use an ack callback so a rejected registration is visible.
      socket.emit(
        "register_user",
        { userId: uid, secret: REG_SECRET, isAdmin: false },
        (ack: any) => {
          if (ack?.ok) {
            console.log("[Socket] registered", uid);
          } else if (ack?.error) {
            console.warn("[Socket] register_user rejected:", ack.error);
          }
        },
      );
    };

    (async () => {
      try {
        socket = await getSharedSocket();
        if (cancelled) return;

        unsubStatus = onSocketStatus(() => {});

        const onConnect = () => {
          if (userId) registerUser(userId);
          socket.emit("join_feed");
        };

        if (socket.connected) onConnect();
        socket.on("connect", onConnect);

        const bind = (event: string, key: keyof NonNullable<typeof handlers>) => {
          const fn = (payload: any) => handlersRef.current?.[key]?.(payload);
          socket.on(event, fn);
          return () => socket.off(event, fn);
        };

        const offs = [
          bind("feed_update", "onFeedUpdate"),
          bind("post_created", "onPostCreated"),
          bind("like_update", "onLikeUpdate"),
          bind("presence_update", "onPresence"),
          bind("notification_received", "onNotification"),
        ];

        return () => {
          offs.forEach((o) => o());
          socket.off("connect", onConnect);
        };
      } catch (e) {
        console.warn("[useRealtime]", e);
      }
    })();

    return () => {
      cancelled = true;
      unsubStatus?.();
    };
  }, [userId]);
}
