// ─── Organization role module ─────────────────────────────────
//
// Custom renderers for: overview (org card + at-a-glance stats) and
// programs (the full Governance Hub). Other tabs fall back to engine.

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { organizationConfig } from './config';
import { OrganizationOverviewTab } from './OverviewTab';
import { OrganizationGovernanceTab } from './GovernanceTab';

export const organizationRole: RoleConfig = {
  ...organizationConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview': return <OrganizationOverviewTab   apiUser={props.apiUser} />;
      case 'programs': return <OrganizationGovernanceTab apiUser={props.apiUser} />;
      default:         return null; // falls back to engine default
    }
  },
};
