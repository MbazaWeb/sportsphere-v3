/**
 * Shared Socket.IO client with explicit reconnection behaviour.
 * Used by Scores live feed and any other real-time UI.
 */

export type SocketStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export const SOCKET_RECONNECT_OPTIONS = {
  path: '/socket.io' as const,
  transports: ['websocket', 'polling'] as string[],
  /** Reconnect automatically after drop */
  reconnection: true,
  /** Start delay 1s, then exponential backoff */
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 15000,
  randomizationFactor: 0.5,
  timeout: 20000,
  autoConnect: true,
};

type StatusListener = (status: SocketStatus, detail?: string) => void;

let sharedSocket: any = null;
let status: SocketStatus = 'idle';
const statusListeners = new Set<StatusListener>();

function setStatus(next: SocketStatus, detail?: string) {
  status = next;
  statusListeners.forEach((fn) => {
    try {
      fn(next, detail);
    } catch {
      /* ignore */
    }
  });
}

export function getSocketStatus(): SocketStatus {
  return status;
}

export function onSocketStatus(listener: StatusListener): () => void {
  statusListeners.add(listener);
  listener(status);
  return () => {
    statusListeners.delete(listener);
  };
}

/**
 * Lazy singleton socket with reconnection handlers attached once.
 */
export async function getSharedSocket(): Promise<any> {
  if (sharedSocket) return sharedSocket;

  const mod = await import('socket.io-client');
  sharedSocket = mod.io({
    ...SOCKET_RECONNECT_OPTIONS,
  });

  sharedSocket.on('connect', () => {
    setStatus('connected');
    console.log('[Socket] connected', sharedSocket.id);
  });

  sharedSocket.on('disconnect', (reason: string) => {
    setStatus('disconnected', reason);
    console.warn('[Socket] disconnected:', reason);
    // Manager will auto-reconnect unless client called disconnect()
    if (reason === 'io server disconnect') {
      // Server forced disconnect — manual reconnect
      sharedSocket.connect();
    }
  });

  sharedSocket.io.on('reconnect_attempt', (attempt: number) => {
    setStatus('reconnecting', `attempt ${attempt}`);
    console.log('[Socket] reconnect attempt', attempt);
  });

  sharedSocket.io.on('reconnect', (attempt: number) => {
    setStatus('connected', `reconnected after ${attempt}`);
    console.log('[Socket] reconnected after', attempt, 'attempts');
  });

  sharedSocket.io.on('reconnect_error', (err: Error) => {
    setStatus('error', err?.message || 'reconnect_error');
    console.warn('[Socket] reconnect error:', err?.message);
  });

  sharedSocket.io.on('reconnect_failed', () => {
    setStatus('error', 'reconnect_failed');
    console.error('[Socket] reconnect failed — will keep trying via manager');
  });

  sharedSocket.on('connect_error', (err: Error) => {
    if (status !== 'reconnecting') setStatus('connecting', err?.message);
    console.warn('[Socket] connect_error:', err?.message);
  });

  setStatus('connecting');
  return sharedSocket;
}

export function disconnectSharedSocket() {
  try {
    sharedSocket?.disconnect();
  } catch {
    /* ignore */
  }
  sharedSocket = null;
  setStatus('idle');
}
