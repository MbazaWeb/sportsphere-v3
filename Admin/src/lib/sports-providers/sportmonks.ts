// ─── SportSphere Admin — Sportmonks Football API v3 ───────────
// Paid / free-plan gated by SPORTMONKS_API_TOKEN.
// Free plan: Danish Superliga + Scottish Premiership only.
// Paid: leagues in your MySportmonks subscription.
// If token is missing, methods return empty arrays (sync skips cleanly).

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

const BASE = "https://api.sportmonks.com/v3/football";

export const SPORTMONKS_CONFIG: SportProviderConfig = {
  id: "sportmonks",
  name: "Sportmonks",
  baseUrl: BASE,
  apiKey: process.env.SPORTMONKS_API_TOKEN || undefined,
  freeTier: true, // free plan exists but is league-limited
  supportedSports: ["football"],
  rateLimit: { requests: 2000, per: "hour" },
};

function mapState(stateId?: number, stateName?: string): ProviderFixture["status"] {
  const n = (stateName || "").toLowerCase();
  if (n.includes("live") || n.includes("inplay") || n.includes("in play")) return "live";
  if (n.includes("ft") || n.includes("full") || n.includes("finished") || n.includes("ended"))
    return "finished";
  if (n.includes("postpon")) return "postponed";
  if (n.includes("cancel")) return "cancelled";
  // common Sportmonks state ids (approx): 1 NS, 2 INPLAY, 5 FT, etc.
  if (stateId === 2 || stateId === 3 || stateId === 22) return "live";
  if (stateId === 5 || stateId === 7 || stateId === 8) return "finished";
  return "upcoming";
}

export class SportmonksProvider implements SportsDataProvider {
  readonly config = SPORTMONKS_CONFIG;
  private token: string;

  constructor(token?: string) {
    this.token =
      token ||
      process.env.SPORTMONKS_API_TOKEN ||
      process.env.SPORTMONKS_TOKEN ||
      "";
  }

  hasToken(): boolean {
    return Boolean(this.token && this.token.trim().length > 0);
  }

  private async request(path: string, query: Record<string, string> = {}): Promise<any> {
    if (!this.hasToken()) {
      throw new Error(
        "Sportmonks: set SPORTMONKS_API_TOKEN in Admin .env (paid or free plan token from MySportmonks)"
      );
    }
    const url = new URL(`${BASE}${path.startsWith("/") ? path : `/${path}`}`);
    url.searchParams.set("api_token", this.token);
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== "") url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(25000),
      headers: { Accept: "application/json" },
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error("Sportmonks: invalid token or plan does not allow this resource");
    }
    if (res.status === 429) {
      throw new Error("Sportmonks: rate limit exceeded — retry later");
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Sportmonks ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }

  async isAvailable(): Promise<boolean> {
    if (!this.hasToken()) return false;
    try {
      await this.request("/leagues", { per_page: "1" });
      return true;
    } catch {
      return false;
    }
  }

  async getCompetitions(sport: string): Promise<ProviderCompetition[]> {
    if (sport !== "football" || !this.hasToken()) return [];
    const data = await this.request("/leagues", { per_page: "50" });
    return (data.data || []).map((l: any) => ({
      id: String(l.id),
      name: l.name,
      country: l.country?.name || undefined,
      logo: l.image_path || undefined,
      type: (l.type || "league").toLowerCase().includes("cup") ? "cup" : "league",
    }));
  }

  async getFixtures(
    sport: string,
    params: { date?: string; league?: string; team?: string; live?: boolean } = {}
  ): Promise<ProviderFixture[]> {
    if (sport !== "football" || !this.hasToken()) return [];

    let path = "/fixtures";
    const query: Record<string, string> = {
      include: "participants;scores;state;league",
      per_page: "25",
    };

    if (params.date) {
      path = `/fixtures/date/${params.date}`;
    } else if (params.live) {
      path = "/livescores/inplay";
    } else {
      // upcoming window: today
      const today = new Date().toISOString().slice(0, 10);
      path = `/fixtures/date/${today}`;
    }

    const data = await this.request(path, query);
    const rows = data.data || [];
    return rows.map((f: any) => {
      const parts = f.participants || [];
      const home =
        parts.find((p: any) => p.meta?.location === "home") || parts[0];
      const away =
        parts.find((p: any) => p.meta?.location === "away") || parts[1];
      const scores = f.scores || [];
      const homeScore =
        scores.find((s: any) => s.description === "CURRENT" && s.score?.participant === "home")
          ?.score?.goals ??
        scores.find((s: any) => s.score?.participant === "home")?.score?.goals ??
        null;
      const awayScore =
        scores.find((s: any) => s.description === "CURRENT" && s.score?.participant === "away")
          ?.score?.goals ??
        scores.find((s: any) => s.score?.participant === "away")?.score?.goals ??
        null;
      return {
        id: String(f.id),
        sport: "football",
        league: f.league?.name || "Unknown",
        leagueId: f.league_id ? String(f.league_id) : undefined,
        homeTeam: home?.name || "",
        awayTeam: away?.name || "",
        homeScore: homeScore != null ? Number(homeScore) : null,
        awayScore: awayScore != null ? Number(awayScore) : null,
        status: mapState(f.state_id, f.state?.name || f.state?.developer_name),
        kickoffAt: f.starting_at || f.starting_at_timestamp
          ? new Date(
              f.starting_at || f.starting_at_timestamp * 1000
            ).toISOString()
          : new Date().toISOString(),
        events: [],
      } satisfies ProviderFixture;
    });
  }

  async getFixtureById(
    _sport: string,
    fixtureId: string
  ): Promise<ProviderFixture | null> {
    if (!this.hasToken()) return null;
    try {
      const data = await this.request(`/fixtures/${fixtureId}`, {
        include: "participants;scores;state;league",
      });
      const list = await this.getFixtures("football", {});
      const hit = list.find((x) => x.id === String(fixtureId));
      if (hit) return hit;
      const f = data.data;
      if (!f) return null;
      return {
        id: String(f.id),
        sport: "football",
        league: f.league?.name || "",
        homeTeam: "",
        awayTeam: "",
        homeScore: null,
        awayScore: null,
        status: mapState(f.state_id, f.state?.name),
        kickoffAt: f.starting_at || new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  async getStandings(sport: string, league: string): Promise<ProviderStanding[]> {
    if (sport !== "football" || !this.hasToken()) return [];
    // league param may be season id for Sportmonks; best-effort
    try {
      const data = await this.request(`/standings/seasons/${encodeURIComponent(league)}`);
      const rows = data.data || [];
      return rows.map((r: any, i: number) => ({
        position: r.position ?? i + 1,
        team: r.participant?.name || r.team?.name || "",
        played: r.details?.find?.((d: any) => d.type?.code === "overall-matches-played")?.value ?? 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: r.points ?? 0,
      }));
    } catch {
      return [];
    }
  }

  async getTeams(
    sport: string,
    params: { league?: string; search?: string } = {}
  ): Promise<ProviderTeam[]> {
    if (sport !== "football" || !this.hasToken()) return [];
    if (params.search) {
      const data = await this.request(
        `/teams/search/${encodeURIComponent(params.search)}`,
        { per_page: "25" }
      );
      return (data.data || []).map((t: any) => ({
        id: String(t.id),
        name: t.name,
        logo: t.image_path,
        country: t.country?.name,
        venue: undefined,
      }));
    }
    const data = await this.request("/teams", { per_page: "25" });
    return (data.data || []).map((t: any) => ({
      id: String(t.id),
      name: t.name,
      logo: t.image_path,
      country: t.country?.name,
    }));
  }

  async getTeamById(_sport: string, teamId: string): Promise<ProviderTeam | null> {
    if (!this.hasToken()) return null;
    try {
      const data = await this.request(`/teams/${teamId}`);
      const t = data.data;
      if (!t) return null;
      return {
        id: String(t.id),
        name: t.name,
        logo: t.image_path,
        country: t.country?.name,
      };
    } catch {
      return null;
    }
  }

  async getPlayers(
    sport: string,
    params: { team?: string; search?: string } = {}
  ): Promise<ProviderPlayer[]> {
    if (sport !== "football" || !this.hasToken()) return [];
    if (params.search) {
      const data = await this.request(
        `/players/search/${encodeURIComponent(params.search)}`,
        { per_page: "25" }
      );
      return (data.data || []).map((p: any) => ({
        id: String(p.id),
        name: p.display_name || p.name,
        position: p.position?.name,
        nationality: p.nationality?.name,
        photo: p.image_path,
      }));
    }
    if (params.team) {
      // squad by team
      const data = await this.request(`/squads/teams/${params.team}`, {
        include: "player;player.nationality;player.position",
        per_page: "50",
      });
      return (data.data || []).map((row: any) => {
        const p = row.player || {};
        return {
          id: String(p.id || row.player_id),
          name: p.display_name || p.name || "Unknown",
          team: undefined,
          position: p.position?.name || row.position?.name,
          nationality: p.nationality?.name,
          photo: p.image_path,
        };
      });
    }
    return [];
  }

  async getTopScorers(): Promise<ProviderTopScorer[]> {
    return [];
  }

  /** Coaches for a team (paid coverage). Empty if no token or no data. */
  async getTeamCoaches(teamId: string): Promise<
    { id: string; name: string; nationality?: string; role?: string }[]
  > {
    if (!this.hasToken()) return [];
    try {
      const data = await this.request(`/teams/${teamId}`, {
        include: "coaches;coaches.nationality",
      });
      const coaches = data.data?.coaches || data.coaches || [];
      return (Array.isArray(coaches) ? coaches : []).map((c: any) => ({
        id: String(c.id),
        name: c.display_name || c.name || `${c.firstname || ""} ${c.lastname || ""}`.trim(),
        nationality: c.nationality?.name,
        role: "coach",
      }));
    } catch {
      return [];
    }
  }
}
