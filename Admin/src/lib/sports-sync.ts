import { randomUUID } from "crypto";
import {
  providerRegistry,
  TheSportsDBProvider,
  OpenLigaDBProvider,
  ErgastF1Provider,
  FootballDataOrgProvider,
  SportmonksProvider,
  type SportsDataProvider,
  type ProviderFixture,
  type ProviderCompetition,
  type ProviderTeam,
  type ProviderPlayer,
} from "./sports-providers";
import { db } from "@/lib/db";

export function initializeProviders() {
  if (providerRegistry.getAll().length === 0) {
    providerRegistry.register(new TheSportsDBProvider());
    providerRegistry.register(new OpenLigaDBProvider());
    providerRegistry.register(new ErgastF1Provider());
    providerRegistry.register(new FootballDataOrgProvider());
    providerRegistry.register(new SportmonksProvider());
  }
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export interface SyncResult {
  provider: string;
  sport: string;
  leaguesCreated: number;
  leaguesUpdated: number;
  teamsCreated: number;
  teamsUpdated: number;
  playersCreated: number;
  playersUpdated: number;
  coachesCreated: number;
  coachesUpdated: number;
  matchesCreated: number;
  matchesUpdated: number;
  errors: string[];
}

async function ensureSport(slug: string, name?: string) {
  const existing = await db.sport.findFirst({
    where: { OR: [{ slug }, { name: { equals: name || slug, mode: "insensitive" } }] },
  });
  if (existing) return existing;
  try {
    return await db.sport.create({
      data: {
        name: name || slug.charAt(0).toUpperCase() + slug.slice(1),
        slug,
        icon: slug === "football" ? "⚽" : slug === "f1" || slug === "motorsport" ? "🏎️" : "🏆",
        isActive: true,
      },
    });
  } catch {
    return db.sport.findFirst({ where: { slug } });
  }
}

async function upsertLeague(
  sportId: string,
  c: ProviderCompetition,
  source: string,
  result: SyncResult
) {
  const slug = slugify(c.name) || randomUUID().slice(0, 8);
  const externalId = c.id || null;
  const existing = externalId
    ? await db.league.findFirst({ where: { externalId, source } })
    : await db.league.findFirst({ where: { slug, sportId } });

  if (existing) {
    await db.league.update({
      where: { id: existing.id },
      data: {
        name: c.name,
        country: c.country || existing.country,
        logoUrl: c.logo || existing.logoUrl,
        type: c.type || existing.type,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    result.leaguesUpdated++;
    return existing.id;
  }

  const id = randomUUID();
  await db.league.create({
    data: {
      id,
      sportId,
      name: c.name,
      slug: `${slug}-${id.slice(0, 6)}`,
      country: c.country || null,
      logoUrl: c.logo || null,
      type: c.type || "league",
      externalId,
      source,
      verified: false,
      createdByAI: false,
      isActive: true,
      updatedAt: new Date(),
    },
  });
  result.leaguesCreated++;
  return id;
}

async function upsertTeam(
  sportId: string,
  leagueId: string | null,
  t: ProviderTeam,
  source: string,
  result: SyncResult
) {
  const slug = slugify(t.name) || randomUUID().slice(0, 8);
  const externalId = t.id || null;
  const existing = externalId
    ? await db.team.findFirst({ where: { externalId, source } })
    : await db.team.findFirst({ where: { slug, sportId } });

  if (existing) {
    await db.team.update({
      where: { id: existing.id },
      data: {
        name: t.name,
        logoUrl: t.logo || existing.logoUrl,
        country: t.country || existing.country,
        venue: t.venue || existing.venue,
        leagueId: leagueId || existing.leagueId,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    result.teamsUpdated++;
    return existing.id;
  }

  const id = randomUUID();
  await db.team.create({
    data: {
      id,
      sportId,
      leagueId,
      name: t.name,
      slug: `${slug}-${id.slice(0, 6)}`,
      logoUrl: t.logo || null,
      country: t.country || null,
      venue: t.venue || null,
      externalId,
      source,
      verified: false,
      createdByAI: false,
      isActive: true,
      updatedAt: new Date(),
    },
  });
  result.teamsCreated++;
  return id;
}

async function upsertPlayer(
  sportId: string,
  teamId: string | null,
  leagueId: string | null,
  p: ProviderPlayer,
  source: string,
  result: SyncResult
) {
  const slug = slugify(p.name) || randomUUID().slice(0, 8);
  const externalId = p.id || null;
  const existing = externalId
    ? await db.player.findFirst({ where: { externalId, source } })
    : await db.player.findFirst({ where: { slug, sportId } });

  if (existing) {
    await db.player.update({
      where: { id: existing.id },
      data: {
        name: p.name,
        position: p.position || existing.position,
        nationality: p.nationality || existing.nationality,
        photoUrl: p.photo || existing.photoUrl,
        teamId: teamId || existing.teamId,
        leagueId: leagueId || existing.leagueId,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    result.playersUpdated++;
    return existing.id;
  }

  const id = randomUUID();
  await db.player.create({
    data: {
      id,
      sportId,
      teamId,
      leagueId,
      name: p.name,
      slug: `${slug}-${id.slice(0, 6)}`,
      position: p.position || null,
      nationality: p.nationality || null,
      photoUrl: p.photo || null,
      externalId,
      source,
      verified: false,
      createdByAI: false,
      isActive: true,
      updatedAt: new Date(),
    },
  });
  result.playersCreated++;
  return id;
}

async function upsertMatchLegacy(f: ProviderFixture, result: SyncResult) {
  if (!f.homeTeam || !f.awayTeam) return;
  const kickoffDate = f.kickoffAt ? new Date(f.kickoffAt) : new Date();
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
        league: f.league || existing.league,
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
        continent: null,
        country: null,
        events: f.events || [],
      },
    });
    result.matchesCreated++;
  }
}


async function upsertCoach(
  sportId: string,
  teamId: string | null,
  leagueId: string | null,
  coach: { id: string; name: string; nationality?: string; dateOfBirth?: string },
  source: string,
  result: SyncResult
) {
  const slug = slugify(coach.name) || randomUUID().slice(0, 8);
  const externalId = coach.id || null;
  const existing = externalId
    ? await db.coach.findFirst({ where: { externalId, source } })
    : await db.coach.findFirst({ where: { slug, sportId } });

  if (existing) {
    await db.coach.update({
      where: { id: existing.id },
      data: {
        name: coach.name,
        nationality: coach.nationality || existing.nationality,
        teamId: teamId || existing.teamId,
        leagueId: leagueId || existing.leagueId,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    result.coachesUpdated++;
    return existing.id;
  }

  const id = randomUUID();
  await db.coach.create({
    data: {
      id,
      sportId,
      teamId,
      leagueId,
      name: coach.name,
      slug: `${slug}-${id.slice(0, 6)}`,
      nationality: coach.nationality || null,
      role: "head_coach",
      externalId,
      source,
      verified: false,
      createdByAI: false,
      isActive: true,
      updatedAt: new Date(),
    },
  });
  result.coachesCreated++;
  return id;
}

async function syncProviderSport(
  provider: SportsDataProvider,
  sport: string
): Promise<SyncResult> {
  const result: SyncResult = {
    provider: provider.config.id,
    sport,
    leaguesCreated: 0,
    leaguesUpdated: 0,
    teamsCreated: 0,
    teamsUpdated: 0,
    playersCreated: 0,
    playersUpdated: 0,
    coachesCreated: 0,
    coachesUpdated: 0,
    matchesCreated: 0,
    matchesUpdated: 0,
    errors: [],
  };

  const source = provider.config.id;

  // Sportmonks: only run when SPORTMONKS_API_TOKEN is configured (paid or free plan)
  if (source === "sportmonks") {
    const sm = provider as SportmonksProvider;
    if (typeof sm.hasToken === "function" && !sm.hasToken()) {
      result.errors.push(
        "Sportmonks skipped: set SPORTMONKS_API_TOKEN in Admin .env after subscribing (or free plan)"
      );
      return result;
    }
  }

  let sportRow: { id: string } | null = null;
  try {
    sportRow = await ensureSport(sport);
  } catch (err) {
    result.errors.push(`sport ensure: ${String(err)}`);
  }
  const sportId = sportRow?.id;
  if (!sportId) {
    result.errors.push("Could not resolve sport id");
    return result;
  }

  const leagueIdByName = new Map<string, string>();

  // 1) Competitions / leagues
  try {
    if (typeof provider.getCompetitions === "function") {
      const comps = await provider.getCompetitions(sport);
      for (const c of comps || []) {
        try {
          const id = await upsertLeague(sportId, c, source, result);
          leagueIdByName.set(c.name.toLowerCase(), id);
        } catch (err) {
          result.errors.push(`league ${c.name}: ${String(err)}`);
        }
      }
    }
  } catch (err) {
    result.errors.push(`competitions: ${String(err)}`);
  }

  // 2) Fixtures → matches + discover league/team names
  try {
    const fixtures = await provider.getFixtures(sport, {});
    for (const f of fixtures || []) {
      try {
        // Ensure league from fixture
        if (f.league && !leagueIdByName.has(f.league.toLowerCase())) {
          const id = await upsertLeague(
            sportId,
            {
              id: f.leagueId || slugify(f.league),
              name: f.league,
              type: "league",
            },
            source,
            result
          );
          leagueIdByName.set(f.league.toLowerCase(), id);
        }
        const leagueId = f.league
          ? leagueIdByName.get(f.league.toLowerCase()) || null
          : null;

        // Upsert home/away as teams
        if (f.homeTeam) {
          try {
            await upsertTeam(
              sportId,
              leagueId,
              { id: `home-${slugify(f.homeTeam)}`, name: f.homeTeam },
              source,
              result
            );
          } catch (err) {
            result.errors.push(`team ${f.homeTeam}: ${String(err)}`);
          }
        }
        if (f.awayTeam) {
          try {
            await upsertTeam(
              sportId,
              leagueId,
              { id: `away-${slugify(f.awayTeam)}`, name: f.awayTeam },
              source,
              result
            );
          } catch (err) {
            result.errors.push(`team ${f.awayTeam}: ${String(err)}`);
          }
        }

        await upsertMatchLegacy(f, result);
      } catch (err) {
        result.errors.push(`fixture: ${String(err)}`);
      }
    }
  } catch (err) {
    result.errors.push(`fixtures: ${String(err)}`);
  }

  // 3) Teams from provider (if available)
  try {
    if (typeof provider.getTeams === "function") {
      const teams = await provider.getTeams(sport, {});
      for (const t of teams || []) {
        try {
          await upsertTeam(sportId, null, t, source, result);
        } catch (err) {
          result.errors.push(`team list ${t.name}: ${String(err)}`);
        }
      }
    }
  } catch (err) {
    result.errors.push(`teams: ${String(err)}`);
  }

  // 4) Players
  try {
    if (typeof provider.getPlayers === "function") {
      const players = await provider.getPlayers(sport, {});
      for (const p of players || []) {
        try {
          let teamId: string | null = null;
          if (p.team) {
            teamId = await upsertTeam(
              sportId,
              null,
              { id: slugify(p.team), name: p.team },
              source,
              result
            );
          }
          await upsertPlayer(sportId, teamId, null, p, source, result);
        } catch (err) {
          result.errors.push(`player ${p.name}: ${String(err)}`);
        }
      }
    }
  } catch (err) {
    result.errors.push(`players: ${String(err)}`);
  }

  // 5) football-data.org squads → players + coaches (rate-limit: first 5 PL teams)
  try {
    if (provider.config.id === "football-data-org" && typeof (provider as any).getSquad === "function") {
      const fd = provider as FootballDataOrgProvider;
      const teams = await fd.getTeams(sport, { league: "PL" });
      for (const t of (teams || []).slice(0, 5)) {
        try {
          const teamId = await upsertTeam(sportId, null, t, source, result);
          const squad = await fd.getSquad(t.id);
          for (const p of squad.players || []) {
            try {
              await upsertPlayer(sportId, teamId, null, p, source, result);
            } catch (err) {
              result.errors.push(`fd player ${p.name}: ${String(err)}`);
            }
          }
          if (squad.coach) {
            try {
              await upsertCoach(sportId, teamId, null, squad.coach, source, result);
            } catch (err) {
              result.errors.push(`fd coach ${squad.coach.name}: ${String(err)}`);
            }
          }
        } catch (err) {
          result.errors.push(`fd squad ${t.name}: ${String(err)}`);
        }
      }
    }
  } catch (err) {
    result.errors.push(`football-data squads: ${String(err)}`);
  }

  // 6) Sportmonks coaches (when token + plan allow)
  try {
    if (provider.config.id === "sportmonks" && typeof (provider as any).getTeamCoaches === "function") {
      const sm = provider as SportmonksProvider;
      const teams = await sm.getTeams(sport, {});
      for (const t of (teams || []).slice(0, 5)) {
        try {
          const teamId = await upsertTeam(sportId, null, t, source, result);
          const coaches = await sm.getTeamCoaches(t.id);
          for (const coach of coaches) {
            if (!coach.name) continue;
            try {
              await upsertCoach(
                sportId,
                teamId,
                null,
                { id: coach.id, name: coach.name, nationality: coach.nationality },
                source,
                result
              );
            } catch (err) {
              result.errors.push(`sm coach ${coach.name}: ${String(err)}`);
            }
          }
        } catch (err) {
          result.errors.push(`sm team coaches ${t.name}: ${String(err)}`);
        }
      }
    }
  } catch (err) {
    result.errors.push(`sportmonks coaches: ${String(err)}`);
  }


  return result;
}

export async function syncFromProviders(
  options: { providers?: string[]; sports?: string[] } = {}
): Promise<SyncResult[]> {
  initializeProviders();
  const results: SyncResult[] = [];
  let allProviders = providerRegistry.getAll();
  if (allProviders.length === 0) {
    allProviders = [
      new TheSportsDBProvider(),
      new OpenLigaDBProvider(),
      new ErgastF1Provider(),
      new FootballDataOrgProvider(),
      new SportmonksProvider(),
    ];
  }
  const targetProviders = options.providers
    ? allProviders.filter((p) => options.providers!.includes(p.config.id))
    : allProviders;

  const targetSports =
    options.sports || ["football", "basketball", "f1", "motorsport"];

  for (const provider of targetProviders) {
    for (const sport of targetSports) {
      if (!provider.config.supportedSports.includes(sport)) continue;
      try {
        results.push(await syncProviderSport(provider, sport));
      } catch (err) {
        results.push({
          provider: provider.config.id,
          sport,
          leaguesCreated: 0,
          leaguesUpdated: 0,
          teamsCreated: 0,
          teamsUpdated: 0,
          playersCreated: 0,
          playersUpdated: 0,
          coachesCreated: 0,
          coachesUpdated: 0,
          matchesCreated: 0,
          matchesUpdated: 0,
          errors: [String(err)],
        });
      }
    }
  }

  return results;
}

/** Entity inventory for the admin dashboard */
export async function getSportsInventory() {
  const [
    matches,
    upcoming,
    live,
    finished,
    leagues,
    teams,
    players,
    coaches,
    sports,
    matchProfiles,
    recentMatches,
    topLeagues,
    recentLeagues,
    recentTeams,
    recentPlayers,
    recentCoaches,
  ] = await Promise.all([
    db.match.count(),
    db.match.count({ where: { status: "upcoming" } }),
    db.match.count({ where: { status: "live" } }),
    db.match.count({ where: { status: "finished" } }),
    db.league.count(),
    db.team.count(),
    db.player.count(),
    db.coach.count(),
    db.sport.count({ where: { isActive: true } }),
    db.matchProfile.count(),
    db.match.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        league: true,
        homeTeam: true,
        awayTeam: true,
        kickoffAt: true,
        status: true,
        homeScore: true,
        awayScore: true,
      },
    }),
    db.match.groupBy({
      by: ["league"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 12,
    }),
    db.league.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, name: true, country: true, source: true, isActive: true, updatedAt: true },
    }),
    db.team.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, name: true, country: true, source: true, logoUrl: true, updatedAt: true },
    }),
    db.player.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, name: true, position: true, nationality: true, source: true, updatedAt: true },
    }),
    db.coach.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, name: true, role: true, nationality: true, source: true, updatedAt: true },
    }),
  ]);

  return {
    stats: {
      totalMatches: matches,
      upcomingMatches: upcoming,
      liveMatches: live,
      completedMatches: finished,
      leagues,
      teams,
      players,
      coaches,
      activeSports: sports,
      matchProfiles,
    },
    leagues: topLeagues.map((item) => ({
      name: item.league,
      count: item._count.id,
    })),
    recentMatches,
    recentLeagues,
    recentTeams,
    recentPlayers,
    recentCoaches,
  };
}
