export type AdminRoleType = 
  | "SUPER_ADMIN"
  | "ORGANIZATION_ADMIN"
  | "SECURITY_MANAGER"
  | "PROGRAM_ADMIN"
  | "TEAM_MANAGER"
  | "FINANCE_ADMIN"
  | "BILLING_ASSISTANT"
  | "ROSTER_ASSISTANT"
  | "MATCH_OFFICIAL_ASSISTANT";

export interface RolePermissions {
  role: string;
  parentRole?: string;
  allowedScopes: string[];
  canDelegateSubAssistants: boolean;
  actions: string[];
}

export const ROLE_HIERARCHY: Record<AdminRoleType, RolePermissions> = {
  SUPER_ADMIN: {
    role: "Super Admin / Owner",
    allowedScopes: ["ALL"],
    canDelegateSubAssistants: true,
    actions: ["*"],
  },
  ORGANIZATION_ADMIN: {
    role: "Organization Admin",
    allowedScopes: ["COMPETITIONS", "TEAMS", "SPORTS", "NEWS"],
    canDelegateSubAssistants: true,
    actions: ["manage:users", "manage:teams", "manage:settings"],
  },
  FINANCE_ADMIN: {
    role: "Finance Admin",
    allowedScopes: ["FINANCE"],
    canDelegateSubAssistants: true,
    actions: ["manage:billing", "manage:payouts", "view:reports"],
  },
  BILLING_ASSISTANT: {
    role: "Billing Assistant",
    parentRole: "FINANCE_ADMIN",
    allowedScopes: ["FINANCE"],
    canDelegateSubAssistants: false,
    actions: ["create:invoices", "process:refunds", "view:transactions"],
  },
  PROGRAM_ADMIN: {
    role: "Program / Competition Admin",
    allowedScopes: ["COMPETITIONS"],
    canDelegateSubAssistants: true,
    actions: ["manage:leagues", "manage:schedules"],
  },
  ROSTER_ASSISTANT: {
    role: "Roster Assistant",
    parentRole: "PROGRAM_ADMIN",
    allowedScopes: ["COMPETITIONS", "TEAMS"],
    canDelegateSubAssistants: false,
    actions: ["verify:eligibility", "update:roster"],
  },
  MATCH_OFFICIAL_ASSISTANT: {
    role: "Match Official Assistant",
    parentRole: "PROGRAM_ADMIN",
    allowedScopes: ["COMPETITIONS"],
    canDelegateSubAssistants: false,
    actions: ["submit:scores", "log:penalties"],
  },
  SECURITY_MANAGER: {
    role: "Security Manager",
    allowedScopes: ["SECURITY"],
    canDelegateSubAssistants: false,
    actions: ["view:audit_logs", "manage:sso"],
  },
  TEAM_MANAGER: {
    role: "Team Manager / Coach",
    allowedScopes: ["TEAMS"],
    canDelegateSubAssistants: false,
    actions: ["manage:lineup", "communicate:team"],
  },
};
