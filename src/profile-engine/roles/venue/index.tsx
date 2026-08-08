// ─── Venue role module ────────────────────────────────────────
//
// Custom renderer for overview (venue card + events preview) and
// facilities (facilities chips + operational info + tenants + full
// events calendar).

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { venueConfig } from './config';
import { VenueOverviewTab } from './OverviewTab';
import { VenueFacilitiesTab } from './FacilitiesTab';

export const venueRole: RoleConfig = {
  ...venueConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview':   return <VenueOverviewTab   apiUser={props.apiUser} />;
      case 'facilities': return <VenueFacilitiesTab apiUser={props.apiUser} />;
      default:           return null; // falls back to engine default
    }
  },
};
