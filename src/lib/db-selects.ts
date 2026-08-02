// SportSphere — Shared database select constants
// Single source of truth for Prisma select shapes used across API routes.

/**
 * Standard user fields to select when embedding user data in API responses.
 * Used by all API routes that include user information.
 */
export const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  handle: true,
  avatarUrl: true,
  avatarInitials: true,
  role: true,
  verificationStatus: true,
  isVerified: true,
  bio: true,
  location: true,
  coverGradient: true,
  followerCount: true,
  followingCount: true,
  postCount: true,
  sportsFollowing: true,
  roleData: true,
  registeredAt: true,
} as const;

/**
 * Extended user fields for the profile API route.
 * Includes all personal, contact, appearance, and settings fields.
 */
export const USER_SELECT_FULL = {
  ...USER_SELECT,
  coverUrl: true,
  aboutMe: true,
  pronouns: true,
  dateOfBirth: true,
  gender: true,
  nationality: true,
  countryOfOrigin: true,
  currentCountry: true,
  region: true,
  city: true,
  preferredLanguage: true,
  timezone: true,
  phone: true,
  website: true,
  whatsapp: true,
  socialInstagram: true,
  socialX: true,
  socialTikTok: true,
  socialFacebook: true,
  socialLinkedIn: true,
  socialYouTube: true,
  socialThreads: true,
  theme: true,
  fontSize: true,
  reducedMotion: true,
  highContrast: true,
  privacySettings: true,
  notifPrefs: true,
  interests: true,
  roleProfile: true,
} as const;
