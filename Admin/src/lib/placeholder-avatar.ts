/** Initials-based avatar when no photo URL is available */
export function placeholderAvatar(name: string, size = 128): string {
  const label = encodeURIComponent((name || 'NA').trim().slice(0, 24) || 'NA');
  return `https://ui-avatars.com/api/?name=${label}&background=1e293b&color=fbbf24&size=${size}&bold=true`;
}

export function displayPhoto(url: string | null | undefined, name: string): string {
  if (url && String(url).trim()) return String(url).trim();
  return placeholderAvatar(name);
}
