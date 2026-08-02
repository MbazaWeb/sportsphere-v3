// ─── SportSphere — API-Football Provider ──────────────────────
// Spec: Phase 13 — "Research and integrate FREE APIs where possible."
// API-Football (RapidAPI) offers a free tier: 100 requests/day.
// This is the first provider implementation for the SportsDataProvider
// interface. Other providers can be added without changing UI code.

import type {
  SportsDataProvider,
  SportProviderConfig,
  ProviderFixture,
  ProviderMatchEvent,
  ProviderStanding,
  ProviderTeam,
  ProviderPlayer,
  ProviderTopScorer,
  ProviderCompetition,
} from './provider-interface';

const API_FOOTBALL_CONFIG: SportProviderConfig = {
  id: 'api-football',
  name: 'API-Football',
  baseUrl: 'https://api-football-v1.p.rapidapi.com/v3',
  freeTier: true,
  supportedSports: ['football', 'american-football', 'baseball', 'basketball', 'ice-hockey', 'rugby-union', 'rugby-league', 'cricket', 'tennis', 'volleyball', 'handball', 'esports'],
  rateLimit: { requests: 100, per: 'day' },
};

// Map sport slugs to API-Football league IDs for popular competitions
const POPULAR_LEAGUES: Record<string, number[]> = {
  football: [39, 140, 135, 61, 78, 2, 3, 848],  // Premier League, La Liga, Serie A, Ligue 1, Bundesliga, Champions League, Europa League, AFCON
  basketball: [12, 13, 14],  // NBA, EuroLeague, etc.
  baseball: [1, 2],  // MLB, etc.
  'ice-hockey': [3, 4],  // NHL, etc.
  'rugby-union': [30, 31],  // Six Nations, etc.
  cricket: [1, 2, 3],  // IPL, etc.
  tennis: [1, 2],  // ATP, WTA
};

export class ApiFootballProvider implements SportsDataProvider {
  readonly config = API_FOOTBALL_CONFIG;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.API_FOOTBALL_KEY || '';
  }

  private get headers(): Record<string, string> {
    return {
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
    };
  }

  private async fetch(endpoint: string, params: Record<string, string | number | boolean>): Promise<unknown> {
    const qs = new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
        acc[k] = String(v);
        return acc;
      }, {})
    ).toString();

    const url = `${this.config.baseUrl}/${endpoint}?${qs}`;
    const res = await fetch(url, { headers: this.headers, next: { revalidate: 300 } });

    if (!res.ok) {
      throw new Error(`API-Football error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  }

  // ─── Map sport slug to API-Football sport parameter ─────────
  private mapSport(sport: string): string {
    const mapping: Record<string, string> = {
      'football': 'football',
      'american-football': 'American Football',
      'baseball': 'baseball',
      'basketball': 'basketball',
      'ice-hockey': 'hockey',
      'rugby-union': 'rugby',
      'rugby-league': 'rugby',
      'cricket': 'cricket',
      'tennis': 'tennis',
      'volleyball': 'volleyball',
      'handball': 'handball',
      'esports': 'esports',
    };
    return mapping[sport] || sport;
  }

  // ─── Map API-Football fixture status to our status ──────────
  private mapStatus(status: string): ProviderFixture['status'] {
    const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'];
    const finishedStatuses = ['FT', 'AET', 'PEN', 'AWD', 'WO'];
    const upcomingStatuses = ['TBD', 'NS'];
    const postponedStatuses = ['PST', 'SUSP'];
    const cancelledStatuses = ['CANC', 'ABD'];

    if (liveStatuses.includes(status)) return 'live';
    if (finishedStatuses.includes(status)) return 'finished';
    if (upcomingStatuses.includes(status)) return 'upcoming';
    if (postponedStatuses.includes(status)) return 'postponed';
    if (cancelledStatuses.includes(status)) return 'cancelled';
    return 'upcoming';
  }

  // ─── Fixtures ───────────────────────────────────────────────
  async getFixtures(sport: string, params: { date?: string; league?: string; team?: string; live?: boolean }): Promise<ProviderFixture[]> {
    const apiParams: Record<string, string | number | boolean> = {};
    if (params.date) apiParams.date = params.date;
    if (params.league) apiParams.league = params.league;
    if (params.team) apiParams.team = params.team;
    if (params.live) apiParams.live = 'all';

    try {
      const data = await this.fetch('fixtures', apiParams) as { response: Array<Record<string, unknown>> };
      return (data.response || []).map((f: Record<string, unknown>) => {
        const fixture = f.fixture as Record<string, unknown> | null;
        const teams = f.teams as Record<string, Record<string, unknown>> | null;
        const goals = f.goals as Record<string, number | null> | null;
        const league = f.league as Record<string, unknown> | null;
        const events = (f.events as Array<Record<string, unknown>> | undefined) || [];

        // Extract nested status safely
        const fixtureStatus = (fixture?.status || {}) as Record<string, unknown>;
        const statusShort = String(fixtureStatus.short || '');

        return {
          id: String(fixture?.id || ''),
          sport,
          league: String(league?.name || ''),
          leagueId: String(league?.id || ''),
          homeTeam: String(teams?.home?.name || ''),
          awayTeam: String(teams?.away?.name || ''),
          homeScore: goals?.home ?? null,
          awayScore: goals?.away ?? null,
          status: this.mapStatus(statusShort),
          minute: typeof fixtureStatus.elapsed === 'number' ? fixtureStatus.elapsed : undefined,
          venue: String((fixture?.venue as Record<string, unknown>)?.name || ''),
          kickoffAt: String(fixture?.date || ''),
          events: events.map((e: Record<string, unknown>) => {
            const eType = String((e.type as Record<string, unknown>)?.name || e.type || '');
            const eTime = e.time as Record<string, unknown> | undefined;
            const eTeam = e.team as Record<string, unknown> | undefined;
            const ePlayer = e.player as Record<string, unknown> | undefined;
            return {
              type: eType.toLowerCase().includes('goal') ? 'goal' as const
                : eType.toLowerCase().includes('card') ? 'card' as const
                : eType.toLowerCase().includes('subst') ? 'substitution' as const
                : 'period' as const,
              minute: Number(eTime?.elapsed || 0),
              team: String(eTeam?.name || '') === String(teams?.home?.name || '') ? 'home' as const : 'away' as const,
              player: String(ePlayer?.name || ''),
              detail: String(e.detail || ''),
            };
          }),
        };
      });
    } catch {
      return [];
    }
  }

  async getFixtureById(sport: string, fixtureId: string): Promise<ProviderFixture | null> {
    try {
      const data = await this.fetch('fixtures', { id: fixtureId }) as { response: Array<Record<string, unknown>> };
      const fixtures = await this.getFixtures(sport, {});
      const fixture = fixtures.find(f => f.id === fixtureId);
      return fixture || null;
    } catch {
      return null;
    }
  }

  // ─── Standings ──────────────────────────────────────────────
  async getStandings(sport: string, league: string, season?: string): Promise<ProviderStanding[]> {
    const apiParams: Record<string, string | number> = { league };
    if (season) apiParams.season = season;

    try {
      const data = await this.fetch('standings', apiParams) as { response: Array<Record<string, unknown>> };
      const leagueData = data.response?.[0] as Record<string, unknown> | undefined;
      const leagueObj = leagueData?.league as Record<string, unknown> | undefined;
      const standings = leagueObj?.standings as Array<Array<Record<string, unknown>>> | undefined;

      if (!standings) return [];

      return standings.flat().map((s: Record<string, unknown>) => {
        const team = s.team as Record<string, unknown>;
        const all = s.all as Record<string, unknown>;
        const allGoals = all?.goals as Record<string, unknown> | undefined;

        return {
          position: Number(s.rank || 0),
          team: String(team?.name || ''),
          played: Number(all?.played || 0),
          won: Number(all?.win || 0),
          drawn: Number(all?.draw || 0),
          lost: Number(all?.lose || 0),
          goalsFor: Number(allGoals?.for || 0),
          goalsAgainst: Number(allGoals?.against || 0),
          points: Number(s.points || 0),
          form: String(s.form || ''),
          group: String(s.group || ''),
        };
      });
    } catch {
      return [];
    }
  }

  // ─── Teams ──────────────────────────────────────────────────
  async getTeams(sport: string, params: { league?: string; search?: string }): Promise<ProviderTeam[]> {
    const apiParams: Record<string, string | number> = {};
    if (params.league) apiParams.league = params.league;
    if (params.search) apiParams.search = params.search;

    try {
      const data = await this.fetch('teams', apiParams) as { response: Array<Record<string, unknown>> };
      return (data.response || []).map((t: Record<string, unknown>) => {
        const team = t.team as Record<string, unknown>;
        const venue = t.venue as Record<string, unknown>;
        return {
          id: String(team?.id || ''),
          name: String(team?.name || ''),
          logo: String(team?.logo || ''),
          country: String(team?.country || ''),
          venue: String(venue?.name || ''),
        };
      });
    } catch {
      return [];
    }
  }

  async getTeamById(sport: string, teamId: string): Promise<ProviderTeam | null> {
    try {
      const data = await this.fetch('teams', { id: teamId }) as { response: Array<Record<string, unknown>> };
      const t = data.response?.[0] as Record<string, unknown> | undefined;
      if (!t) return null;
      const team = t.team as Record<string, unknown>;
      const venue = t.venue as Record<string, unknown>;
      return {
        id: String(team?.id || ''),
        name: String(team?.name || ''),
        logo: String(team?.logo || ''),
        country: String(team?.country || ''),
        venue: String(venue?.name || ''),
      };
    } catch {
      return null;
    }
  }

  // ─── Players ────────────────────────────────────────────────
  async getPlayers(sport: string, params: { team?: string; search?: string }): Promise<ProviderPlayer[]> {
    const apiParams: Record<string, string | number> = { season: new Date().getFullYear() };
    if (params.team) apiParams.team = params.team;
    if (params.search) apiParams.search = params.search;

    try {
      const data = await this.fetch('players', apiParams) as { response: Array<Record<string, unknown>> };
      return (data.response || []).map((p: Record<string, unknown>) => {
        const player = p.player as Record<string, unknown>;
        return {
          id: String(player?.id || ''),
          name: String(player?.name || ''),
          position: String(player?.position || ''),
          nationality: String(player?.nationality || ''),
          photo: String(player?.photo || ''),
        };
      });
    } catch {
      return [];
    }
  }

  // ─── Top Scorers ────────────────────────────────────────────
  async getTopScorers(sport: string, league: string, season?: string): Promise<ProviderTopScorer[]> {
    const apiParams: Record<string, string | number> = { league };
    if (season) apiParams.season = season;

    try {
      const data = await this.fetch('players/topscorers', apiParams) as { response: Array<Record<string, unknown>> };
      return (data.response || []).map((p: Record<string, unknown>, i: number) => {
        const player = p.player as Record<string, unknown>;
        const statistics = (p.statistics as Array<Record<string, unknown>>)?.[0] || {};
        const team = statistics.team as Record<string, unknown>;
        const games = statistics.games as Record<string, unknown>;
        const goals = statistics.goals as Record<string, unknown>;

        return {
          rank: i + 1,
          player: String(player?.name || ''),
          team: String(team?.name || ''),
          goals: Number(goals?.total || 0),
          assists: Number(goals?.assists || 0),
          played: Number(games?.appearences || 0),
        };
      });
    } catch {
      return [];
    }
  }

  // ─── Competitions ──────────────────────────────────────────
  async getCompetitions(sport: string): Promise<ProviderCompetition[]> {
    const apiParams: Record<string, string | number> = {};
    const leagueIds = POPULAR_LEAGUES[sport];
    if (leagueIds) {
      // Fetch specific leagues by ID
      try {
        const results: ProviderCompetition[] = [];
        for (const id of leagueIds.slice(0, 5)) {
          const data = await this.fetch('leagues', { id, season: new Date().getFullYear() }) as { response: Array<Record<string, unknown>> };
          for (const l of data.response || []) {
            const league = l.league as Record<string, unknown>;
            const country = l.country as Record<string, unknown>;
            results.push({
              id: String(league?.id || ''),
              name: String(league?.name || ''),
              country: String(country?.name || ''),
              logo: String(league?.logo || ''),
              type: 'league',
            });
          }
        }
        return results;
      } catch {
        return [];
      }
    }

    try {
      const data = await this.fetch('leagues', { type: 'league' }) as { response: Array<Record<string, unknown>> };
      return (data.response || []).slice(0, 50).map((l: Record<string, unknown>) => {
        const league = l.league as Record<string, unknown>;
        const country = l.country as Record<string, unknown>;
        return {
          id: String(league?.id || ''),
          name: String(league?.name || ''),
          country: String(country?.name || ''),
          logo: String(league?.logo || ''),
          type: 'league',
        };
      });
    } catch {
      return [];
    }
  }

  // ─── Health Check ───────────────────────────────────────────
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const res = await fetch(`${this.config.baseUrl}/status`, {
        headers: this.headers,
        next: { revalidate: 60 },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

// Auto-register if API key is available
export function registerApiFootballProvider(): void {
  if (process.env.API_FOOTBALL_KEY) {
    const { providerRegistry } = require('./provider-interface');
    providerRegistry.register(new ApiFootballProvider());
  }
}
