import { create } from "zustand";

export type ProfileTypeId =
  | "team" | "competition" | "match" | "player" | "coach" | "referee"
  | "journalist" | "analyst" | "creator" | "scout" | "stadium" | "venue"
  | "academy" | "community" | "organization" | "business" | "fan";

export interface UserProfile {
  id: string; name: string; email: string; handle: string; avatar: string;
  role: ProfileTypeId; verificationStatus: "none"|"pending"|"verified"|"rejected";
  bio: string; sportsFollowing: string[]; registeredAt: string; roleData: Record<string,string>;
}

interface AuthState {
  isAuthenticated: boolean; userProfile: UserProfile | null;
  registrationOpen: boolean; registrationStep: "choose"|"simple"|"advanced-role"|"advanced-form"|"complete";
  selectedRole: ProfileTypeId | null;
  setIsAuthenticated: (v: boolean) => void; setUserProfile: (p: UserProfile|null) => void;
  setRegistrationOpen: (o: boolean) => void; setRegistrationStep: (s: AuthState["registrationStep"]) => void;
  setSelectedRole: (r: ProfileTypeId|null) => void;
  completeSimpleRegistration: (d: {name:string;email:string;handle:string;sports:string[]}) => void;
  completeAdvancedRegistration: (d: {name:string;email:string;handle:string;role:ProfileTypeId;roleData:Record<string,string>}) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false, userProfile: null, registrationOpen: false,
  registrationStep: "choose", selectedRole: null,
  setIsAuthenticated: (v) => set({ isAuthenticated: v }),
  setUserProfile: (p) => set({ userProfile: p }),
  setRegistrationOpen: (o) => set({ registrationOpen: o }),
  setRegistrationStep: (s) => set({ registrationStep: s }),
  setSelectedRole: (r) => set({ selectedRole: r }),
  completeSimpleRegistration: (d) => {
    const avatar = d.name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);
    set({ isAuthenticated: true, registrationOpen: false, registrationStep: "choose",
      userProfile: { id:`usr_${Date.now()}`, name:d.name, email:d.email, handle:d.handle,
        avatar, role:"fan", verificationStatus:"none", bio:"", sportsFollowing:d.sports,
        registeredAt:new Date().toISOString(), roleData:{} } });
  },
  completeAdvancedRegistration: (d) => {
    const avatar = d.name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);
    set({ isAuthenticated: true, registrationOpen: false, registrationStep: "choose", selectedRole: null,
      userProfile: { id:`usr_${Date.now()}`, name:d.name, email:d.email, handle:d.handle,
        avatar, role:d.role, verificationStatus:"pending", bio:"", sportsFollowing:[],
        registeredAt:new Date().toISOString(), roleData:d.roleData } });
  },
  logout: () => set({ isAuthenticated:false, userProfile:null, registrationOpen:false, registrationStep:"choose", selectedRole:null }),
}));
