import { providerRegistry } from './provider-interface';
import { TheSportsDBProvider } from './thesportsdb';
import { OpenLigaDBProvider } from './openligadb';
import { ErgastF1Provider } from './ergast';

export * from './provider-interface';
export * from './thesportsdb';
export * from './openligadb';
export * from './ergast';

export function initializeProviders() {
  // Check provider array safely without calling a non-existent getProviders() method
  const providers = (providerRegistry as any).providers || (providerRegistry as any).getAll?.() || [];
  if (Array.isArray(providers) && providers.length === 0) {
    providerRegistry.register(new TheSportsDBProvider());
    providerRegistry.register(new OpenLigaDBProvider());
    providerRegistry.register(new ErgastF1Provider());
  }
  return providerRegistry;
}

export { providerRegistry };
