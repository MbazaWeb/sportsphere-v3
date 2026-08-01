// SportSphere — Store (Domain stores + compatibility bridge)
export { useAuthStore } from './authStore';
export { useNavigationStore } from './navigationStore';
export { useUIStore } from './uiStore';
export { ADVANCED_ROLES, SPORTS_LIST, MOCK_USERS, getMockUser, formatCount } from '@/constants';
export type { TabId, HomeSubTab, ScoresSubTab, ActivitySubTab, RegistrationStep, VerificationStatus, ProfileTypeId, UserProfile, MockUserData } from '@/types';

import { useAuthStore } from './authStore';
import { useNavigationStore } from './navigationStore';
import { useUIStore } from './uiStore';

type AuthSnapshot = ReturnType<typeof useAuthStore.getState>;
type NavSnapshot  = ReturnType<typeof useNavigationStore.getState>;
type UISnapshot   = ReturnType<typeof useUIStore.getState>;
type UnifiedSnapshot = AuthSnapshot & NavSnapshot & UISnapshot;

export function useAppStore<T>(selector: (state: UnifiedSnapshot) => T): T {
  const auth = useAuthStore();
  const nav  = useNavigationStore();
  const ui   = useUIStore();
  return selector({ ...auth, ...nav, ...ui } as UnifiedSnapshot);
}
