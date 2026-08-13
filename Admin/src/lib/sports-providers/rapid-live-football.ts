// RapidAPI: free-api-live-football-data
// Env: RAPIDAPI_KEY or FREE_API_LIVE_FOOTBALL_KEY

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

const HOST = "free-api-live-football-data.p.rapidapi.com";
const BASE = `https://${HOST}`;

export const RAPID_LIVE_FOOTBALL_CONFIG: SportProviderConfig = {
  id: "rapid-live-football",
  name: "RapidAPI Live Football",
  baseUrl: BASE,
  apiKey: process.env.RAPIDAPI_KEY || process.env.FREE_API_LIVE_FOOTBALL_KEY || undefined,
  freeTier: true,
  supportedSports: ["football"],
  rateLimit: { requests: 100, per: "day" },
};

function yyyymmdd(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function mapStatus(m: any): ProviderFixture["status"] {
  const st = m?.status || {};
  if (st.cancelled) return "cancelled";
  if (st.finished) return "finished";
  if (st.started && !st.finished) return "live";
  return "upcoming";
}

export class RapidLiveFootballProvider implements SportsDataProvider {
  readonly config = RAPID_LIVE_FOOTBALL_CONFIG;
  private key: string;

  constructor(key?: string) {
    this.key =
      key ||
      process.env.RAPIDAPI_KEY ||
      process.env.FREE_API_LIVE_FOOTBALL_KEY ||
      "";
  }

  hasToken(): boolean {
    return Boolean(this.key && this.key.trim());
  }

  private async request(path: string): Promise<any> {
    if (!this.hasToken()) {
      throw new Error(
        "RapidAPI Live Football: set RAPIDAPI_KEY in Admin .env"
      );
    }
    const url = path.startsWith("http") ? path : `${BASE}/${path.replace(/^\//, "")}`;
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": HOST,
        "x-rapidapi-key": this.key,
      },
      signal: AbortSignal.timeout(20000),
    });
    if (res.status === 429) {
      throw new Error("RapidAPI Live Football: rate limit exceeded");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("RapidAPI Live Football: invalid or unauthorized API key");
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`RapidAPI Live Football ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }

  async isAvailable(): Promise<boolean> {
    if (!this.hasToken()) return false;
    try {
      await this.request("football-popular-leagues");
      return true;
    } catch {
      return false;
    }
  }

  async getCompetitions(sport: string): Promise<ProviderCompetition[]> {
    if (sport !== "football" || !this.hasToken()) return [];
    try {
      const data = await this.request("football-get-all-leagues");
      const leagues = data?.response?.leagues || data?.response?.popular || [];
      return leagues.slice(0, 80).map((l: any) => ({
        id: String(l.id),
        name: l.name || l.localizedName,
        country: l.ccode || undefined,
        logo: l.logo || undefined,
        type: "league" as const,
      }));
    } catch {
      const data = await this.request("football-popular-leagues");
      const leagues = data?.response?.popular || [];
      return leagues.map((l: any) => ({
        id: String(l.id),
        name: l.name || l.localizedName,
        country: l.ccode || undefined,
        logo: l.logo || undefined,
        type: "league" as const,
      }));
    }
  }

  async getFixtures(
    sport: string,
    params: { date?: string; league?: string; team?: string; live?: boolean } = {}
  ): Promise<ProviderFixture[]> {
    if (sport !== "football" || !this.hasToken()) return [];
    let date = params.date;
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      date = date.replace(/-/g, "");
    }
    if (!date) date = yyyymmdd();

    const data = await this.request(`football-get-matches-by-date?date=${date}`);
    if (data?.status === "failed") {
      throw new Error(data.message || "matches-by-date failed");
    }
    const matches = data?.response?.matches || [];
    return matches.map((m: any) => {
      const kick =
        m.status?.utcTime ||
        (m.timeTS ? new Date(m.timeTS).toISOString() : new Date().toISOString());
      return {
        id: String(m.id),
        sport: "football",
        league: m.leagueName || String(m.leagueId || "Unknown"),
        leagueId: m.leagueId != null ? String(m.leagueId) : undefined,
        homeTeam: m.home?.longName || m.home?.name || "",
        awayTeam: m.away?.longName || m.away?.name || "",
        homeScore: m.home?.score != null ? Number(m.home.score) : null,
        awayScore: m.away?.score != null ? Number(m.away.score) : null,
        status: mapStatus(m),
        kickoffAt: kick,
        events: [],
      } satisfies ProviderFixture;
    });
  }

  async getFixtureById(): Promise<ProviderFixture | null> {
    return null;
  }

  async getStandings(): Promise<ProviderStanding[]> {
    return [];
  }

  async getTeams(
    sport: string,
    params: { league?: string; search?: string } = {}
  ): Promise<ProviderTeam[]> {
    if (sport !== "football" || !this.hasToken()) return [];
    const q = params.search || params.league || "united";
    const data = await this.request(
      `football-teams-search?search=${encodeURIComponent(q)}`
    );
    const suggestions = data?.response?.suggestions || [];
    return suggestions
      .filter((s: any) => s.type === "team")
      .map((s: any) => ({
        id: String(s.id),
        name: s.name,
        logo: undefined,
        country: undefined,
      }));
  }

  async getTeamById(): Promise<ProviderTeam | null> {
    return null;
  }

  async getPlayers(
    sport: string,
    params: { team?: string; search?: string } = {}
  ): Promise<ProviderPlayer[]> {
    if (sport !== "football" || !this.hasToken()) return [];
    const q = params.search || "a";
    const data = await this.request(
      `football-players-search?search=${encodeURIComponent(q)}`
    );
    const suggestions = data?.response?.suggestions || [];
    return suggestions
      .filter((s: any) => s.type === "player" && !s.isCoach)
      .map((s: any) => ({
        id: String(s.id),
        name: s.name,
        team: s.teamName,
        position: undefined,
        nationality: undefined,
        photo: undefined,
      }));
  }

  async getTopScorers(): Promise<ProviderTopScorer[]> {
    return [];
  }
}
