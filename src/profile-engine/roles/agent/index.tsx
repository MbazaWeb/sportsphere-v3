// ─── Agent role module ────────────────────────────────────────
//
// Custom renderers for: overview (agent card + business metrics +
// top clients preview) and clients (the full Client Roster).
// Other tabs fall back to the engine generic renderer.

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { agentConfig } from './config';
import { AgentOverviewTab } from './OverviewTab';
import { AgentClientsTab } from './ClientsTab';

export const agentRole: RoleConfig = {
  ...agentConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview': return <AgentOverviewTab apiUser={props.apiUser} />;
      case 'clients':  return <AgentClientsTab  apiUser={props.apiUser} />;
      default:         return null; // falls back to engine default
    }
  },
};
