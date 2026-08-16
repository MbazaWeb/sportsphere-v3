import { 
  providerRegistry, 
  TheSportsDBProvider, 
  OpenLigaDBProvider, 
  ErgastF1Provider 
} from "./sports-providers";
import { db } from "@/lib/db";

export function initializeProviders() {
  if (providerRegistry.getAll().length === 0) {
    providerRegistry.register(new TheSportsDBProvider());
    providerRegistry.register(new OpenLigaDBProvider());
    providerRegistry.register(new ErgastF1Provider());
  }
}
// ─── SportSphere (Admin) — Sports Sync Service ───────────────
// Pulls data from external providers (TheSportsDB, OpenLigaDB, Ergast)
// and upserts it into our local DB (League, Team, Player, Coach,
// MatchProfile tables). Entities are marked:
//   source = 'thesportsdb' | 'openligadb' | 'ergast'
//   createdByAI = false  (it's source data, not AI-generated)
//   verified = false     (admins must verify before they're official)
//
// Mirrored from the fan app, adapted for the admin app's `@/lib/db` import.


// ─── Slugify ────────────────────────────────────────────────
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

// ─── Sync Result ────────────────────────────────────────────
export interface SyncResult {
  provider: string;
  sport: string;
  leaguesCreated: number;
  leaguesUpdated: number;
  teamsCreated: number;
  teamsUpdated: number;
  playersCreated: number;
  playersUpdated: number;
  matchesCreated: number;
  matchesUpdated: number;
  errors: string[];
}

// ─── Main sync entry point ──────────────────────────────────
export async function syncFromProviders(
  options: { providers?: string[]; sports?: string[] } = {}
): Promise<SyncResult[]> {
  initializeProviders();
  const results: SyncResult[] = [];
  let allProviders = providerRegistry.getAll();
  if (allProviders.length === 0) {
    allProviders = [new TheSportsDBProvider(), new OpenLigaDBProvider(), new ErgastF1Provider()];
  }
  const targetProviders = options.providers
    ? allProviders.filter((p) => options.providers!.includes(p.config.id))
    : allProviders;

  const targetSports = options.sports || ['football', 'basketball', 'f1', 'motorsport'];

  for (const provider of targetProviders) {
    for (const sport of targetSports) {
      if (!provider.config.supportedSports.includes(sport)) continue;
      try {
        const result = await syncProviderSport(provider, sport);
        results.push(result);
      } catch (err) {
        console.error(`Sync failed for ${provider.config.id}/${sport}:`, err);
        results.push({
          provider: provider.config.id,
          sport,
          leaguesCreated: 0, leaguesUpdated: 0,
          teamsCreated: 0, teamsUpdated: 0,
          playersCreated: 0, playersUpdated: 0,
          matchesCreated: 0, matchesUpdated: 0,
          errors: [String(err)],
        });
      }
    }
  }

  return results;
}

// ─── Sync a single provider + sport ─────────────────────────
// ─── Sync a single provider + sport ─────────────────────────
// ─── Sync a single provider + sport ─────────────────────────
async function syncProviderSport(provider: any, sport: string): Promise<SyncResult> {
  const result: SyncResult = {
    provider: provider.config.id,
    sport,
    leaguesCreated: 0, leaguesUpdated: 0,
    teamsCreated: 0, teamsUpdated: 0,
    playersCreated: 0, playersUpdated: 0,
    matchesCreated: 0, matchesUpdated: 0,
    errors: [],
  };

  // 1) Get fixtures / live matches from provider
  try {
    const fixtures = await provider.getFixtures(sport, {});
    for (const f of fixtures) {
      if (!f.homeTeam || !f.awayTeam) continue;

      const kickoffDate = f.kickoffAt ? new Date(f.kickoffAt) : new Date();
      
      // Look up existing match by homeTeam, awayTeam, and kickoffAt window
      const existing = await db.match.findFirst({
        where: {
          homeTeam: f.homeTeam,
          awayTeam: f.awayTeam,
          kickoffAt: {
            gte: new Date(kickoffDate.getTime() - 12 * 3600 * 1000),
            lte: new Date(kickoffDate.getTime() + 12 * 3600 * 1000),
          },
        },
      });

      if (existing) {
        await db.match.update({
          where: { id: existing.id },
          data: {
            homeScore: f.homeScore ?? existing.homeScore,
            awayScore: f.awayScore ?? existing.awayScore,
            status: f.status || existing.status,
            minute: f.minute ?? existing.minute,
            venue: f.venue || existing.venue,
          },
        });
        result.matchesUpdated++;
      } else {
        await db.match.create({
          data: {
            league: f.league || "Unknown League",
            homeTeam: f.homeTeam,
            awayTeam: f.awayTeam,
            homeScore: f.homeScore ?? null,
            awayScore: f.awayScore ?? null,
            status: f.status || "upcoming",
            minute: f.minute ?? null,
            venue: f.venue || null,
            kickoffAt: kickoffDate,
            continent: "Europe",
            country: f.country || "England",
            events: JSON.stringify(f.events || []),
          },
        });
        result.matchesCreated++;
      }
    }
  } catch (err) {
    result.errors.push(`matches: ${err}`);
  }

  return result;
}
