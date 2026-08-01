import { create } from 'zustand';
import type { ProfileTypeId, MockUserData } from '@/types';

interface UIState {
  // Toast
  toastMessage: string | null;
  showToast: (message: string, duration?: number) => void;

  // Login modal
  loginModalOpen: boolean;
  loginTrigger: string;
  setLoginModalOpen: (open: boolean) => void;
  setLoginTrigger: (trigger: string) => void;

  // Create modal
  createModalOpen: boolean;
  activeCreateType: string | null;
  setCreateModalOpen: (open: boolean) => void;
  setActiveCreateType: (type: string | null) => void;

  // Profile explorer overlay (browse 17 profile types)
  viewingProfile: ProfileTypeId | null;
  setViewingProfile: (id: ProfileTypeId | null) => void;

  // Individual user profile overlay (click on a post author)
  viewingUser: MockUserData | null;
  setViewingUser: (user: MockUserData | null) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIState>((set) => ({
  toastMessage: null,
  showToast: (message, duration = 3000) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toastMessage: message });
    toastTimer = setTimeout(() => set({ toastMessage: null }), duration);
  },

  loginModalOpen: false,
  loginTrigger: '',
  setLoginModalOpen: (open) => set({ loginModalOpen: open }),
  setLoginTrigger: (trigger) => set({ loginTrigger: trigger }),

  createModalOpen: false,
  activeCreateType: null,
  setCreateModalOpen: (open) => set({ createModalOpen: open }),
  setActiveCreateType: (type) => set({ activeCreateType: type }),

  viewingProfile: null,
  setViewingProfile: (id) => set({ viewingProfile: id }),

  viewingUser: null,
  setViewingUser: (user) => set({ viewingUser: user }),
}));
