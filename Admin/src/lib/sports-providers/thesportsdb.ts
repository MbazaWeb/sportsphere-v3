// ─── SportSphere — TheSportsDB Provider ──────────────────────
// Free public API, no signup required. Test key: 3
// Covers: Soccer, Basketball, NFL, MLB, Motorsport, MMA, and more
// Docs: https://www.thesportsdb.com/api.php
//
// All entities created from this provider are flagged:
//   source = 'thesportsdb'
//   createdByAI = false (it's source data, not AI-generated)
//   verified = false (admins must verify)

import type {
  SportsDataProvider,
  SportProviderConfig,
  ProviderFixture,
  ProviderTeam,
  ProviderPlayer,
  ProviderCompetition,
  ProviderMatchEvent,
} from './provider-interface';

const THESPORTSDB_CONFIG: SportProviderConfig = {
  id: 'thesportsdb',
  name: 'TheSportsDB',
  baseUrl: 'https://www.thesportsdb.com/api/v1/json',
  apiKey: '3', // public free test key — no signup required
  freeTier: true,
  supportedSports: [
    'football', 'basketball', 'american-football', 'baseball',
    'ice-hockey', 'rugby', 'motorsport', 'mma', 'tennis', 'cricket',
  ],
  rateLimit: { requests: 100, per: 'minute' },
};

// TheSportsDB league IDs for popular competitions (soccer-focused)
const POPULAR_LEAGUES: Record<string, number[]> = {
  football: [
    4328, // English Premier League
    4335, // Spanish La Liga
    4332, // Italian Serie A
    4334, // German Bundesliga
    4331, // French Ligue 1
    4480, // UEFA Champions League
    4481, // UEFA Europa League
    4346, // Major League Soccer (USA)
    4359, // African Nations Cup
  ],
};

// Simple in-memory cache (5 min TTL)
interface CacheEntry<T> { data: T; expires: number; }
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

export class TheSportsDBProvider implements SportsDataProvider {
  readonly config = THESPORTSDB_CONFIG;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.THESPORTSDB_KEY || '3';
  }

  private async fetch<T>(endpoint: string): Promise<T | null> {
    const cacheKey = `${this.config.id}:${endpoint}`;
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.config.baseUrl}/${this.apiKey}/${endpoint}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'SportSphere/1.0' },
        // @ts-ignore — Next.js supports this
        next: { revalidate: 300 },
      });
      if (!res.ok) {
        console.warn(`TheSportsDB ${endpoint} → ${res.status}`);
        return null;
      }
      const data = (await res.json()) as T;
      setCached(cacheKey, data);
      return data;
    } catch (err) {
      console.error('TheSportsDB fetch error:', err);
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const data = await this.fetch<{ sports?: unknown[] }>('all_sports.php');
      return !!data && Array.isArray(data.sports);
    } catch {
      return false;
    }
  }

  // ─── Fixtures / Live Scores ─────────────────────────────
  async getFixtures(
    sport: string,
    params: { date?: string; league?: string; live?: boolean } = {}
  ): Promise<ProviderFixture[]> {
    // TheSportsDB uses "events" not "fixtures"
    const leagueIds = POPULAR_LEAGUES[sport] || [];
    const fixtures: ProviderFixture[] = [];

    if (params.live) {
      // Live scores across all soccer leagues
      const data = await this.fetch<{ events?: any[] }>(
        'livescore.php?s=Soccer'
      );
      if (data?.events) {
        for (const ev of data.events) {
          fixtures.push(this.normalizeEvent(ev, sport));
        }
      }
    } else if (params.date) {
      // Events on a specific date (YYYY-MM-DD)
      const data = await this.fetch<{ events?: any[] }>(
        `eventsday.php?d=${params.date}&s=${this.sportParam(sport)}`
      );
      if (data?.events) {
        for (const ev of data.events) {
          fixtures.push(this.normalizeEvent(ev, sport));
        }
      }
    } else if (params.league && leagueIds.length > 0) {
      // Last 15 events in a league
      const lid = leagueIds[0];
      const data = await this.fetch<{ events?: any[] }>(
        `eventspastleague.php?id=${lid}`
      );
      if (data?.events) {
        for (const ev of data.events) {
          fixtures.push(this.normalizeEvent(ev, sport));
        }
      }
    } else if (leagueIds.length > 0) {
      // Default: next 15 events across the most popular league
      const lid = leagueIds[0];
      const data = await this.fetch<{ events?: any[] }>(
        `eventsnextleague.php?id=${lid}`
      );
      if (data?.events) {
        for (const ev of data.events) {
          fixtures.push(this.normalizeEvent(ev, sport));
        }
      }
    }
    return fixtures;
  }

  async getFixtureById(sport: string, fixtureId: string): Promise<ProviderFixture | null> {
    const data = await this.fetch<{ events?: any[] }>(
      `lookupevent.php?id=${fixtureId}`
    );
    if (!data?.events || data.events.length === 0) return null;
    return this.normalizeEvent(data.events[0], sport);
  }

  // ─── Standings (limited support) ────────────────────────
  async getStandings(sport: string, league: string): Promise<any[]> {
    const leagueIds = POPULAR_LEAGUES[sport] || [];
    if (leagueIds.length === 0) return [];
    const lid = leagueIds[0];
    const data = await this.fetch<{ table?: any[] }>(
      `lookuptable.php?l=${lid}&s=2025-2026`
    );
    return data?.table || [];
  }

  // ─── Teams ──────────────────────────────────────────────
  async getTeams(
    sport: string,
    params: { league?: string; search?: string } = {}
  ): Promise<ProviderTeam[]> {
    if (params.search) {
      const data = await this.fetch<{ teams?: any[] }>(
        `searchteams.php?t=${encodeURIComponent(params.search)}`
      );
      return (data?.teams || []).map(this.normalizeTeam);
    }
    const leagueIds = POPULAR_LEAGUES[sport] || [];
    if (leagueIds.length === 0) return [];
    const data = await this.fetch<{ teams?: any[] }>(
      `lookup_all_teams.php?id=${leagueIds[0]}`
    );
    return (data?.teams || []).map(this.normalizeTeam);
  }

  async getTeamById(sport: string, teamId: string): Promise<ProviderTeam | null> {
    const data = await this.fetch<{ teams?: any[] }>(
      `lookupteam.php?id=${teamId}`
    );
    if (!data?.teams || data.teams.length === 0) return null;
    return this.normalizeTeam(data.teams[0]);
  }

  // ─── Players ────────────────────────────────────────────
  async getPlayers(
    sport: string,
    params: { team?: string; search?: string } = {}
  ): Promise<ProviderPlayer[]> {
    const toList = (raw: any): any[] => {
      if (Array.isArray(raw)) return raw;
      if (raw && typeof raw === "object") return [raw];
      return [];
    };
    if (params.search) {
      const data = await this.fetch<{ player?: any }>(
        `searchplayers.php?p=${encodeURIComponent(params.search)}`
      );
      return toList(data?.player).map((row) => this.normalizePlayer(row));
    }
    if (params.team) {
      // only numeric TheSportsDB ids work for lookup_all_players
      if (!/^\d+$/.test(String(params.team))) {
        return [];
      }
      const data = await this.fetch<{ player?: any }>(
        `lookup_all_players.php?id=${params.team}`
      );
      return toList(data?.player).map((row) => this.normalizePlayer(row));
    }
    return [];
  }

  // ─── Top Scorers (limited — TheSportsDB has limited support) ──
  async getTopScorers(sport: string, league: string): Promise<any[]> {
    return [];
  }

  // ─── Competitions / Leagues ─────────────────────────────
  async getCompetitions(sport: string): Promise<ProviderCompetition[]> {
    const data = await this.fetch<{ countries?: any[]; leagues?: any[] }>(
      "all_leagues.php"
    );
    const rawList = data?.leagues || data?.countries || [];
    if (!rawList.length) return [];

    const targetSport = this.sportParam(sport).toLowerCase();

    return rawList
      .filter((c: any) => {
        const itemSport = (c.strSport || "").toLowerCase();
        return itemSport.includes(targetSport) || itemSport.includes(sport.toLowerCase());
      })
      .slice(0, 30)
      .map((c: any) => ({
        id: String(c.idLeague || c.leagueId || ""),
        name: c.strLeague || c.league || "Unknown",
        country: c.strCountry,
        type: "league" as const,
      }));
  }

  // ─── Helpers ────────────────────────────────────────────
  private sportParam(sport: string): string {
    const map: Record<string, string> = {
      football: 'Soccer',
      soccer: 'Soccer',
      basketball: 'Basketball',
      'american-football': 'American Football',
      baseball: 'Baseball',
      'ice-hockey': 'Ice Hockey',
      rugby: 'Rugby',
      motorsport: 'Motorsport',
      mma: 'Fighting',
      tennis: 'Tennis',
      cricket: 'Cricket',
    };
    return map[sport] || 'Soccer';
  }

  private normalizeEvent(ev: any, sport: string): ProviderFixture {
    const status = this.parseStatus(ev);
    return {
      id: String(ev.idEvent || ev.id || ''),
      sport,
      league: ev.strLeague || ev.league || 'Unknown',
      leagueId: String(ev.idLeague || ''),
      homeTeam: ev.strHomeTeam || '',
      awayTeam: ev.strAwayTeam || '',
      homeScore: ev.intHomeScore != null ? Number(ev.intHomeScore) : null,
      awayScore: ev.intAwayScore != null ? Number(ev.intAwayScore) : null,
      status,
      minute: ev.progress ? Number(ev.progress) : undefined,
      venue: ev.strVenue,
      kickoffAt: ev.strTimestamp || ev.dateEvent
        ? new Date(`${ev.dateEvent} ${ev.strTime || '00:00:00'}`).toISOString()
        : new Date().toISOString(),
      events: this.extractEvents(ev),
    };
  }

  private parseStatus(ev: any): 'upcoming' | 'live' | 'finished' | 'postponed' | 'cancelled' {
    if (ev.strPostponed === 'yes') return 'postponed';
    if (ev.strStatus === 'FT' || ev.strStatus === 'Match Finished') return 'finished';
    if (ev.strStatus === 'NS' || !ev.intHomeScore) return 'upcoming';
    if (ev.strStatus && /Q[1-4]|HT|2H|1H|LIVE/i.test(ev.strStatus)) return 'live';
    return 'upcoming';
  }

  private extractEvents(ev: any): ProviderMatchEvent[] {
    const events: ProviderMatchEvent[] = [];
    // TheSportsDB puts goals in strHomeGoalDetails / strAwayGoalDetails
    // Format: "12': Player Name; 34': Another Player"
    const parseGoals = (details: string, team: 'home' | 'away') => {
      if (!details) return;
      const items = details.split(';').map((s) => s.trim()).filter(Boolean);
      for (const item of items) {
        const match = item.match(/^(\d+)['′]\s*(.+)$/);
        if (match) {
          events.push({
            type: 'goal',
            minute: Number(match[1]),
            team,
            player: match[2].trim(),
          });
        }
      }
    };
    parseGoals(ev.strHomeGoalDetails || '', 'home');
    parseGoals(ev.strAwayGoalDetails || '', 'away');
    return events;
  }

  private normalizeTeam = (t: any): ProviderTeam => ({
    id: String(t.idTeam || t.id || ''),
    name: t.strTeam || '',
    logo: t.strBadge || t.strLogo,
    country: t.strCountry,
    venue: t.strStadium,
  });

  private normalizePlayer = (p: any): ProviderPlayer => ({
    id: String(p.idPlayer || p.id || ''),
    name: p.strPlayer || '',
    team: p.strTeam,
    position: p.strPosition,
    nationality: p.strNationality,
    photo: p.strThumb || p.strCutout,
  });
}
