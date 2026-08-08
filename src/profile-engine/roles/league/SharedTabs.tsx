'use client';

// ─── League Standings & Fixtures Tabs ─────────────────────────
//
// Reuses the same format as Competition:
//   standings: Pos | Team | P | W | D | L | GF | GA | GD | Pts
//   fixtures:  Date | Home | Score | Away | Round | Status
//
// Implemented as thin League-namespaced wrappers that re-export the
// Competition components (the format is identical — only the data
// source differs, and that's already abstracted via apiUser).

export { CompetitionStandingsTab as LeagueStandingsTab } from '../competition/StandingsTab';
export { CompetitionFixturesTab as LeagueFixturesTab } from '../competition/FixturesTab';
