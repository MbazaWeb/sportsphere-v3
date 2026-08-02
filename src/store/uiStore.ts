'use client';
import { create } from 'zustand';
import type { ViewingUser } from '@/types';

interface UIState {
  toastMessage: string | null;
  loginModalOpen: boolean;
  loginTrigger: string;
  createModalOpen: boolean;
  activeCreateType: string | null;
  viewingProfile: string | null;
  viewingUser: ViewingUser | null;

  showToast: (msg: string, duration?: number) => void;
  setLoginModalOpen: (o: boolean) => void;
  setLoginTrigger: (t: string) => void;
  setCreateModalOpen: (o: boolean) => void;
  setActiveCreateType: (t: string | null) => void;
  setViewingProfile: (id: string | null) => void;
  setViewingUser: (u: ViewingUser | null) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIState>((set) => ({
  toastMessage: null,
  loginModalOpen: false,
  loginTrigger: '',
  createModalOpen: false,
  activeCreateType: null,
  viewingProfile: null,
  viewingUser: null,

  showToast: (msg, dur = 3000) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toastMessage: msg });
    toastTimer = setTimeout(() => set({ toastMessage: null }), dur);
  },
  setLoginModalOpen: (o) => set({ loginModalOpen: o }),
  setLoginTrigger: (t) => set({ loginTrigger: t }),
  setCreateModalOpen: (o) => set({ createModalOpen: o }),
  setActiveCreateType: (t) => set({ activeCreateType: t }),
  setViewingProfile: (id) => set({ viewingProfile: id }),
  setViewingUser: (u) => set({ viewingUser: u }),
}));

// Keep MockUserData as alias for backward compat
export type MockUserData = ViewingUser;
export type { ViewingUser };
