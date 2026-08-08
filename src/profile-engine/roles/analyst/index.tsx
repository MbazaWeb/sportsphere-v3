// ─── Analyst role module ──────────────────────────────────────
//
// Custom renderers for: overview (analyst card + accuracy hero +
// portfolio stats) and tools (the full Prediction Record).
// Other tabs fall back to the engine generic renderer.

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { analystConfig } from './config';
import { AnalystOverviewTab } from './OverviewTab';
import { AnalystPredictionsTab } from './PredictionsTab';

export const analystRole: RoleConfig = {
  ...analystConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview': return <AnalystOverviewTab    apiUser={props.apiUser} />;
      case 'tools':    return <AnalystPredictionsTab apiUser={props.apiUser} />;
      default:         return null; // falls back to engine default
    }
  },
};
