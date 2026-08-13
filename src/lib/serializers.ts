/**
 * lib/serializers.ts
 *
 * Serializers that control what user data is exposed in API responses.
 *
 * RULES:
 *  - serializePublicUser  → safe for any caller; NEVER includes email/phone/tokens
 *  - serializePrivateUser → only call when session.userId === profile owner's id
 *
 * Field names match the actual Prisma User model:
 *   handle (not username), name (not displayName), roleId/roleTypeId (not legacy role string)
 */

// ── Types (aligned with Prisma User model fields) ─────────────────────────────

export interface UserRecord {
  id: string;
  handle: string;           // Prisma field is `handle`, not `username`
  name: string;             // Prisma field is `name`, not `displayName`
  bio?: string | null;
  avatarUrl?: string | null;
  avatarInitials?: string | null;
  roleId: string;
  roleTypeId?: string | null;
  verificationStatus?: string;
  isVerified?: boolean;
  emailVerified?: boolean;
  followerCount?: number;
  fanCount?: number;
  followingCount?: number;
  postCount?: number;
  coverGradient?: string;
  coverUrl?: string | null;
  location?: string | null;
  sportsFollowing?: unknown;
  roleData?: unknown;
  registeredAt?: Date;
  createdAt?: Date;
  privacySettings?: Record<string, unknown> | null;
  // Sensitive — intentionally excluded from public serializer:
  email?: string;
  phone?: string | null;
  whatsapp?: string | null;
  passwordHash?: string;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  notifPrefs?: Record<string, unknown> | null;
}

// ── Public serializer — safe to return to any caller ────────────────────────

/**
 * Serialize a user record for public API responses.
 *
 * Never includes: email, phone, whatsapp, passwordHash, resetToken,
 * notifPrefs, or privacySettings.
 *
 * Maps Prisma field names to the API contract:
 *   handle → handle (also aliased as username for client compatibility)
 *   name   → name   (also aliased as displayName for client compatibility)
 */
export function serializePublicUser(u: UserRecord) {
  return {
    id: u.id,
    handle: u.handle,
    username: u.handle,          // alias for backward-compat
    name: u.name,
    displayName: u.name,         // alias for backward-compat
    bio: u.bio ?? null,
    avatarUrl: u.avatarUrl ?? null,
    avatar: u.avatarInitials ?? u.name.slice(0, 2).toUpperCase(),
    roleId: u.roleId,
    roleTypeId: u.roleTypeId ?? null,
    verificationStatus: u.verificationStatus ?? 'pending',
    isVerified: u.isVerified ?? false,
    emailVerified: u.emailVerified ?? false,
    followerCount: u.followerCount ?? 0,
    fanCount: u.fanCount ?? u.followerCount ?? 0,
    followingCount: u.followingCount ?? 0,
    postCount: u.postCount ?? 0,
    coverGradient: u.coverGradient ?? 'from-gray-800 to-gray-900',
    coverUrl: u.coverUrl ?? null,
    location: u.location ?? null,
    registeredAt: (u.registeredAt ?? u.createdAt)?.toISOString() ?? null,
    // email: — NEVER included in public responses
  };
}

// ── Private serializer — only for the authenticated user's own profile ───────

/**
 * Extended serializer for the user viewing their own profile.
 * Call this ONLY when the requester's session matches the profile owner.
 */
export function serializePrivateUser(u: UserRecord) {
  return {
    ...serializePublicUser(u),
    email: u.email,
    phone: u.privacySettings?.showPhone ? u.phone : undefined,
    whatsapp: u.privacySettings?.showPhone ? u.whatsapp : undefined,
    notifPrefs: u.notifPrefs,
    privacySettings: u.privacySettings,
  };
}
