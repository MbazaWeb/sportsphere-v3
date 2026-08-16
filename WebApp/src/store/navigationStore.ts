import { create } from "zustand";

export type TabId = "home"|"scores"|"create"|"activity"|"profile";
export type HomeSubTab = "for-you"|"trending"|"spotlight"|"predictions"|"polls";
export type ScoresSubTab = "live"|"today"|"upcoming"|"results"|"standings";
export type ActivitySubTab = "all"|"social"|"sports"|"messages";

interface NavigationState {
  activeTab: TabId; homeSubTab: HomeSubTab; scoresSubTab: ScoresSubTab; activitySubTab: ActivitySubTab;
  profileSection: "main"|"settings"|"saved"|"achievements"|"predictions"|"communities"|"followers"|"fans"|"following"|"explore";
  settingsSection: string;
  /** Whether the bottom nav bar is currently visible */
  navVisible: boolean;
  /** Request the nav to show (resets hide timer) */
  showNav: () => void;
  /** Request the nav to hide */
  hideNav: () => void;
  setActiveTab: (t: TabId) => void; setHomeSubTab: (t: HomeSubTab) => void;
  setScoresSubTab: (t: ScoresSubTab) => void; setActivitySubTab: (t: ActivitySubTab) => void;
  setProfileSection: (s: NavigationState["profileSection"]) => void; setSettingsSection: (s: string) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeTab: "home", homeSubTab: "for-you", scoresSubTab: "live",
  activitySubTab: "all", profileSection: "main", settingsSection: "account",
  navVisible: true,
  showNav: () => set({ navVisible: true }),
  hideNav: () => set({ navVisible: false }),
  setActiveTab: (t) => set({ activeTab: t }),
  setHomeSubTab: (t) => set({ homeSubTab: t }),
  setScoresSubTab: (t) => set({ scoresSubTab: t }),
  setActivitySubTab: (t) => set({ activitySubTab: t }),
  setProfileSection: (s) => set({ profileSection: s }),
  setSettingsSection: (s) => set({ settingsSection: s }),
}));
