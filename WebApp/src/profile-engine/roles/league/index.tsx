// ─── League role module ───────────────────────────────────────
//
// Custom renderers for: overview, standings, fixtures, trophies
// (champions roll). Standings + fixtures reuse Competition's
// components since the format is identical.

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { leagueConfig } from './config';
import { LeagueOverviewTab } from './OverviewTab';
import { LeagueChampionsTab } from './ChampionsTab';
import { LeagueStandingsTab, LeagueFixturesTab } from './SharedTabs';

export const leagueRole: RoleConfig = {
  ...leagueConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview':  return <LeagueOverviewTab  apiUser={props.apiUser} />;
      case 'standings': return <LeagueStandingsTab apiUser={props.apiUser} />;
      case 'fixtures':  return <LeagueFixturesTab  apiUser={props.apiUser} />;
      case 'trophies':  return <LeagueChampionsTab apiUser={props.apiUser} />;
      default:          return null; // falls back to engine default
    }
  },
};
