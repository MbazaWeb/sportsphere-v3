/** Socket stub for minimal APK — no-op but non-null so call sites typecheck */
type Handler = (...args: any[]) => void;
export type Socket = {
  on: (ev: string, cb: Handler) => void;
  off: (ev: string, cb?: Handler) => void;
  emit: (ev: string, ...args: any[]) => void;
  disconnect: () => void;
};
const noop = () => {};
export const socket: Socket = {
  on: noop,
  off: noop,
  emit: noop,
  disconnect: noop,
};
export function getSocket(): Socket { return socket; }
export function connectSocket(_token?: string | null): Socket { return socket; }
export function disconnectSocket() {}
