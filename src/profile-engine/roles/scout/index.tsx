// ─── Scout role module ─────────────────────────────────────────
//
// Custom renderers for: overview (hero card + funnel) and reports
// (the Scouting Board Kanban). Other tabs fall back to the engine
// generic renderer.

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { scoutConfig } from './config';
import { ScoutOverviewTab } from './OverviewTab';
import { ScoutBoardTab } from './BoardTab';

export const scoutRole: RoleConfig = {
  ...scoutConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview': return <ScoutOverviewTab apiUser={props.apiUser} />;
      case 'reports':  return <ScoutBoardTab    apiUser={props.apiUser} />;
      default:         return null; // falls back to engine default
    }
  },
};
