// ─── Community role module ────────────────────────────────────
//
// Custom renderers for: overview (community card + pulse stats) and
// members (the full Community Hub: stats + events + rules).

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { communityConfig } from './config';
import { CommunityOverviewTab } from './OverviewTab';
import { CommunityHubTab } from './HubTab';

export const communityRole: RoleConfig = {
  ...communityConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview': return <CommunityOverviewTab apiUser={props.apiUser} />;
      case 'members':  return <CommunityHubTab     apiUser={props.apiUser} />;
      default:         return null; // falls back to engine default
    }
  },
};
