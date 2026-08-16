// ─── Competition role module ──────────────────────────────────
//
// Custom renderers for: overview, standings, fixtures, trophies
// (renamed to HistoryTab internally). Other tabs fall back to engine.

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { competitionConfig } from './config';
import { CompetitionOverviewTab } from './OverviewTab';
import { CompetitionStandingsTab } from './StandingsTab';
import { CompetitionFixturesTab } from './FixturesTab';
import { CompetitionHistoryTab } from './HistoryTab';

export const competitionRole: RoleConfig = {
  ...competitionConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview':  return <CompetitionOverviewTab  apiUser={props.apiUser} />;
      case 'standings': return <CompetitionStandingsTab apiUser={props.apiUser} />;
      case 'fixtures':  return <CompetitionFixturesTab  apiUser={props.apiUser} />;
      case 'trophies':  return <CompetitionHistoryTab   apiUser={props.apiUser} />;
      default:          return null; // falls back to engine default
    }
  },
};
