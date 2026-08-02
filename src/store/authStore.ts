import { create } from 'zustand';
import { useUIStore } from './uiStore';

export type ProfileTypeId =
  | "team" | "competition" | "match" | "player" | "coach" | "referee"
  | "journalist" | "analyst" | "creator" | "scout" | "stadium" | "venue"
  | "academy" | "community" | "organization" | "business" | "fan";

export interface UserProfile {
  id: string; name: string; email: string; handle: string; avatar: string;
  role: ProfileTypeId; verificationStatus: "none"|"pending"|"verified"|"rejected";
  bio: string; sportsFollowing: string[]; registeredAt: string; roleData: Record<string,string>;
  isVerified?: boolean;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  location?: string;
  coverGradient?: string;
}

interface AuthState {
  isAuthenticated: boolean; userProfile: UserProfile | null;
  registrationOpen: boolean; registrationStep: "choose"|"simple"|"advanced-role"|"advanced-form"|"complete";
  selectedRole: ProfileTypeId | null;
  hydrated: boolean;
  setIsAuthenticated: (v: boolean) => void; setUserProfile: (p: UserProfile|null) => void;
  setRegistrationOpen: (o: boolean) => void; setRegistrationStep: (s: AuthState["registrationStep"]) => void;
  setSelectedRole: (r: ProfileTypeId|null) => void;
  setHydrated: (v: boolean) => void;
  completeSimpleRegistration: (d: {name:string;email:string;handle:string;password:string;sports:string[]}) => Promise<{ ok: boolean; error?: string }>;
  completeAdvancedRegistration: (d: {name:string;email:string;handle:string;password:string;role:ProfileTypeId;roleData:Record<string,string>}) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false, userProfile: null, registrationOpen: false,
  registrationStep: "choose", selectedRole: null, hydrated: false,
  setIsAuthenticated: (v) => set({ isAuthenticated: v }),
  setUserProfile: (p) => set({ userProfile: p }),
  setRegistrationOpen: (o) => set({ registrationOpen: o }),
  setRegistrationStep: (s) => set({ registrationStep: s }),
  setSelectedRole: (r) => set({ selectedRole: r }),
  setHydrated: (v) => set({ hydrated: v }),

  completeSimpleRegistration: async (d) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: d.name, email: d.email, handle: d.handle,
          password: d.password, sports: d.sports, role: 'fan',
        }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || 'Registration failed.' };

      set({
        isAuthenticated: true,
        registrationOpen: false,
        registrationStep: "choose",
        userProfile: data as UserProfile,
      });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error. Please try again.' };
    }
  },

  completeAdvancedRegistration: async (d) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: d.name, email: d.email, handle: d.handle,
          password: d.password, role: d.role, roleData: d.roleData,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || 'Registration failed.' };

      set({
        isAuthenticated: true,
        registrationOpen: false,
        registrationStep: "choose",
        selectedRole: null,
        userProfile: data as UserProfile,
      });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error. Please try again.' };
    }
  },

  logout: async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    // Clear any open profile overlays so they don't linger over the guest UI
    useUIStore.getState().setViewingProfile(null);
    useUIStore.getState().setViewingUser(null);
    set({
      isAuthenticated: false,
      userProfile: null,
      registrationOpen: false,
      registrationStep: "choose",
      selectedRole: null,
    });
  },
}));
