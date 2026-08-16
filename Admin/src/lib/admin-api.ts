/**
 * Admin API URL helper — Next.js basePath is NOT applied to absolute
 * fetch('/api/...') paths in the browser. Always prefix with basePath.
 */
export const ADMIN_BASE_PATH =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_PATH) ||
  '/sportsphere-admin';

export function adminApi(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  // Avoid double-prefix if already absolute to admin
  if (p.startsWith(ADMIN_BASE_PATH)) return p;
  // Absolute URL — leave alone
  if (/^https?:\/\//i.test(p)) return p;
  return `${ADMIN_BASE_PATH}${p}`;
}

export function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has('Content-Type') && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(adminApi(path), {
    credentials: 'include',
    ...init,
    headers,
  });
}
