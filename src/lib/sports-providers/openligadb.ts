// ─── SportSphere — OpenLigaDB Provider ──────────────────────
// Free, no API key required. German football only.
// Covers: Bundesliga, 2. Bundesliga, DFB-Pokal
// Docs: https://www.openligadb.de/api/api-request
//
// All entities created from this provider are flagged:
//   source = 'openligadb'
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

const OPENLIGADB_CONFIG: SportProviderConfig = {
  id: 'openligadb',
  name: 'OpenLigaDB',
  baseUrl: 'https://api.openligadb.de',
  freeTier: true,
  apiKey: undefined, // No key required
  supportedSports: ['football'],
  rateLimit: { requests: 60, per: 'minute' },
};

// OpenLigaDB league shortcuts
const LEAGUE_SLUGS: Record<string, string> = {
  bundesliga: 'bl1',
  '2-bundesliga': 'bl2',
  'dfb-pokal': 'dfb',
};

export class OpenLigaDBProvider implements SportsDataProvider {
  readonly config = OPENLIGADB_CONFIG;

  private async fetch<T>(endpoint: string): Promise<T | null> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SportSphere/1.0',
        },
        // @ts-ignore
        next: { revalidate: 300 },
      });
      if (!res.ok) {
        console.warn(`OpenLigaDB ${endpoint} → ${res.status}`);
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      console.error('OpenLigaDB fetch error:', err);
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const data = await this.fetch<any>('/getmatchdata/bl1');
      return Array.isArray(data);
    } catch {
      return false;
    }
  }

  async getFixtures(
    sport: string,
    params: { date?: string; league?: string; live?: boolean } = {}
  ): Promise<ProviderFixture[]> {
    if (sport !== 'football') return [];

    const leagueSlug = params.league ? LEAGUE_SLUGS[params.league] || 'bl1' : 'bl1';
    const season = new Date().getFullYear();

    let endpoint: string;
    if (params.live) {
      endpoint = `/getmatchdata/${leagueSlug}`;
    } else if (params.date) {
      // Format: YYYY-MM-DD
      endpoint = `/getmatchdata/${leagueSlug}/${params.date}`;
    } else {
      endpoint = `/getmatchdata/${leagueSlug}/${season}`;
    }

    const data = await this.fetch<any[]>(endpoint);
    if (!Array.isArray(data)) return [];

    return data.map((ev) => this.normalizeEvent(ev, sport));
  }

  async getFixtureById(sport: string, fixtureId: string): Promise<ProviderFixture | null> {
    const data = await this.fetch<any>(`/getmatchbyid/${fixtureId}`);
    if (!data) return null;
    return this.normalizeEvent(data, sport);
  }

  async getStandings(sport: string, league: string): Promise<any[]> {
    if (sport !== 'football') return [];
    const slug = LEAGUE_SLUGS[league] || 'bl1';
    const season = new Date().getFullYear();
    const data = await this.fetch<any>(`/getbltable/${slug}/${season}`);
    return Array.isArray(data) ? data : [];
  }

  async getTeams(
    sport: string,
    params: { league?: string; search?: string } = {}
  ): Promise<ProviderTeam[]> {
    if (sport !== 'football') return [];
    const slug = params.league ? LEAGUE_SLUGS[params.league] || 'bl1' : 'bl1';
    const season = new Date().getFullYear();
    const data = await this.fetch<any[]>(`/getavailableteams/${slug}/${season}`);
    if (!Array.isArray(data)) return [];

    let teams = data.map((t: any) => ({
      id: String(t.teamId || t.teamID || ''),
      name: t.teamName || '',
      logo: t.teamIconUrl,
      country: 'Germany',
    }));

    if (params.search) {
      const q = params.search.toLowerCase();
      teams = teams.filter((t) => t.name.toLowerCase().includes(q));
    }
    return teams;
  }

  async getTeamById(sport: string, teamId: string): Promise<ProviderTeam | null> {
    const teams = await this.getTeams(sport, {});
    return teams.find((t) => t.id === teamId) || null;
  }

  async getPlayers(): Promise<never[]> {
    // OpenLigaDB does not provide player rosters — return empty
    return [];
  }

  async getTopScorers(): Promise<never[]> {
    return [];
  }

  async getCompetitions(sport: string): Promise<ProviderCompetition[]> {
    if (sport !== 'football') return [];
    return [
      { id: 'bl1', name: 'Bundesliga', country: 'Germany', type: 'league' as const },
      { id: 'bl2', name: '2. Bundesliga', country: 'Germany', type: 'league' as const },
      { id: 'dfb', name: 'DFB-Pokal', country: 'Germany', type: 'cup' as const },
    ];
  }

  // ─── Helpers ────────────────────────────────────────────
  private normalizeEvent(ev: any, sport: string): ProviderFixture {
    const status = this.parseStatus(ev);
    return {
      id: String(ev.matchID || ev.matchID || ''),
      sport,
      league: ev.leagueName || 'Bundesliga',
      leagueId: ev.leagueId ? String(ev.leagueId) : '',
      homeTeam: ev.team1?.teamName || '',
      awayTeam: ev.team2?.teamName || '',
      homeScore: ev.matchResults?.find((r: any) => r.resultName === 'Endergebnis')?.pointsTeam1 ?? null,
      awayScore: ev.matchResults?.find((r: any) => r.resultName === 'Endergebnis')?.pointsTeam2 ?? null,
      status,
      minute: ev.matchIsFinished ? undefined : undefined,
      venue: undefined,
      kickoffAt: ev.matchDateTime || new Date().toISOString(),
      events: this.extractEvents(ev),
    };
  }

  private parseStatus(ev: any): 'upcoming' | 'live' | 'finished' | 'postponed' | 'cancelled' {
    if (ev.matchIsFinished) return 'finished';
    const kickoff = new Date(ev.matchDateTime);
    const now = new Date();
    const elapsed = (now.getTime() - kickoff.getTime()) / 60000; // minutes
    if (elapsed > 0 && elapsed < 120) return 'live';
    return 'upcoming';
  }

  private extractEvents(ev: any): ProviderMatchEvent[] {
    const events: ProviderMatchEvent[] = [];
    if (!Array.isArray(ev.goals)) return events;
    for (const g of ev.goals) {
      events.push({
        type: 'goal',
        minute: g.matchMinute ? Number(g.matchMinute) : 0,
        team: g.isTeam1 ? 'home' : 'away',
        player: g.goalGetterName,
        detail: g.scoreTeam1 != null ? `${g.scoreTeam1}:${g.scoreTeam2}` : undefined,
      });
    }
    return events;
  }
}
