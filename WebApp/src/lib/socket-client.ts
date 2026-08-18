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

function envInt(name: string, fallback: number) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const SOCKET_ENABLED = process.env.NEXT_PUBLIC_SOCKET_ENABLED !== 'false';

export const SOCKET_RECONNECT_OPTIONS = {
  path: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/socket.io` as const,
  transports: ['websocket', 'polling'] as string[],
  reconnection: SOCKET_ENABLED,
  reconnectionAttempts: envInt('NEXT_PUBLIC_SOCKET_RECONNECT_ATTEMPTS', 5),
  reconnectionDelay: envInt('NEXT_PUBLIC_SOCKET_RECONNECT_DELAY', 1000),
  reconnectionDelayMax: envInt('NEXT_PUBLIC_SOCKET_RECONNECT_DELAY_MAX', 15000),
  randomizationFactor: 0.5,
  timeout: envInt('NEXT_PUBLIC_SOCKET_TIMEOUT', 20000),
  autoConnect: SOCKET_ENABLED,
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
  if (!SOCKET_ENABLED) {
    setStatus('disconnected', 'disabled');
    return null;
  }

  const mod = await import('socket.io-client');
  const url = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;
  sharedSocket = mod.io(url, {
    ...SOCKET_RECONNECT_OPTIONS,
  });

  sharedSocket.on('connect', () => {
    setStatus('connected');
    /* connected */
  });

  sharedSocket.on('disconnect', (reason: string) => {
    setStatus('disconnected', reason);
    /* reconnect limited */
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
