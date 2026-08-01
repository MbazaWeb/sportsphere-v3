import { create } from 'zustand';

interface UIState {
  loginModalOpen: boolean;
  setLoginModalOpen: (value: boolean) => void;
  toastMessage: string | null;
  setToastMessage: (message: string | null) => void;
  viewingProfile: string | null;
  setViewingProfile: (id: string | null) => void;
  viewingUser: string | null;
  setViewingUser: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  loginModalOpen: false,
  setLoginModalOpen: (value) => set({ loginModalOpen: value }),
  toastMessage: null,
  setToastMessage: (message) => set({ toastMessage: message }),
  viewingProfile: null,
  setViewingProfile: (id) => set({ viewingProfile: id }),
  viewingUser: null,
  setViewingUser: (id) => set({ viewingUser: id }),
}));
