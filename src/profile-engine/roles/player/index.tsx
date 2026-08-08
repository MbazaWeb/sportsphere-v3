// ─── Player role module ────────────────────────────────────────
//
// Exports the player's RoleConfig with a custom `renderTab` that
// dispatches to player-specific tab components.

import type { RoleConfig, TabId, TabRenderProps } from '../../types';
import { playerConfig } from './config';
import { PlayerOverviewTab } from './OverviewTab';
import { PlayerStatsTab } from './StatsTab';
import { PlayerCareerTab } from './CareerTab';
import { PlayerAchievementsTab } from './AchievementsTab';
import { PlayerScoutingTab } from './ScoutingTab';

export const playerRole: RoleConfig = {
  ...playerConfig,
  renderTab: (tabId: TabId, props: TabRenderProps) => {
    switch (tabId) {
      case 'overview':     return <PlayerOverviewTab     apiUser={props.apiUser} />;
      case 'stats':        return <PlayerStatsTab        apiUser={props.apiUser} />;
      case 'career':       return <PlayerCareerTab       apiUser={props.apiUser} />;
      case 'achievements': return <PlayerAchievementsTab apiUser={props.apiUser} />;
      case 'scouting':     return <PlayerScoutingTab     apiUser={props.apiUser} />;
      default:             return null; // falls back to engine default
    }
  },
};
