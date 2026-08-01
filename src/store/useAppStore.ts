export { useAuthStore } from "./authStore";
export { useNavigationStore } from "./navigationStore";
export { useUIStore } from "./uiStore";
export type { UserProfile, ProfileTypeId } from "./authStore";
export type { TabId, HomeSubTab, ScoresSubTab, ActivitySubTab } from "./navigationStore";
export type { MockUserData } from "./uiStore";

import { useAuthStore } from "./authStore";
import { useNavigationStore } from "./navigationStore";
import { useUIStore } from "./uiStore";

type S = ReturnType<typeof useAuthStore.getState> & ReturnType<typeof useNavigationStore.getState> & ReturnType<typeof useUIStore.getState>;

export function useAppStore<T>(selector: (state: S) => T): T {
  const auth = useAuthStore();
  const nav = useNavigationStore();
  const ui = useUIStore();
  return selector({ ...auth, ...nav, ...ui } as S);
}
