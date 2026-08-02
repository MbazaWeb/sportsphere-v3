// ─── SportSphere — Sports Providers Index ─────────────────────
// Single entry point for all sports data providers.
// Import from here, not from individual provider files.

export {
  providerRegistry,
  type SportsDataProvider,
  type SportProviderConfig,
  type ProviderFixture,
  type ProviderMatchEvent,
  type ProviderStanding,
  type ProviderTeam,
  type ProviderPlayer,
  type ProviderTopScorer,
  type ProviderCompetition,
} from './provider-interface';

export { ApiFootballProvider } from './api-football';

// ─── Initialize providers ─────────────────────────────────────
// Called once at app startup (or on first API request) to register
// all configured providers. The registry is then used by API routes
// to fetch data from the appropriate provider.

import { providerRegistry } from './provider-interface';
import { ApiFootballProvider } from './api-football';

let initialized = false;

export function initializeProviders(): void {
  if (initialized) return;
  // Register API-Football provider if API key is configured
  if (process.env.API_FOOTBALL_KEY) {
    providerRegistry.register(new ApiFootballProvider());
  }
  initialized = true;
}
