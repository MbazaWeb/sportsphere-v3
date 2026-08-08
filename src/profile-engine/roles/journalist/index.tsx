// ─── Journalist role module ───────────────────────────────────
//
// Custom renderers for: overview (hero card + impact stats) and
// articles (the article portfolio with engagement metrics).
// Other tabs fall back to the engine generic renderer.

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { journalistConfig } from './config';
import { JournalistOverviewTab } from './OverviewTab';
import { JournalistArticlesTab } from './ArticlesTab';

export const journalistRole: RoleConfig = {
  ...journalistConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview': return <JournalistOverviewTab apiUser={props.apiUser} />;
      case 'articles': return <JournalistArticlesTab apiUser={props.apiUser} />;
      default:         return null; // falls back to engine default
    }
  },
};
