// ─── Team Logo Resolver ──────────────────────────────────────────────
// Resolves team logo URLs from: 1) DB Team.logoUrl, 2) TheSportsDB API
// Uses long-lived in-memory cache to avoid repeated API calls

const logoCache = new Map<string, { url: string; expires: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const TSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

/**
 * Search TheSportsDB for a team logo by name.
 * Returns the badge/logo URL or null.
 * Results are cached in-memory for 24 hours.
 */
export async function fetchLogoFromTheSportsDB(teamName: string): Promise<string | null> {
  const key = teamName.toLowerCase().trim();

  // Check cache first
  const cached = logoCache.get(key);
  if (cached && Date.now() < cached.expires) {
    return cached.url;
  }

  try {
    const res = await fetch(
      `${TSDB_BASE}/searchteams.php?t=${encodeURIComponent(teamName)}`,
      { headers: { 'User-Agent': 'SportSphere/1.0' }, next: { revalidate: 86400 } as any }
    );
    if (!res.ok) return null;

    const data = await res.json() as { teams?: any[] };
    const teams = data?.teams;
    if (!teams || teams.length === 0) {
      // Cache negative result for 1 hour to avoid repeated misses
      logoCache.set(key, { url: '', expires: Date.now() + 60 * 60 * 1000 });
      return null;
    }

    // Find best match: exact name, then first result
    const exact = teams.find(
      (t: any) => t.strTeam?.toLowerCase() === key
    );
    const team = exact || teams[0];
    const logo = team?.strBadge || team?.strLogo || team?.strTeamBadge || null;

    if (logo) {
      logoCache.set(key, { url: logo, expires: Date.now() + CACHE_TTL });
    } else {
      logoCache.set(key, { url: '', expires: Date.now() + 60 * 60 * 1000 });
    }

    return logo;
  } catch (err) {
    console.warn(`[logo-resolver] TheSportsDB lookup failed for "${teamName}":`, err);
    return null;
  }
}

/**
 * Batch-resolve team logos for an array of team names.
 * Fetches from TheSportsDB in parallel (max 3 concurrent to respect rate limits).
 * Returns a Map<lowercaseName, logoUrl>.
 */
export async function batchResolveLogosFromAPI(
  names: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (names.length === 0) return result;

  // Deduplicate and filter out already-cached names
  const uniqueNames = [...new Set(names.map(n => n.toLowerCase().trim()))];
  const toFetch = uniqueNames.filter(n => {
    const cached = logoCache.get(n);
    return !cached || Date.now() >= cached.expires;
  });

  // Also add cached results
  for (const n of uniqueNames) {
    const cached = logoCache.get(n);
    if (cached && Date.now() < cached.expires && cached.url) {
      result.set(n, cached.url);
    }
  }

  // Fetch missing ones (max 3 concurrent)
  const CONCURRENCY = 3;
  for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
    const batch = toFetch.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(name => fetchLogoFromTheSportsDB(name))
    );
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value) {
        result.set(batch[idx], r.value);
      }
    });
  }

  return result;
}
