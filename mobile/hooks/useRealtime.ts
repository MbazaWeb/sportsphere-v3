import { useEffect } from 'react';
import { socket, connectSocket, disconnectSocket } from '../lib/socket';
import { useAuthStore } from '../lib/authStore';

export function useRealtime() {
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;

  useEffect(() => {
    if (userId) {
      connectSocket(userId);
    } else {
      disconnectSocket();
    }

    return () => {
      // We don't necessarily want to disconnect on every unmount of a component
      // using this hook, but if the app is closing or session changes we might.
    };
  }, [userId]);

  return {
    socket,
    connected: socket.connected,
  };
}

/**
 * Hook for subscribing to a specific match
 */
export function useMatchRealtime(matchId: string | undefined, onUpdate: (data: any) => void) {
  useEffect(() => {
    if (!matchId) return;

    socket.emit('join_match', matchId);
    socket.on('match_update', onUpdate);

    return () => {
      socket.emit('leave_match', matchId);
      socket.off('match_update', onUpdate);
    };
  }, [matchId, onUpdate]);
}

/**
 * Hook for subscribing to a specific post's comments
 */
export function usePostRealtime(postId: string | undefined, onNewComment: (comment: any) => void) {
  useEffect(() => {
    if (!postId) return;

    socket.emit('join_room', `post_${postId}`);
    socket.on('new_comment', onNewComment);

    return () => {
      socket.emit('leave_room', `post_${postId}`);
      socket.off('new_comment', onNewComment);
    };
  }, [postId, onNewComment]);
}
