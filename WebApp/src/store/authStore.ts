import { apiFetch } from '@/lib/api';
import { create } from 'zustand';
import { useUIStore } from './uiStore';
import type { ProfileTypeId } from '@/types';

export type { ProfileTypeId };

export interface UserProfile {
  id: string; name: string; email: string; handle: string; avatar: string; avatarUrl?: string | null;
  role: ProfileTypeId; verificationStatus: "none"|"pending"|"verified"|"rejected";
  bio: string; sportsFollowing: string[]; registeredAt: string; roleData: Record<string,string>;
  isVerified?: boolean; emailVerified?: boolean;
  isPro?: boolean; proSince?: string | null; proTier?: string | null;
  followerCount?: number;
  fanCount?: number;
  followingCount?: number;
  postCount?: number;
  location?: string;
  countryOfOrigin?: string | null;
  nationality?: string | null;
  aboutMe?: string | null;
  interests?: string[];
  website?: string | null;
  whatsapp?: string | null;
  socialInstagram?: string | null;
  socialX?: string | null;
  socialTikTok?: string | null;
  socialLinkedIn?: string | null;
  socialYouTube?: string | null;
  coverGradient?: string;
  coverUrl?: string | null;
  roleProfile?: Record<string, unknown> | null;
  // Phase 4: typed profile row (from typed table for custom roles)
  typedProfile?: Record<string, unknown> | null;
  roleId?: string;
  roleTypeId?: string;
  roleName?: string;
  roleSlug?: string;
  roleIcon?: string;
  typeName?: string;
  typeSlug?: string;
  sports?: Array<{ id: string; name: string; slug: string; icon: string | null; category: string | null; sportType: string | null; format: string | null }>;
}

interface AuthState {
  isAuthenticated: boolean; userProfile: UserProfile | null;
  registrationOpen: boolean; registrationStep: "choose"|"simple"|"complete";
  hydrated: boolean;
  setIsAuthenticated: (v: boolean) => void; setUserProfile: (p: UserProfile|null) => void;
  setRegistrationOpen: (o: boolean) => void; setRegistrationStep: (s: AuthState["registrationStep"]) => void;
  setHydrated: (v: boolean) => void;
  completeRegistration: (d: {name:string;email:string;handle:string;password:string;sports:string[];roleId?:string;roleTypeId?:string}) => Promise<{ ok: boolean; error?: string }>;
  submitRoleUpgrade: (d: {roleId:string;roleTypeId:string;roleData?:Record<string,string>}) => Promise<{ ok: boolean; error?: string; autoApproved?: boolean }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false, userProfile: null, registrationOpen: false,
  registrationStep: "choose", hydrated: false,
  setIsAuthenticated: (v) => set({ isAuthenticated: v }),
  setUserProfile: (p) => set({ userProfile: p }),
  setRegistrationOpen: (o) => set({ registrationOpen: o }),
  setRegistrationStep: (s) => set({ registrationStep: s }),
  setHydrated: (v) => set({ hydrated: v }),

  // Phase 5: Registration ONLY creates Fan accounts
  completeRegistration: async (d) => {
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: d.name, email: d.email, handle: d.handle,
          password: d.password, sports: d.sports,
          ...(d.roleId ? { roleId: d.roleId } : {}),
          ...(d.roleTypeId ? { roleTypeId: d.roleTypeId } : {}),
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

  // Phase 8: Pro Upgrade — submit role change for verification
  submitRoleUpgrade: async (d) => {
    try {
      const res = await apiFetch('/api/roles/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || 'Upgrade request failed.' };

      // Refresh user profile to reflect new role/verification status
      const meRes = await apiFetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        set({ userProfile: (meData.user || meData) as UserProfile });
      }

      return { ok: true, autoApproved: data.autoApproved ?? false };
    } catch {
      return { ok: false, error: 'Network error. Please try again.' };
    }
  },

  logout: async () => {
    try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    // Clear any open profile overlays so they don't linger over the guest UI
    useUIStore.getState().setViewingProfile(null);
    useUIStore.getState().setViewingUser(null);
    set({
      isAuthenticated: false,
      userProfile: null,
      registrationOpen: false,
      registrationStep: "choose",
    });
  },
}));
