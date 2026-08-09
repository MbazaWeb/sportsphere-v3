/**
 * lib/rate-limit.ts
 *
 * Lightweight in-process rate limiter using a sliding-window counter.
 * No external dependency required for a single-instance deployment.
 *
 * For multi-instance / serverless deployments swap the Map for
 * @upstash/ratelimit + Redis — the call-site API is identical.
 *
 * Usage (inside an API route handler):
 *
 *   import { rateLimit } from "@/lib/rate-limit";
 *
 *   const ip = request.headers.get("x-forwarded-for") ?? "unknown";
 *   const { success, remaining, resetAt } = rateLimit(ip, {
 *     maxRequests: 10,
 *     windowMs: 15 * 60 * 1000, // 15 minutes
 *   });
 *   if (!success) {
 *     return NextResponse.json(
 *       { error: "Too many requests. Try again later." },
 *       {
 *         status: 429,
 *         headers: {
 *           "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
 *           "X-RateLimit-Remaining": "0",
 *         },
 *       }
 *     );
 *   }
 */

interface Window {
  count: number;
  resetAt: number; // unix ms when the window expires
}

// Global store — survives across requests within the same Node.js process.
const store = new Map<string, Window>();

// Prune expired entries every 5 minutes so the Map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store) {
    if (win.resetAt <= now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /** Maximum number of requests allowed per window. Default: 10 */
  maxRequests?: number;
  /** Window length in milliseconds. Default: 15 minutes */
  windowMs?: number;
}

export interface RateLimitResult {
  /** true  → request is allowed; false → limit exceeded */
  success: boolean;
  /** How many requests remain in the current window */
  remaining: number;
  /** Unix ms timestamp when the window resets */
  resetAt: number;
}

/**
 * Check (and increment) the rate limit counter for `key`.
 *
 * @param key       Typically the caller's IP address.
 * @param options   Override defaults.
 */
export function rateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const maxRequests = options.maxRequests ?? 10;
  const windowMs = options.windowMs ?? 15 * 60 * 1000;

  const now = Date.now();
  let win = store.get(key);

  if (!win || win.resetAt <= now) {
    // Start a fresh window
    win = { count: 0, resetAt: now + windowMs };
    store.set(key, win);
  }

  win.count += 1;

  const success = win.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - win.count);

  return { success, remaining, resetAt: win.resetAt };
}
