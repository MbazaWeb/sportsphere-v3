// ─── Team role module ──────────────────────────────────────────

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { teamConfig } from './config';
import { TeamOverviewTab } from './OverviewTab';
import { TeamSquadTab } from './SquadTab';
import { TeamPerformanceTab } from './PerformanceTab';
import { TeamTrophiesTab } from './TrophiesTab';

export const teamRole: RoleConfig = {
  ...teamConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview':    return <TeamOverviewTab    apiUser={props.apiUser} />;
      case 'squad':       return <TeamSquadTab       apiUser={props.apiUser} />;
      case 'performance': return <TeamPerformanceTab apiUser={props.apiUser} />;
      case 'trophies':    return <TeamTrophiesTab    apiUser={props.apiUser} />;
      default:            return null;
    }
  },
};
