// ─── Creator role module ──────────────────────────────────────
//
// Custom renderers for: overview (creator card + audience metrics)
// and spotlight (the full Media Kit). Other tabs fall back to the
// engine generic renderer.

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { creatorConfig } from './config';
import { CreatorOverviewTab } from './OverviewTab';
import { CreatorMediaKitTab } from './MediaKitTab';

export const creatorRole: RoleConfig = {
  ...creatorConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview':  return <CreatorOverviewTab apiUser={props.apiUser} />;
      case 'spotlight': return <CreatorMediaKitTab  apiUser={props.apiUser} />;
      default:          return null; // falls back to engine default
    }
  },
};
