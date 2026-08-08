// SportSphere — Shared formatting utilities
// Single source of truth for time/count formatting functions.

/**
 * Format a date string into a human-readable relative time string.
 * e.g. "just now", "5m ago", "3h ago", "2d ago"
 */
export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

/**
 * Format a date string into a short relative time string.
 * e.g. "now", "5m", "3h", "2d"
 */
export function formatTimeShort(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

/**
 * Format a kickoff time into a short HH:MM string.
 * e.g. "17:30"
 */
export function formatKickoffTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
