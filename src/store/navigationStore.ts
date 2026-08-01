import { create } from 'zustand';
import type { TabId, HomeSubTab, ScoresSubTab, ActivitySubTab } from '@/types';

interface NavigationState {
  activeTab: TabId;
  homeSubTab: HomeSubTab;
  scoresSubTab: ScoresSubTab;
  activitySubTab: ActivitySubTab;

  // Profile section navigation
  profileSection:
    | 'main'
    | 'settings'
    | 'saved'
    | 'achievements'
    | 'predictions'
    | 'communities'
    | 'followers'
    | 'following';
  settingsSection: string;

  setActiveTab: (tab: TabId) => void;
  setHomeSubTab: (tab: HomeSubTab) => void;
  setScoresSubTab: (tab: ScoresSubTab) => void;
  setActivitySubTab: (tab: ActivitySubTab) => void;
  setProfileSection: (section: NavigationState['profileSection']) => void;
  setSettingsSection: (section: string) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeTab: 'home',
  homeSubTab: 'for-you',
  scoresSubTab: 'live',
  activitySubTab: 'all',
  profileSection: 'main',
  settingsSection: 'account',

  setActiveTab: (tab) => set({ activeTab: tab }),
  setHomeSubTab: (tab) => set({ homeSubTab: tab }),
  setScoresSubTab: (tab) => set({ scoresSubTab: tab }),
  setActivitySubTab: (tab) => set({ activitySubTab: tab }),
  setProfileSection: (section) => set({ profileSection: section }),
  setSettingsSection: (section) => set({ settingsSection: section }),
}));
