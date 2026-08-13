// ─── SportSphere Admin — football-data.org (v4) ───────────────
// Implements SportsDataProvider. Auth: X-Auth-Token.
// Env: FOOTBALL_DATA_ORG_TOKEN (falls back to free-tier token if set in code env).

import type {
  SportsDataProvider,
  SportProviderConfig,
  ProviderFixture,
  ProviderStanding,
  ProviderTeam,
  ProviderPlayer,
  ProviderTopScorer,
  ProviderCompetition,
} from "./provider-interface";

const BASE_URL = "https://api.football-data.org/v4";

/** Default free-tier competitions (codes) — keep list small for rate limits */
const DEFAULT_COMPETITION_CODES = ["PL", "BL1", "PD", "SA", "FL1", "CL"];

function mapMatchStatus(status: string): ProviderFixture["status"] {
  const s = (status || "").toUpperCase();
  if (s === "SCHEDULED" || s === "TIMED") return "upcoming";
  if (s === "IN_PLAY" || s === "PAUSED" || s === "LIVE") return "live";
  if (s === "FINISHED" || s === "AWARDED") return "finished";
  if (s === "POSTPONED") return "postponed";
  if (s === "CANCELLED" || s === "CANCELED") return "cancelled";
  return "upcoming";
}

export const FOOTBALL_DATA_ORG_CONFIG: SportProviderConfig = {
  id: "football-data-org",
  name: "football-data.org",
  baseUrl: BASE_URL,
  apiKey: process.env.FOOTBALL_DATA_ORG_TOKEN || undefined,
  freeTier: true,
  supportedSports: ["football"],
  rateLimit: { requests: 10, per: "minute" },
};

export class FootballDataOrgProvider implements SportsDataProvider {
  readonly config = FOOTBALL_DATA_ORG_CONFIG;
  private token: string;

  constructor(token?: string) {
    this.token =
      token ||
      process.env.FOOTBALL_DATA_ORG_TOKEN ||
      process.env.FOOTBALL_DATA_API_KEY ||
      "";
  }

  private headers(): HeadersInit {
    const h: HeadersInit = { Accept: "application/json" };
    if (this.token) h["X-Auth-Token"] = this.token;
    return h;
  }

  async request(path: string): Promise<any> {
    if (!this.token) {
      throw new Error(
        "football-data.org: missing FOOTBALL_DATA_ORG_TOKEN (set in Admin .env)"
      );
    }
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `football-data.org ${res.status}: ${text.slice(0, 220)}`
      );
    }
    return res.json();
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.request("/competitions");
      return true;
    } catch {
      return false;
    }
  }

  async getCompetitions(sport: string): Promise<ProviderCompetition[]> {
    if (sport !== "football") return [];
    const data = await this.request("/competitions");
    return (data.competitions || []).map((c: any) => ({
      id: String(c.id),
      name: c.name,
      country: c.area?.name,
      logo: c.emblem || undefined,
      type: (c.type || "league").toLowerCase().includes("cup")
        ? "cup"
        : "league",
    }));
  }

  async getFixtures(
    sport: string,
    params: { date?: string; league?: string; team?: string; live?: boolean } = {}
  ): Promise<ProviderFixture[]> {
    if (sport !== "football") return [];

    const codes = params.league
      ? [params.league]
      : DEFAULT_COMPETITION_CODES.slice(0, 3); // rate-limit friendly

    const out: ProviderFixture[] = [];
    for (const code of codes) {
      try {
        const statusQ = params.live ? "IN_PLAY" : "SCHEDULED,TIMED,IN_PLAY,FINISHED";
        const data = await this.request(
          `/competitions/${encodeURIComponent(code)}/matches?status=${statusQ}`
        );
        for (const m of data.matches || []) {
          out.push({
            id: String(m.id),
            sport: "football",
            league: m.competition?.name || code,
            leagueId: m.competition?.id ? String(m.competition.id) : code,
            homeTeam: m.homeTeam?.name || "",
            awayTeam: m.awayTeam?.name || "",
            homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? null,
            awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? null,
            status: mapMatchStatus(m.status),
            venue: undefined,
            kickoffAt: m.utcDate,
            events: [],
          });
        }
      } catch (err) {
        // continue other leagues; surface via empty + caller errors
        console.warn(`football-data fixtures ${code}:`, err);
      }
    }
    return out;
  }

  async getFixtureById(
    _sport: string,
    fixtureId: string
  ): Promise<ProviderFixture | null> {
    try {
      const m = await this.request(`/matches/${encodeURIComponent(fixtureId)}`);
      return {
        id: String(m.id),
        sport: "football",
        league: m.competition?.name || "",
        leagueId: m.competition?.id ? String(m.competition.id) : undefined,
        homeTeam: m.homeTeam?.name || "",
        awayTeam: m.awayTeam?.name || "",
        homeScore: m.score?.fullTime?.home ?? null,
        awayScore: m.score?.fullTime?.away ?? null,
        status: mapMatchStatus(m.status),
        kickoffAt: m.utcDate,
        events: [],
      };
    } catch {
      return null;
    }
  }

  async getStandings(
    sport: string,
    league: string
  ): Promise<ProviderStanding[]> {
    if (sport !== "football") return [];
    try {
      const data = await this.request(
        `/competitions/${encodeURIComponent(league)}/standings`
      );
      const table = data.standings?.[0]?.table || [];
      return table.map((row: any) => ({
        position: row.position,
        team: row.team?.name || "",
        played: row.playedGames,
        won: row.won,
        drawn: row.draw,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        points: row.points,
        form: row.form || undefined,
      }));
    } catch {
      return [];
    }
  }

  async getTeams(
    sport: string,
    params: { league?: string; search?: string } = {}
  ): Promise<ProviderTeam[]> {
    if (sport !== "football") return [];
    const league = params.league || "PL";
    const data = await this.request(
      `/competitions/${encodeURIComponent(league)}/teams`
    );
    let teams = (data.teams || []).map((t: any) => ({
      id: String(t.id),
      name: t.name,
      logo: t.crest || undefined,
      country: t.area?.name,
      venue: t.venue || undefined,
    }));
    if (params.search) {
      const q = params.search.toLowerCase();
      teams = teams.filter((t: ProviderTeam) =>
        t.name.toLowerCase().includes(q)
      );
    }
    return teams;
  }

  async getTeamById(
    _sport: string,
    teamId: string
  ): Promise<ProviderTeam | null> {
    try {
      const t = await this.request(`/teams/${encodeURIComponent(teamId)}`);
      return {
        id: String(t.id),
        name: t.name,
        logo: t.crest || undefined,
        country: t.area?.name,
        venue: t.venue || undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Players: load squads for a limited set of teams to respect free-tier rate limits.
   * params.team = football-data team id → single squad
   */
  async getPlayers(
    sport: string,
    params: { team?: string; search?: string } = {}
  ): Promise<ProviderPlayer[]> {
    if (sport !== "football") return [];

    if (params.team) {
      const data = await this.request(`/teams/${encodeURIComponent(params.team)}`);
      return (data.squad || [])
        .filter((p: any) => p.position && p.position !== "Coach")
        .map((p: any) => ({
          id: String(p.id),
          name: p.name,
          team: data.name,
          position: p.position,
          nationality: p.nationality,
          photo: undefined,
        }));
    }

    // Sample PL teams only (rate limit)
    try {
      const teamsData = await this.request("/competitions/PL/teams");
      const teams = (teamsData.teams || []).slice(0, 3);
      const players: ProviderPlayer[] = [];
      for (const t of teams) {
        try {
          const data = await this.request(`/teams/${t.id}`);
          for (const p of data.squad || []) {
            if (!p.position || p.position === "Coach") continue;
            players.push({
              id: String(p.id),
              name: p.name,
              team: t.name,
              position: p.position,
              nationality: p.nationality,
            });
          }
        } catch {
          /* skip team on error */
        }
      }
      return players;
    } catch {
      return [];
    }
  }

  async getTopScorers(
    sport: string,
    league: string
  ): Promise<ProviderTopScorer[]> {
    if (sport !== "football") return [];
    try {
      const data = await this.request(
        `/competitions/${encodeURIComponent(league)}/scorers`
      );
      return (data.scorers || []).map((s: any, i: number) => ({
        rank: i + 1,
        player: s.player?.name || "",
        team: s.team?.name || "",
        goals: s.goals ?? 0,
        assists: s.assists ?? undefined,
        played: s.playedMatches ?? undefined,
      }));
    } catch {
      return [];
    }
  }

  /** Extra: squad + coach for a team (used by sync for Coach upsert) */
  async getSquad(teamId: string): Promise<{
    players: ProviderPlayer[];
    coach: {
      id: string;
      name: string;
      nationality?: string;
      dateOfBirth?: string;
    } | null;
  }> {
    const data = await this.request(`/teams/${encodeURIComponent(teamId)}`);
    const players = (data.squad || [])
      .filter((p: any) => p.position && p.position !== "Coach")
      .map((p: any) => ({
        id: String(p.id),
        name: p.name,
        team: data.name,
        position: p.position,
        nationality: p.nationality,
      }));
    const coach = data.coach
      ? {
          id: String(data.coach.id || `coach-${data.id}`),
          name: data.coach.name,
          nationality: data.coach.nationality,
          dateOfBirth: data.coach.dateOfBirth,
        }
      : null;
    return { players, coach };
  }
}
