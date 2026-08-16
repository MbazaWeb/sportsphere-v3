'use client';

// ─── RoleTabRenderer ───────────────────────────────────────────
//
// The single dispatcher component UserProfileViewer uses to render
// the active tab. Replaces the giant if/else chain in UserProfileViewer
// that imported 16 RoleContentTab wrappers.

import type { TabId, ApiUserLike } from './types';
import { renderTab } from './registry';

interface RoleTabRendererProps {
  role: string;
  tabId: TabId;
  apiUser: ApiUserLike | null;
  viewerHandle?: string | null;
}

export function RoleTabRenderer({ role, tabId, apiUser, viewerHandle }: RoleTabRendererProps) {
  const node = renderTab(role, tabId, { apiUser, role, viewerHandle });
  // If the engine returns null, the caller (UserProfileViewer) should
  // fall back to its own shared tabs (OverviewTab, FeedsTab, AboutTab, ShopTab).
  // We render null here and let the caller handle that.
  return <>{node}</>;
}
