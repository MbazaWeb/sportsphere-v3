// ─── Academy role module ──────────────────────────────────────
//
// Custom renderers for: overview (academy card + outcomes) and
// squad (the Development Pipeline). The `programs` tab falls back
// to the engine generic renderer (shows the curriculum + age groups).

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { academyConfig } from './config';
import { AcademyOverviewTab } from './OverviewTab';
import { AcademyPipelineTab } from './PipelineTab';

export const academyRole: RoleConfig = {
  ...academyConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview': return <AcademyOverviewTab apiUser={props.apiUser} />;
      case 'squad':    return <AcademyPipelineTab apiUser={props.apiUser} />;
      default:         return null; // falls back to engine default
    }
  },
};
