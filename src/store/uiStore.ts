import { create } from "zustand";

export interface MockUserData {
  id:string; name:string; handle:string; avatar:string; bio:string; role:string;
  location:string; joined:string; followers:number; following:number; posts:number;
  isVerified:boolean; isFollowing:boolean; coverGradient:string;
}

interface UIState {
  toastMessage: string|null; loginModalOpen: boolean; loginTrigger: string;
  createModalOpen: boolean; activeCreateType: string|null;
  viewingProfile: string|null; viewingUser: MockUserData|null;
  showToast: (msg: string, duration?: number) => void;
  setLoginModalOpen: (o: boolean) => void; setLoginTrigger: (t: string) => void;
  setCreateModalOpen: (o: boolean) => void; setActiveCreateType: (t: string|null) => void;
  setViewingProfile: (id: string|null) => void; setViewingUser: (u: MockUserData|null) => void;
}

let t: ReturnType<typeof setTimeout>|null = null;

export const useUIStore = create<UIState>((set) => ({
  toastMessage: null, loginModalOpen: false, loginTrigger: "",
  createModalOpen: false, activeCreateType: null, viewingProfile: null, viewingUser: null,
  showToast: (msg, dur=3000) => { if(t) clearTimeout(t); set({toastMessage:msg}); t=setTimeout(()=>set({toastMessage:null}),dur); },
  setLoginModalOpen: (o) => set({ loginModalOpen: o }),
  setLoginTrigger: (t) => set({ loginTrigger: t }),
  setCreateModalOpen: (o) => set({ createModalOpen: o }),
  setActiveCreateType: (type) => set({ activeCreateType: type }),
  setViewingProfile: (id) => set({ viewingProfile: id }),
  setViewingUser: (u) => set({ viewingUser: u }),
}));
