import { create } from 'zustand';
import type { ProfileTypeId, UserProfile, RegistrationStep, VerificationStatus } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  userProfile: UserProfile | null;

  // Registration flow
  registrationOpen: boolean;
  registrationStep: RegistrationStep;
  selectedRole: ProfileTypeId | null;

  // Actions
  setIsAuthenticated: (value: boolean) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setRegistrationOpen: (open: boolean) => void;
  setRegistrationStep: (step: RegistrationStep) => void;
  setSelectedRole: (role: ProfileTypeId | null) => void;

  completeSimpleRegistration: (data: {
    name: string;
    email: string;
    handle: string;
    sports: string[];
  }) => void;

  completeAdvancedRegistration: (data: {
    name: string;
    email: string;
    handle: string;
    role: ProfileTypeId;
    roleData: Record<string, string>;
  }) => void;

  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userProfile: null,
  registrationOpen: false,
  registrationStep: 'choose',
  selectedRole: null,

  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setRegistrationOpen: (open) => set({ registrationOpen: open }),
  setRegistrationStep: (step) => set({ registrationStep: step }),
  setSelectedRole: (role) => set({ selectedRole: role }),

  completeSimpleRegistration: (data) => {
    const initials = data.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    const profile: UserProfile = {
      id: `usr_${Date.now()}`,
      name: data.name,
      email: data.email,
      handle: data.handle,
      avatar: initials,
      role: 'fan',
      verificationStatus: 'none' as VerificationStatus,
      bio: '',
      sportsFollowing: data.sports,
      registeredAt: new Date().toISOString(),
      roleData: {},
    };
    set({
      isAuthenticated: true,
      userProfile: profile,
      registrationOpen: false,
      registrationStep: 'choose',
    });
  },

  completeAdvancedRegistration: (data) => {
    const initials = data.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    const profile: UserProfile = {
      id: `usr_${Date.now()}`,
      name: data.name,
      email: data.email,
      handle: data.handle,
      avatar: initials,
      role: data.role,
      verificationStatus: 'pending' as VerificationStatus,
      bio: '',
      sportsFollowing: [],
      registeredAt: new Date().toISOString(),
      roleData: data.roleData,
    };
    set({
      isAuthenticated: true,
      userProfile: profile,
      registrationOpen: false,
      registrationStep: 'choose',
      selectedRole: null,
    });
  },

  logout: () =>
    set({
      isAuthenticated: false,
      userProfile: null,
      registrationOpen: false,
      registrationStep: 'choose',
      selectedRole: null,
    }),
}));
