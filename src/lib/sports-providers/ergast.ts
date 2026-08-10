// ─── SportSphere — Ergast F1 Provider ───────────────────────
// Free, no API key required. Formula 1 only.
// Covers: Schedules, results, driver standings, constructor standings
// Docs: https://ergast.com/mrd/
//
// All entities created from this provider are flagged:
//   source = 'ergast'
//   createdByAI = false
//   verified = false

import type {
  SportsDataProvider,
  SportProviderConfig,
  ProviderFixture,
  ProviderTeam,
  ProviderCompetition,
  ProviderMatchEvent,
} from './provider-interface';

const ERGAST_CONFIG: SportProviderConfig = {
  id: 'ergast',
  name: 'Ergast F1',
  baseUrl: 'https://ergast.com/api/f1',
  freeTier: true,
  apiKey: undefined,
  supportedSports: ['f1', 'motorsport', 'formula-1'],
  rateLimit: { requests: 200, per: 'hour' },
};

export class ErgastF1Provider implements SportsDataProvider {
  readonly config = ERGAST_CONFIG;

  private async fetch<T>(endpoint: string): Promise<T | null> {
    try {
      const url = `${this.config.baseUrl}${endpoint}.json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'SportSphere/1.0' },
        // @ts-ignore
        next: { revalidate: 300 },
      });
      if (!res.ok) {
        console.warn(`Ergast ${endpoint} → ${res.status}`);
        return null;
      }
      const data = (await res.json()) as T;
      return data;
    } catch (err) {
      console.error('Ergast fetch error:', err);
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const data = await this.fetch<any>('/current');
      return !!data?.MRData;
    } catch {
      return false;
    }
  }

  // F1 races → mapped to "fixtures" for the unified interface
  async getFixtures(
    sport: string,
    params: { date?: string; league?: string; live?: boolean } = {}
  ): Promise<ProviderFixture[]> {
    if (!this.config.supportedSports.includes(sport)) return [];

    const season = new Date().getFullYear();
    const endpoint = `/${season}`;
    const data = await this.fetch<any>(endpoint);
    if (!data?.MRData?.RaceTable?.Races) return [];

    return data.MRData.RaceTable.Races.map((race: any) =>
      this.normalizeRace(race)
    );
  }

  async getFixtureById(sport: string, fixtureId: string): Promise<ProviderFixture | null> {
    // fixtureId = "season/round"
    const [season, round] = fixtureId.split('/');
    const data = await this.fetch<any>(`/${season}/${round}`);
    if (!data?.MRData?.RaceTable?.Races?.[0]) return null;
    return this.normalizeRace(data.MRData.RaceTable.Races[0]);
  }

  async getStandings(sport: string, league: string): Promise<any[]> {
    if (!this.config.supportedSports.includes(sport)) return [];
    const season = new Date().getFullYear();
    // Driver standings
    const data = await this.fetch<any>(`/${season}/driverStandings`);
    if (!data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings) return [];
    return data.MRData.StandingsTable.StandingsLists[0].DriverStandings.map(
      (s: any, i: number) => ({
        position: s.position || i + 1,
        team: s.Constructors?.[0]?.name || '',
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: Number(s.points || 0),
        form: undefined,
        group: 'drivers',
        // Extra F1-specific fields
        driver: `${s.Driver?.givenName} ${s.Driver?.familyName}`,
        wins: Number(s.wins || 0),
        nationality: s.Driver?.nationality,
      })
    );
  }

  async getTeams(
    sport: string,
    params: { league?: string; search?: string } = {}
  ): Promise<ProviderTeam[]> {
    // In F1, "teams" = constructors
    const season = new Date().getFullYear();
    const data = await this.fetch<any>(`/${season}/constructors`);
    if (!data?.MRData?.ConstructorTable?.Constructors) return [];

    let teams = data.MRData.ConstructorTable.Constructors.map((c: any) => ({
      id: c.constructorId,
      name: c.name,
      logo: undefined,
      country: this.countryFromNationality(c.nationality),
      venue: undefined,
    }));

    if (params.search) {
      const q = params.search.toLowerCase();
      teams = teams.filter((t: any) => t.name.toLowerCase().includes(q));
    }
    return teams;
  }

  async getTeamById(sport: string, teamId: string): Promise<ProviderTeam | null> {
    const data = await this.fetch<any>(`/constructors/${teamId}`);
    if (!data?.MRData?.ConstructorTable?.Constructors?.[0]) return null;
    const c = data.MRData.ConstructorTable.Constructors[0];
    return {
      id: c.constructorId,
      name: c.name,
      country: this.countryFromNationality(c.nationality),
    };
  }

  async getPlayers(): Promise<never[]> {
    // F1 drivers handled via getStandings (driver championship)
    return [];
  }

  async getTopScorers(): Promise<never[]> {
    return [];
  }

  async getCompetitions(sport: string): Promise<ProviderCompetition[]> {
    if (!this.config.supportedSports.includes(sport)) return [];
    return [
      {
        id: 'f1-world-championship',
        name: 'Formula 1 World Championship',
        type: 'tournament' as const,
      },
    ];
  }

  // ─── Helpers ────────────────────────────────────────────
  private normalizeRace(race: any): ProviderFixture {
    const raceDate = `${race.date}T${race.time || '00:00:00Z'}`;
    const now = new Date();
    const kickoff = new Date(raceDate);
    const elapsed = (now.getTime() - kickoff.getTime()) / 60000;

    let status: 'upcoming' | 'live' | 'finished' = 'upcoming';
    if (elapsed > 0 && elapsed < 150) status = 'live'; // ~2.5 hour race window
    if (elapsed > 150) status = 'finished';

    return {
      id: `${race.season}/${race.round}`,
      sport: 'f1',
      league: 'Formula 1',
      leagueId: 'f1',
      homeTeam: race.raceName, // Race name as "home"
      awayTeam: race.Circuit?.Location?.locality || '',
      homeScore: null,
      awayScore: null,
      status,
      minute: undefined,
      venue: race.Circuit?.circuitName,
      kickoffAt: raceDate,
      events: [],
    };
  }

  private countryFromNationality(nat?: string): string {
    if (!nat) return '';
    const map: Record<string, string> = {
      British: 'United Kingdom',
      German: 'Germany',
      Italian: 'Italy',
      French: 'France',
      Japanese: 'Japan',
      American: 'United States',
      Australian: 'Australia',
      Brazilian: 'Brazil',
      Spanish: 'Spain',
      Finnish: 'Finland',
      Dutch: 'Netherlands',
      Mexican: 'Mexico',
      Canadian: 'Canada',
      Austrian: 'Austria',
      Swiss: 'Switzerland',
      Russian: 'Russia',
      Danish: 'Denmark',
      Swedish: 'Sweden',
      Polish: 'Poland',
    };
    return map[nat] || nat;
  }
}
