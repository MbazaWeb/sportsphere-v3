// SportSphere — Store bridge
// Re-exports domain stores. New code should import from domain stores directly.

export { useAuthStore } from './authStore';
export { useNavigationStore } from './navigationStore';
export { useUIStore } from './uiStore';
export type { MockUserData, ViewingUser } from './uiStore';
export type { UserProfile, ProfileTypeId } from './authStore';
export type { TabId, HomeSubTab, ScoresSubTab, ActivitySubTab } from './navigationStore';

// Constants — no mock data
export { ADVANCED_ROLES, SPORTS_LIST, formatCount } from '@/constants';

// ─── Unified selector hook (legacy surface) ────────────────────
import { useAuthStore } from './authStore';
import { useNavigationStore } from './navigationStore';
import { useUIStore } from './uiStore';

type S =
  ReturnType<typeof useAuthStore.getState> &
  ReturnType<typeof useNavigationStore.getState> &
  ReturnType<typeof useUIStore.getState>;

export function useAppStore<T>(selector: (state: S) => T): T {
  const auth = useAuthStore();
  const nav  = useNavigationStore();
  const ui   = useUIStore();
  return selector({ ...auth, ...nav, ...ui } as S);
}
