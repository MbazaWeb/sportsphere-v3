// ─── Business role module ─────────────────────────────────────
//
// Custom renderers for: overview (company card + stats + website),
// shop (Products list grouped by category), and services (Partnership
// Portfolio: teams, athletes, sponsorships, campaigns).

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { businessConfig } from './config';
import { BusinessOverviewTab } from './OverviewTab';
import { BusinessProductsTab } from './ProductsTab';
import { BusinessPartnershipsTab } from './PartnershipsTab';

export const businessRole: RoleConfig = {
  ...businessConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview': return <BusinessOverviewTab      apiUser={props.apiUser} />;
      case 'shop':     return <BusinessProductsTab      apiUser={props.apiUser} />;
      case 'services': return <BusinessPartnershipsTab  apiUser={props.apiUser} />;
      default:         return null; // falls back to engine default
    }
  },
};
