// ─── SportSphere (Admin) — Sports Sync Service ───────────────
// Pulls data from external providers (TheSportsDB, OpenLigaDB, Ergast)
// and upserts it into our local DB (League, Team, Player, Coach,
// MatchProfile tables). Entities are marked:
//   source = 'thesportsdb' | 'openligadb' | 'ergast'
//   createdByAI = false  (it's source data, not AI-generated)
//   verified = false     (admins must verify before they're official)
//
// Mirrored from the fan app, adapted for the admin app's `@/lib/db` import.

import { db } from '@/lib/db';
import { initializeProviders, providerRegistry } from '@/lib/sports-providers';

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

  const allProviders = providerRegistry.getAll();
  const targetProviders = options.providers
    ? allProviders.filter((p) => options.providers!.includes(p.config.id))
    : allProviders;

  const targetSports = options.sports || ['football', 'basketball', 'f1'];

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

  // 1) Sync leagues/competitions
  try {
    const competitions = await provider.getCompetitions(sport);
    for (const comp of competitions) {
      const slug = slugify(comp.name);
      const existing = await db.league.findUnique({ where: { slug } });
      if (existing) {
        await db.league.update({
          where: { id: existing.id },
          data: {
            name: comp.name,
            country: comp.country,
            type: comp.type,
            externalId: comp.id,
            source: provider.config.id,
          },
        });
        result.leaguesUpdated++;
      } else {
        await db.league.create({
          data: {
            name: comp.name,
            slug,
            country: comp.country,
            type: comp.type,
            externalId: comp.id,
            source: provider.config.id,
            verified: false,
            createdByAI: false,
          },
        });
        result.leaguesCreated++;
      }
    }
  } catch (err) {
    result.errors.push(`leagues: ${err}`);
  }

  // 2) Sync teams
  try {
    const teams = await provider.getTeams(sport, {});
    for (const t of teams) {
      const slug = slugify(t.name);
      if (!slug) continue;
      const existing = await db.team.findUnique({ where: { slug } });
      if (existing) {
        await db.team.update({
          where: { id: existing.id },
          data: {
            logoUrl: t.logo,
            country: t.country,
            venue: t.venue,
            externalId: t.id,
            source: provider.config.id,
          },
        });
        result.teamsUpdated++;
      } else {
        try {
          await db.team.create({
            data: {
              name: t.name,
              slug,
              country: t.country,
              venue: t.venue,
              logoUrl: t.logo,
              externalId: t.id,
              source: provider.config.id,
              verified: false,
              createdByAI: false,
            },
          });
          result.teamsCreated++;
        } catch {
          // Skip duplicates
        }
      }
    }
  } catch (err) {
    result.errors.push(`teams: ${err}`);
  }

  // 3) Sync players (only for providers that support it — TheSportsDB)
  try {
    if (typeof provider.getPlayers === 'function') {
      // Use a popular search to seed some players
      const players = await provider.getPlayers(sport, { search: 'A' });
      for (const p of players.slice(0, 50)) {
        const slug = slugify(p.name);
        if (!slug) continue;
        const existing = await db.player.findUnique({ where: { slug } });
        if (existing) {
          await db.player.update({
            where: { id: existing.id },
            data: {
              photoUrl: p.photo,
              nationality: p.nationality,
              position: p.position,
              externalId: p.id,
              source: provider.config.id,
            },
          });
          result.playersUpdated++;
        } else {
          try {
            await db.player.create({
              data: {
                name: p.name,
                slug,
                nationality: p.nationality,
                position: p.position,
                photoUrl: p.photo,
                externalId: p.id,
                source: provider.config.id,
                verified: false,
                createdByAI: false,
              },
            });
            result.playersCreated++;
          } catch {
            // Skip duplicates
          }
        }
      }
    }
  } catch (err) {
    result.errors.push(`players: ${err}`);
  }

  // 4) Sync matches (next 15 fixtures + live)
  try {
    const fixtures = await provider.getFixtures(sport, {});
    for (const f of fixtures) {
      const extId = `${provider.config.id}:${f.id}`;
      const existing = await db.matchProfile.findFirst({
        where: { externalId: extId },
      });
      if (existing) {
        await db.matchProfile.update({
          where: { id: existing.id },
          data: {
            homeScore: f.homeScore,
            awayScore: f.awayScore,
            status: f.status,
            minute: f.minute,
            events: f.events || [],
            kickoffAt: new Date(f.kickoffAt),
          },
        });
        result.matchesUpdated++;
      } else {
        try {
          await db.matchProfile.create({
            data: {
              homeTeamName: f.homeTeam,
              awayTeamName: f.awayTeam,
              homeScore: f.homeScore,
              awayScore: f.awayScore,
              status: f.status,
              minute: f.minute,
              venue: f.venue,
              kickoffAt: new Date(f.kickoffAt),
              events: f.events || [],
              externalId: extId,
              source: provider.config.id,
              createdByAI: false,
            },
          });
          result.matchesCreated++;
        } catch {
          // Skip
        }
      }
    }
  } catch (err) {
    result.errors.push(`matches: ${err}`);
  }

  return result;
}
