/**
 * lib/serializers.ts
 *
 * FIXES APPLIED:
 *   - `serializePublicUser` no longer exposes email             (Fix #6)
 *   - `phone` and `whatsapp` explicitly excluded from public output
 *     even if they somehow reach this function via USER_SELECT  (Fix #8)
 *   - `serializePrivateUser` is the correct place for email/phone;
 *     only call it on the user's own profile endpoint.
 *
 * Search your codebase for `serializePublicUser` and replace the
 * implementation with the one below.  No call-sites need changing.
 */

// ── Types (match your Prisma schema field names) ─────────────────────────────

interface UserRecord {
  id: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  role: string;
  createdAt: Date;
  privacySettings?: Record<string, unknown> | null;
  // Fields intentionally excluded from public serializer:
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
 */
export function serializePublicUser(u: UserRecord) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName ?? null,
    bio: u.bio ?? null,
    avatarUrl: u.avatarUrl ?? null,
    role: u.role,
    createdAt: u.createdAt,
    // email: u.email,   ← REMOVED — was leaking all user emails
    // phone: u.phone,   ← REMOVED — sensitive contact info
    // whatsapp: ...     ← REMOVED
  };
}

// ── Private serializer — only for the authenticated user's own profile ───────

/**
 * Extended serializer for the user viewing their own profile.
 * Apply conditional fields based on the user's privacy settings.
 *
 * Call this ONLY when the requester's session matches the profile owner:
 *   if (session.userId === profileUserId) return serializePrivateUser(user);
 */
export function serializePrivateUser(u: UserRecord) {
  return {
    ...serializePublicUser(u),
    email: u.email,
    phone: u.privacySettings && (u.privacySettings as any).showPhone
      ? u.phone
      : undefined,
    whatsapp: u.privacySettings && (u.privacySettings as any).showPhone
      ? u.whatsapp
      : undefined,
    notifPrefs: u.notifPrefs,
    privacySettings: u.privacySettings,
  };
}
