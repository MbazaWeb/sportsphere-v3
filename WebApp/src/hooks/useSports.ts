'use client';
// ─── SportSphere — useSports Hook ─────────────────────────────
// Shared hook that fetches sports from /api/sports.
// Replaces all hardcoded SPORTS arrays across the codebase.
// Spec: Phase 17 — "No hardcoded sports. Everything should be data-driven."

import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';

export interface SportOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  category: string | null;
  sportType: string | null;
  format: string | null;
  contactType: string | null;
  olympicStatus: string | null;
  description: string | null;
  tags: string[];
  displayOrder: number;
}

interface UseSportsOptions {
  /** Filter by category (e.g. 'team_sport', 'individual', 'combat') */
  category?: string;
  /** Filter by sportType (e.g. 'indoor', 'outdoor') */
  sportType?: string;
  /** Filter by format (e.g. 'team', 'individual') */
  format?: string;
  /** Only return sport names (for backward compat with sportsFollowing) */
  namesOnly?: boolean;
  /** Maximum number of sports to return */
  limit?: number;
}

export function useSports(options: UseSportsOptions = {}) {
  const [sports, setSports] = useState<SportOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSports() {
      try {
        const params = new URLSearchParams();
        if (options.category) params.set('category', options.category);
        if (options.sportType) params.set('sportType', options.sportType);
        if (options.format) params.set('format', options.format);

        const res = await apiFetch(`/api/sports?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch sports');

        const data = await res.json();
        if (!cancelled) {
          let results = data as SportOption[];
          if (options.limit) results = results.slice(0, options.limit);
          setSports(results);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          // Fallback to minimal list so UI doesn't break
          setSports(FALLBACK_SPORTS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSports();
    return () => { cancelled = true; };
  }, [options.category, options.sportType, options.format, options.limit]);

  // Convenience: return just the names for backward compat
  const names = sports.map(s => s.name);

  // Convenience: return as { value, label } for dropdowns
  const selectOptions = sports.map(s => ({ value: s.slug, label: s.name, icon: s.icon }));

  return { sports, names, selectOptions, loading, error };
}

// ─── Fallback sports list ─────────────────────────────────────
// Only used if the API call fails. This is a safety net, not the
// primary data source. The spec says "No hardcoded sports" — this
// fallback exists for resilience, not as the norm.
const FALLBACK_SPORTS: SportOption[] = [
  { id: '1', name: 'Football', slug: 'football', icon: '⚽', category: 'team_sport', sportType: 'outdoor', format: 'team', contactType: 'contact', olympicStatus: 'olympic', description: 'The world\'s most popular sport', tags: [], displayOrder: 1 },
  { id: '2', name: 'Basketball', slug: 'basketball', icon: '🏀', category: 'team_sport', sportType: 'indoor', format: 'team', contactType: 'limited-contact', olympicStatus: 'olympic', description: '5v5 court sport', tags: [], displayOrder: 2 },
  { id: '3', name: 'Tennis', slug: 'tennis', icon: '🎾', category: 'racquet', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Racquet sport', tags: [], displayOrder: 3 },
  { id: '4', name: 'Cricket', slug: 'cricket', icon: '🏏', category: 'team_sport', sportType: 'outdoor', format: 'team', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Bat-and-ball game', tags: [], displayOrder: 4 },
  { id: '5', name: 'Rugby', slug: 'rugby-union', icon: '🏉', category: 'team_sport', sportType: 'outdoor', format: 'team', contactType: 'contact', olympicStatus: 'olympic', description: 'Full-contact sport', tags: [], displayOrder: 5 },
  { id: '6', name: 'Volleyball', slug: 'volleyball', icon: '🏐', category: 'team_sport', sportType: 'indoor', format: 'team', contactType: 'non-contact', olympicStatus: 'olympic', description: '6v6 court sport', tags: [], displayOrder: 6 },
  { id: '7', name: 'Athletics', slug: 'athletics', icon: '🏃', category: 'individual', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Track and field', tags: [], displayOrder: 7 },
  { id: '8', name: 'Boxing', slug: 'boxing', icon: '🥊', category: 'combat', sportType: 'indoor', format: 'individual', contactType: 'contact', olympicStatus: 'olympic', description: 'Combat sport', tags: [], displayOrder: 8 },
  { id: '9', name: 'Formula 1', slug: 'formula-1', icon: '🏎️', category: 'motorsport', sportType: 'outdoor', format: 'individual', contactType: 'non-contact', olympicStatus: 'none', description: 'Motorsport', tags: [], displayOrder: 9 },
  { id: '10', name: 'Esports', slug: 'esports', icon: '🎮', category: 'individual', sportType: 'indoor', format: 'team', contactType: 'non-contact', olympicStatus: 'none', description: 'Competitive gaming', tags: [], displayOrder: 10 },
  { id: '11', name: 'Baseball', slug: 'baseball', icon: '⚾', category: 'team_sport', sportType: 'outdoor', format: 'team', contactType: 'non-contact', olympicStatus: 'olympic', description: 'Bat-and-ball game', tags: [], displayOrder: 11 },
  { id: '12', name: 'Ice Hockey', slug: 'ice-hockey', icon: '🏒', category: 'team_sport', sportType: 'indoor', format: 'team', contactType: 'contact', olympicStatus: 'olympic', description: 'Ice sport', tags: [], displayOrder: 12 },
];
