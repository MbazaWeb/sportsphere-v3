// Universal JSON field parser
// SQLite returns strings, PostgreSQL Json returns objects directly
export function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  // Already parsed (PostgreSQL Json type)
  return value as T;
}
