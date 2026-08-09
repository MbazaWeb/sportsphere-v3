// This file re-exports from src/proxy.ts so that Next.js picks up the proxy
// whether the app is configured with src/ or root-level.
// The canonical implementation lives in src/proxy.ts.
export { proxy, config } from './src/proxy';
