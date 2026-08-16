// ─── Commercial Partner role module ───────────────────────────
//
// Custom renderers for: overview (partner card + portfolio stats) and
// portfolio (the full Sponsorship Portfolio).

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { commercialPartnerConfig } from './config';
import { CommercialPartnerOverviewTab } from './OverviewTab';
import { CommercialPartnerPortfolioTab } from './PortfolioTab';

export const commercialPartnerRole: RoleConfig = {
  ...commercialPartnerConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview':  return <CommercialPartnerOverviewTab apiUser={props.apiUser} />;
      case 'portfolio': return <CommercialPartnerPortfolioTab apiUser={props.apiUser} />;
      default:          return null; // falls back to engine default
    }
  },
};
