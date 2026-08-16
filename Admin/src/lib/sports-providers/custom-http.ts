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
import type { CustomApiProviderConfig } from "@/lib/api-providers-store";

function getByPath(obj: any, path?: string): any {
  if (!path) return obj;
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function asArray(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") {
    for (const k of ["data", "results", "items", "suggestions", "matches", "leagues", "teams", "players"]) {
      if (Array.isArray(v[k])) return v[k];
    }
  }
  return [];
}

/** Generic HTTP provider driven by Admin UI config — no code deploy needed */
export class CustomHttpProvider implements SportsDataProvider {
  readonly config: SportProviderConfig;
  private cfg: CustomApiProviderConfig;

  constructor(cfg: CustomApiProviderConfig) {
    this.cfg = cfg;
    this.config = {
      id: cfg.id.startsWith("custom-") ? cfg.id : `custom-${cfg.id}`,
      name: cfg.name,
      baseUrl: cfg.baseUrl.replace(/\/$/, ""),
      apiKey: cfg.apiKey,
      freeTier: true,
      supportedSports: cfg.supportedSports?.length ? cfg.supportedSports : ["football"],
      rateLimit: { requests: 60, per: "minute" },
    };
  }

  private buildUrl(relPath: string, query: Record<string, string> = {}): string {
    const base = this.config.baseUrl;
    const path = relPath.replace(/^\//, "");
    const url = new URL(path.includes("://") ? path : `${base}/${path}`);
    for (const [k, v] of Object.entries(query)) {
      if (v != null && v !== "") url.searchParams.set(k, v);
    }
    if (this.cfg.authType === "query" && this.cfg.authQueryParam && this.cfg.apiKey) {
      url.searchParams.set(this.cfg.authQueryParam, this.cfg.apiKey);
    }
    return url.toString();
  }

  private headers(): HeadersInit {
    const h: Record<string, string> = {
      Accept: "application/json",
      ...(this.cfg.extraHeaders || {}),
    };
    if (this.cfg.authType === "header" && this.cfg.authHeaderName && this.cfg.apiKey) {
      h[this.cfg.authHeaderName] = this.cfg.apiKey;
    }
    return h;
  }

  private async request(relPath: string, query: Record<string, string> = {}): Promise<any> {
    if (!this.cfg.enabled) return {};
    const url = this.buildUrl(relPath, query);
    const res = await fetch(url, {
      headers: this.headers(),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${this.config.name} ${res.status}: ${text.slice(0, 180)}`);
    }
    return res.json();
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.cfg.enabled && this.cfg.baseUrl);
  }

  async getCompetitions(sport: string): Promise<ProviderCompetition[]> {
    if (!this.config.supportedSports.includes(sport) || !this.cfg.competitionsPath) return [];
    const data = await this.request(this.cfg.competitionsPath);
    const list = asArray(getByPath(data, this.cfg.competitionsListPath) ?? data);
    return list.map((l: any, i: number) => ({
      id: String(l.id ?? l.leagueId ?? i),
      name: l.name ?? l.leagueName ?? l.title ?? `League ${i}`,
      country: l.country ?? l.ccode ?? l.countryCode,
      logo: l.logo ?? l.image ?? l.emblem,
      type: "league" as const,
    }));
  }

  async getFixtures(
    sport: string,
    params: { date?: string; league?: string; team?: string; live?: boolean } = {}
  ): Promise<ProviderFixture[]> {
    if (!this.config.supportedSports.includes(sport) || !this.cfg.fixturesPath) return [];
    const q: Record<string, string> = {};
    if (params.date && this.cfg.dateParam) q[this.cfg.dateParam] = params.date;
    const data = await this.request(this.cfg.fixturesPath, q);
    const list = asArray(getByPath(data, this.cfg.fixturesListPath) ?? data);
    return list.map((m: any, i: number) => {
      const home =
        m.homeTeam ?? m.home?.name ?? m.home?.longName ?? m.home_name ?? m.team1 ?? "";
      const away =
        m.awayTeam ?? m.away?.name ?? m.away?.longName ?? m.away_name ?? m.team2 ?? "";
      return {
        id: String(m.id ?? m.matchId ?? i),
        sport,
        league: m.league ?? m.leagueName ?? String(m.leagueId ?? "Unknown"),
        leagueId: m.leagueId != null ? String(m.leagueId) : undefined,
        homeTeam: typeof home === "string" ? home : String(home),
        awayTeam: typeof away === "string" ? away : String(away),
        homeScore:
          m.homeScore ?? m.home?.score ?? m.score?.home ?? m.goals?.home ?? null,
        awayScore:
          m.awayScore ?? m.away?.score ?? m.score?.away ?? m.goals?.away ?? null,
        status: (m.status as ProviderFixture["status"]) || "upcoming",
        kickoffAt:
          m.kickoffAt ?? m.utcTime ?? m.date ?? m.time ?? new Date().toISOString(),
        events: [],
      };
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
    if (!this.config.supportedSports.includes(sport) || !this.cfg.teamsPath) return [];
    const q: Record<string, string> = {};
    if (params.search && this.cfg.searchParam) q[this.cfg.searchParam] = params.search;
    const data = await this.request(this.cfg.teamsPath, q);
    const list = asArray(getByPath(data, this.cfg.teamsListPath) ?? data);
    return list.map((t: any, i: number) => ({
      id: String(t.id ?? t.teamId ?? i),
      name: t.name ?? t.teamName ?? t.title ?? `Team ${i}`,
      logo: t.logo ?? t.image,
      country: t.country,
    }));
  }

  async getTeamById(): Promise<ProviderTeam | null> {
    return null;
  }

  async getPlayers(
    sport: string,
    params: { team?: string; search?: string } = {}
  ): Promise<ProviderPlayer[]> {
    if (!this.config.supportedSports.includes(sport) || !this.cfg.playersPath) return [];
    const q: Record<string, string> = {};
    if (params.search && this.cfg.searchParam) q[this.cfg.searchParam] = params.search;
    const data = await this.request(this.cfg.playersPath, q);
    const list = asArray(getByPath(data, this.cfg.playersListPath) ?? data);
    return list.map((p: any, i: number) => ({
      id: String(p.id ?? p.playerId ?? i),
      name: p.name ?? p.playerName ?? p.display_name ?? `Player ${i}`,
      team: p.team ?? p.teamName,
      position: p.position,
      nationality: p.nationality,
      photo: p.photo ?? p.image,
    }));
  }

  async getTopScorers(): Promise<ProviderTopScorer[]> {
    return [];
  }
}
