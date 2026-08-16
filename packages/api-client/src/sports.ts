import { createApiClient } from './index';

/**
 * Sports API
 * ----------
 * Server returns an array of sports directly.
 */
export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  category?: string;       // team_sport, individual, etc.
  sportType?: string;      // outdoor, indoor, water, etc.
  format?: string;         // team, singles, doubles, etc.
  contactType?: string;    // contact, non-contact, limited-contact
  olympicStatus?: string;  // olympic, non-olympic, paralympic
  description?: string;
  tags: string[];
  displayOrder: number;
}

export function createSportsApi(client: ReturnType<typeof createApiClient>) {
  return {
    /** GET /api/sports — list all active sports */
    list: (filters?: { category?: string; sportType?: string; format?: string; q?: string }) => {
      const params = new URLSearchParams();
      if (filters?.category)  params.set('category', filters.category);
      if (filters?.sportType) params.set('sportType', filters.sportType);
      if (filters?.format)    params.set('format', filters.format);
      if (filters?.q)         params.set('q', filters.q);
      const qs = params.toString();
      return client.get<Sport[]>(`/api/sports${qs ? `?${qs}` : ''}`);
    },
  };
}

export type SportsApi = ReturnType<typeof createSportsApi>;
