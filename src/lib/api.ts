// API fetch helper — automatically prefixes the basePath so fetch('/api/...')
// works correctly when the app is mounted at a sub-path like /sportsphere
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function apiUrl(path: string): string {
  return `${BASE}${path}`;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init);
}
