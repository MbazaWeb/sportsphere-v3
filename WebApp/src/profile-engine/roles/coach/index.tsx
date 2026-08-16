// ─── Coach role module ─────────────────────────────────────────

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { coachConfig } from './config';
import { CoachOverviewTab } from './OverviewTab';
import { CoachRecordTab } from './RecordTab';
import { CoachTacticalTab } from './TacticalTab';
import { CoachCareerTab } from './CareerTab';
import { CoachTrophiesTab } from './TrophiesTab';

export const coachRole: RoleConfig = {
  ...coachConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview':     return <CoachOverviewTab apiUser={props.apiUser} />;
      case 'stats':        return <CoachRecordTab  apiUser={props.apiUser} />;
      case 'tactical':     return <CoachTacticalTab apiUser={props.apiUser} />;
      case 'career':       return <CoachCareerTab   apiUser={props.apiUser} />;
      case 'achievements': return <CoachTrophiesTab apiUser={props.apiUser} />;
      default:             return null;
    }
  },
};
