// ─── SportSphere — Sports Data Provider Interface ─────────────
// Spec: Phase 13 — "Implement provider abstraction so APIs can be
//        swapped later without changing UI."
// Spec: Phase 17 — "Never hardcode. Everything should be data-driven."
//
// This module defines the provider interface that all sports data
// sources must implement. Adding a new provider means creating a
// class that implements SportsDataProvider — no UI changes needed.

export interface SportProviderConfig {
  id: string;           // unique provider identifier (e.g. 'api-football', 'espn')
  name: string;         // display name
  baseUrl: string;      // API base URL
  apiKey?: string;      // API key (if required)
  freeTier: boolean;    // whether this provider has a free tier
  supportedSports: string[];  // slugs of sports this provider covers
  rateLimit: { requests: number; per: 'minute' | 'hour' | 'day' };
}

// ─── Common data types ────────────────────────────────────────
export interface ProviderFixture {
  id: string;
  sport: string;          // sport slug
  league: string;
  leagueId?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'finished' | 'postponed' | 'cancelled';
  minute?: number;
  venue?: string;
  kickoffAt: string;      // ISO 8601
  events?: ProviderMatchEvent[];
}

export interface ProviderMatchEvent {
  type: 'goal' | 'card' | 'substitution' | 'var' | 'penalty' | 'period';
  minute: number;
  team: 'home' | 'away';
  player?: string;
  detail?: string;
}

export interface ProviderStanding {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form?: string;         // e.g. "WWDLW"
  group?: string;
}

export interface ProviderTeam {
  id: string;
  name: string;
  logo?: string;
  country?: string;
  venue?: string;
}

export interface ProviderPlayer {
  id: string;
  name: string;
  team?: string;
  position?: string;
  nationality?: string;
  photo?: string;
}

export interface ProviderTopScorer {
  rank: number;
  player: string;
  team: string;
  goals: number;
  assists?: number;
  played?: number;
}

export interface ProviderCompetition {
  id: string;
  name: string;
  country?: string;
  logo?: string;
  type: 'league' | 'cup' | 'tournament';
}

// ─── Provider interface ───────────────────────────────────────
export interface SportsDataProvider {
  readonly config: SportProviderConfig;

  // Fixtures / Live Scores
  getFixtures(sport: string, params: { date?: string; league?: string; team?: string; live?: boolean }): Promise<ProviderFixture[]>;
  getFixtureById(sport: string, fixtureId: string): Promise<ProviderFixture | null>;

  // Standings
  getStandings(sport: string, league: string, season?: string): Promise<ProviderStanding[]>;

  // Teams
  getTeams(sport: string, params: { league?: string; search?: string }): Promise<ProviderTeam[]>;
  getTeamById(sport: string, teamId: string): Promise<ProviderTeam | null>;

  // Players
  getPlayers(sport: string, params: { team?: string; search?: string }): Promise<ProviderPlayer[]>;

  // Top Scorers
  getTopScorers(sport: string, league: string, season?: string): Promise<ProviderTopScorer[]>;

  // Competitions
  getCompetitions(sport: string): Promise<ProviderCompetition[]>;

  // Health check
  isAvailable(): Promise<boolean>;
}

// ─── Provider Registry ────────────────────────────────────────
// Dynamic registry — providers can be added, removed, or swapped
// without changing any UI code. The registry is the single source
// of truth for which providers are available.

class ProviderRegistry {
  private providers = new Map<string, SportsDataProvider>();

  register(provider: SportsDataProvider): void {
    this.providers.set(provider.config.id, provider);
  }

  unregister(providerId: string): void {
    this.providers.delete(providerId);
  }

  get(providerId: string): SportsDataProvider | undefined {
    return this.providers.get(providerId);
  }

  /** Find the best provider for a given sport slug */
  getForSport(sportSlug: string): SportsDataProvider | undefined {
    // Prefer providers that explicitly support this sport
    for (const provider of this.providers.values()) {
      if (provider.config.supportedSports.includes(sportSlug)) {
        return provider;
      }
    }
    // Fallback to first available provider
    return this.providers.values().next().value;
  }

  /** Get all registered providers */
  getAll(): SportsDataProvider[] {
    return [...this.providers.values()];
  }

  /** Get providers that support a given sport */
  getProvidersForSport(sportSlug: string): SportsDataProvider[] {
    return [...this.providers.values()].filter(
      p => p.config.supportedSports.includes(sportSlug)
    );
  }
}

// Singleton registry
export const providerRegistry = new ProviderRegistry();
