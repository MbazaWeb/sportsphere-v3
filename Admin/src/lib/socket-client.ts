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
  reconnection: true,
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

export async function getSharedSocket(): Promise<any> {
  if (sharedSocket) return sharedSocket;

  const mod = await import('socket.io-client');
  sharedSocket = mod.io({
    ...SOCKET_RECONNECT_OPTIONS,
  });

  sharedSocket.on('connect', () => {
    setStatus('connected');
  });

  sharedSocket.on('disconnect', (reason: string) => {
    setStatus('disconnected', reason);
    if (reason === 'io server disconnect') {
      sharedSocket.connect();
    }
  });

  sharedSocket.io.on('reconnect_attempt', (attempt: number) => {
    setStatus('reconnecting', `attempt ${attempt}`);
  });

  sharedSocket.io.on('reconnect', (attempt: number) => {
    setStatus('connected', `reconnected after ${attempt}`);
  });

  sharedSocket.io.on('reconnect_error', (err: Error) => {
    setStatus('error', err?.message || 'reconnect_error');
  });

  sharedSocket.on('connect_error', (err: Error) => {
    if (status !== 'reconnecting') setStatus('connecting', err?.message);
  });

  setStatus('connecting');
  return sharedSocket;
}
