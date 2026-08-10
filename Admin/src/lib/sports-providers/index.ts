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

export { TheSportsDBProvider } from './thesportsdb';
export { OpenLigaDBProvider } from './openligadb';
export { ErgastF1Provider } from './ergast';

// ─── Initialize providers ─────────────────────────────────────
// Called once at app startup (or on first API request) to register
// all configured providers. The registry is then used by API routes
// to fetch data from the appropriate provider.

import { providerRegistry } from './provider-interface';
import { TheSportsDBProvider } from './thesportsdb';
import { OpenLigaDBProvider } from './openligadb';
import { ErgastF1Provider } from './ergast';

let initialized = false;

export function initializeProviders(): void {
  if (initialized) return;

  // ─── Free providers (always registered — no key required) ───
  providerRegistry.register(new TheSportsDBProvider());   // multi-sport, test key "3"
  providerRegistry.register(new OpenLigaDBProvider());     // German football
  providerRegistry.register(new ErgastF1Provider());       // Formula 1

  initialized = true;
}
