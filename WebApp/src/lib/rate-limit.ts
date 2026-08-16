import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitOptions {
  uniqueTokenPerInterval?: number;
  interval?: number;
}

/**
 * Simple in-memory rate limiter using LRU cache.
 * Suitable for single-instance deployments (PM2 fork mode).
 * For multi-instance, use Redis.
 */
export function createRateLimiter(options?: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000, // default 1 minute
  });

  return {
    check: (limit: number, token: string) => {
      const tokenCount = tokenCache.get(token) || [0];
      if (tokenCount[0] === 0) {
        tokenCache.set(token, [1]);
      } else {
        tokenCount[0] += 1;
        tokenCache.set(token, tokenCount);
      }

      const currentUsage = tokenCount[0];
      const isRateLimited = currentUsage >= limit;

      return {
        isRateLimited,
        usage: currentUsage,
        limit,
        remaining: isRateLimited ? 0 : limit - currentUsage,
      };
    },
  };
}

// Global limiters for different purposes
export const authLimiter = createRateLimiter({ interval: 60000 * 5, uniqueTokenPerInterval: 1000 }); // 5 min interval
export const postLimiter = createRateLimiter({ interval: 60000, uniqueTokenPerInterval: 500 });    // 1 min interval
export const apiLimiter  = createRateLimiter({ interval: 60000, uniqueTokenPerInterval: 2000 });   // 1 min interval

/**
 * Helper to get the client IP from NextRequest.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0];
  return '127.0.0.1';
}

/**
 * Standardized Rate Limit Response
 */
export function rateLimitResponse(usage: any) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(usage.limit),
        'X-RateLimit-Remaining': String(usage.remaining),
      }
    }
  );
}

/**
 * Legacy rateLimit function for backward compatibility.
 * (Simple implementation for auth routes)
 */
const legacyCache = new LRUCache<string, { count: number; resetAt: number }>({
  max: 5000,
  ttl: 15 * 60 * 1000, // 15 mins default
});

export function rateLimit(ip: string, options: { maxRequests: number; windowMs: number }) {
  const key = `${ip}:${options.maxRequests}:${options.windowMs}`;
  const now = Date.now();
  let entry = legacyCache.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + options.windowMs };
  } else {
    entry.count += 1;
  }

  legacyCache.set(key, entry);

  return {
    success: entry.count <= options.maxRequests,
    resetAt: entry.resetAt,
  };
}
