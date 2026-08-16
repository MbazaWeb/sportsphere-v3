// ─── Commentator role module ──────────────────────────────────
//
// Custom renderers for: overview (commentator card + career stats +
// recent broadcasts preview) and spotlight (the full Broadcast Log).
// Other tabs fall back to the engine generic renderer.

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { commentatorConfig } from './config';
import { CommentatorOverviewTab } from './OverviewTab';
import { CommentatorBroadcastsTab } from './BroadcastsTab';

export const commentatorRole: RoleConfig = {
  ...commentatorConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview':  return <CommentatorOverviewTab   apiUser={props.apiUser} />;
      case 'spotlight': return <CommentatorBroadcastsTab apiUser={props.apiUser} />;
      default:          return null; // falls back to engine default
    }
  },
};
