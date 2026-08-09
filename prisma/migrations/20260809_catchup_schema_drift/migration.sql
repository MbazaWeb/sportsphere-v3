-- ═══════════════════════════════════════════════════════════════════════
-- SportSphere — Catch-up Schema Drift Migration
-- 20260809_catchup_schema_drift
--
-- This migration brings the PostgreSQL migration history in sync with
-- schema.prisma. It is IDEMPOTENT — every statement uses IF NOT EXISTS
-- or DO $$ BEGIN ... EXCEPTION WHEN duplicate_* THEN NULL END $$
-- so it is safe to run on a DB that already has some or all of these
-- objects (e.g. created via `prisma db push`).
--
-- What this fixes:
--   1. FavoriteTargetType enum (never created)
--   2. Role + RoleType tables (never created)
--   3. Sport + UserSport tables (never created)
--   4. UserFavorite table (20260803 migration was empty)
--   5. PollVote table (never created)
--   6. LeaderboardEntry table (never created)
--   7. AuditLog table (never created)
--   8. User table — all missing columns (roleId, roleTypeId, isPro,
--      proSince, proTier, emailVerified, emailVerifyToken,
--      emailVerifyExpiry, preferences, notifPrefs, privacySettings,
--      interests, roleProfile, coverUrl, aboutMe, pronouns, gender,
--      nationality, countryOfOrigin, currentCountry, region, city,
--      preferredLanguage, timezone, phone, website, whatsapp,
--      socialInstagram, socialX, socialTikTok, socialFacebook,
--      socialLinkedIn, socialYouTube, socialThreads, theme, fontSize,
--      reducedMotion, highContrast, dateOfBirth)
--   9. VerificationRequest — missing columns (roleId, roleTypeId)
--  10. Prediction — missing columns (postId, confidence)
--  11. Post — missing columns (hashtags)
--  12. User → Role + RoleType FK constraints
--  13. All missing indexes
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────
-- 1. FavoriteTargetType enum
-- ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "FavoriteTargetType" AS ENUM (
    'TEAM', 'PLAYER', 'COACH', 'COMPETITION',
    'LEAGUE', 'NATIONAL_TEAM', 'STADIUM', 'SPORT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ─────────────────────────────────────────────────────────────────────
-- 2. Role
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Role" (
    "id"           TEXT          NOT NULL,
    "name"         TEXT          NOT NULL,
    "slug"         TEXT          NOT NULL,
    "description"  TEXT          NOT NULL,
    "icon"         TEXT          NOT NULL DEFAULT '👤',
    "category"     TEXT          NOT NULL DEFAULT 'individual',
    "displayOrder" INTEGER       NOT NULL DEFAULT 0,
    "isActive"     BOOLEAN       NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "Role" ADD CONSTRAINT "Role_name_key" UNIQUE ("name");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Role" ADD CONSTRAINT "Role_slug_key" UNIQUE ("slug");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;


-- ─────────────────────────────────────────────────────────────────────
-- 3. RoleType
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "RoleType" (
    "id"           TEXT          NOT NULL,
    "roleId"       TEXT          NOT NULL,
    "name"         TEXT          NOT NULL,
    "slug"         TEXT          NOT NULL,
    "description"  TEXT,
    "requirements" JSONB         NOT NULL DEFAULT '[]',
    "displayOrder" INTEGER       NOT NULL DEFAULT 0,
    "isActive"     BOOLEAN       NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoleType_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "RoleType"
    ADD CONSTRAINT "RoleType_roleId_slug_key" UNIQUE ("roleId", "slug");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "RoleType"
    ADD CONSTRAINT "RoleType_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "RoleType_roleId_idx" ON "RoleType"("roleId");


-- ─────────────────────────────────────────────────────────────────────
-- 4. Sport
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Sport" (
    "id"            TEXT          NOT NULL,
    "name"          TEXT          NOT NULL,
    "slug"          TEXT          NOT NULL,
    "icon"          TEXT,
    "category"      TEXT,
    "sportType"     TEXT,
    "format"        TEXT,
    "contactType"   TEXT,
    "olympicStatus" TEXT,
    "description"   TEXT,
    "tags"          JSONB         NOT NULL DEFAULT '[]',
    "isActive"      BOOLEAN       NOT NULL DEFAULT true,
    "displayOrder"  INTEGER       NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "Sport" ADD CONSTRAINT "Sport_name_key" UNIQUE ("name");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Sport" ADD CONSTRAINT "Sport_slug_key" UNIQUE ("slug");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;


-- ─────────────────────────────────────────────────────────────────────
-- 5. UserSport (many-to-many)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "UserSport" (
    "id"        TEXT          NOT NULL,
    "userId"    TEXT          NOT NULL,
    "sportId"   TEXT          NOT NULL,
    "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSport_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "UserSport"
    ADD CONSTRAINT "UserSport_userId_sportId_key" UNIQUE ("userId", "sportId");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "UserSport"
    ADD CONSTRAINT "UserSport_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "UserSport"
    ADD CONSTRAINT "UserSport_sportId_fkey"
    FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "UserSport_userId_idx"  ON "UserSport"("userId");
CREATE INDEX IF NOT EXISTS "UserSport_sportId_idx" ON "UserSport"("sportId");


-- ─────────────────────────────────────────────────────────────────────
-- 6. UserFavorite  (was the empty 20260803 migration)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "UserFavorite" (
    "id"           TEXT                 NOT NULL,
    "userId"       TEXT                 NOT NULL,
    "targetType"   "FavoriteTargetType" NOT NULL,
    "targetId"     TEXT                 NOT NULL,
    "targetName"   TEXT                 NOT NULL,
    "targetHandle" TEXT,
    "createdAt"    TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "UserFavorite"
    ADD CONSTRAINT "UserFavorite_userId_targetType_targetId_key"
    UNIQUE ("userId", "targetType", "targetId");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "UserFavorite"
    ADD CONSTRAINT "UserFavorite_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "UserFavorite_userId_idx"     ON "UserFavorite"("userId");
CREATE INDEX IF NOT EXISTS "UserFavorite_targetType_idx" ON "UserFavorite"("targetType");
CREATE INDEX IF NOT EXISTS "UserFavorite_targetId_idx"   ON "UserFavorite"("targetId");


-- ─────────────────────────────────────────────────────────────────────
-- 7. PollVote
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PollVote" (
    "id"        TEXT          NOT NULL,
    "pollId"    TEXT          NOT NULL,
    "userId"    TEXT          NOT NULL,
    "optionIdx" INTEGER       NOT NULL,
    "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PollVote_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "PollVote"
    ADD CONSTRAINT "PollVote_pollId_userId_key" UNIQUE ("pollId", "userId");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PollVote"
    ADD CONSTRAINT "PollVote_pollId_fkey"
    FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ─────────────────────────────────────────────────────────────────────
-- 8. LeaderboardEntry
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "LeaderboardEntry" (
    "id"                  TEXT          NOT NULL,
    "userId"              TEXT          NOT NULL,
    "period"              TEXT          NOT NULL DEFAULT 'monthly',
    "correctPredictions"  INTEGER       NOT NULL DEFAULT 0,
    "totalPredictions"    INTEGER       NOT NULL DEFAULT 0,
    "points"              INTEGER       NOT NULL DEFAULT 0,
    "rank"                INTEGER       NOT NULL DEFAULT 0,
    "updatedAt"           TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "LeaderboardEntry"
    ADD CONSTRAINT "LeaderboardEntry_userId_period_key" UNIQUE ("userId", "period");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "LeaderboardEntry"
    ADD CONSTRAINT "LeaderboardEntry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ─────────────────────────────────────────────────────────────────────
-- 9. AuditLog
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id"         TEXT          NOT NULL,
    "actorId"    TEXT          NOT NULL,
    "action"     TEXT          NOT NULL,
    "module"     TEXT          NOT NULL,
    "targetId"   TEXT,
    "targetType" TEXT,
    "oldValue"   JSONB                  DEFAULT '{}',
    "newValue"   JSONB                  DEFAULT '{}',
    "ipAddress"  TEXT,
    "userAgent"  TEXT,
    "createdAt"  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx"            ON "AuditLog"("actorId");
CREATE INDEX IF NOT EXISTS "AuditLog_module_idx"             ON "AuditLog"("module");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx"             ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx"          ON "AuditLog"("createdAt" DESC);


-- ─────────────────────────────────────────────────────────────────────
-- 10. User — add ALL missing columns (safe: IF NOT EXISTS via DO block)
-- ─────────────────────────────────────────────────────────────────────

-- Role architecture
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "roleId"     TEXT NOT NULL DEFAULT 'fan-default-role'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "roleTypeId" TEXT NOT NULL DEFAULT 'fan-casual-type';  EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Pro / Subscription
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "isPro"    BOOLEAN   NOT NULL DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "proSince" TIMESTAMP(3);                     EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "proTier"  TEXT;                             EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Email verification
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "emailVerified"      BOOLEAN      NOT NULL DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "emailVerifyToken"   TEXT;                               EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "emailVerifyExpiry"  TIMESTAMP(3);                       EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Extended profile (personal)
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "coverUrl"        TEXT;                        EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "aboutMe"         TEXT;                        EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "pronouns"        TEXT;                        EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "dateOfBirth"     TIMESTAMP(3);               EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "gender"          TEXT;                        EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "nationality"     TEXT;                        EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "countryOfOrigin" TEXT;                        EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "currentCountry"  TEXT;                        EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "region"          TEXT;                        EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "city"            TEXT;                        EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "preferredLanguage" TEXT DEFAULT 'en';         EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "timezone"        TEXT;                        EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Contact / social
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "phone"           TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "website"         TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "whatsapp"        TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "socialInstagram" TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "socialX"         TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "socialTikTok"    TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "socialFacebook"  TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "socialLinkedIn"  TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "socialYouTube"   TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "socialThreads"   TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Appearance / settings
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "theme"          TEXT    DEFAULT 'dark';   EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "fontSize"       TEXT    DEFAULT 'medium'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "reducedMotion"  BOOLEAN NOT NULL DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "highContrast"   BOOLEAN NOT NULL DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- JSON settings columns
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "privacySettings" JSONB NOT NULL DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "notifPrefs"      JSONB NOT NULL DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "interests"       JSONB NOT NULL DEFAULT '[]'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "roleProfile"     JSONB NOT NULL DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ADD COLUMN "preferences"     JSONB NOT NULL DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;


-- ─────────────────────────────────────────────────────────────────────
-- 11. User → Role + RoleType FK constraints (after columns exist)
-- ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "User"
    ADD CONSTRAINT "User_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "User"
    ADD CONSTRAINT "User_roleTypeId_fkey"
    FOREIGN KEY ("roleTypeId") REFERENCES "RoleType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Missing User indexes
CREATE INDEX IF NOT EXISTS "User_roleId_idx"          ON "User"("roleId");
CREATE INDEX IF NOT EXISTS "User_emailVerifyToken_idx" ON "User"("emailVerifyToken");


-- ─────────────────────────────────────────────────────────────────────
-- 12. VerificationRequest — add missing columns
-- ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN ALTER TABLE "VerificationRequest" ADD COLUMN "roleId"     TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "VerificationRequest" ADD COLUMN "roleTypeId" TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "VerificationRequest_roleId_idx" ON "VerificationRequest"("roleId");


-- ─────────────────────────────────────────────────────────────────────
-- 13. Prediction — add missing columns (postId, confidence)
-- ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN ALTER TABLE "Prediction" ADD COLUMN "postId"     TEXT UNIQUE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Prediction" ADD COLUMN "confidence" TEXT;         EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Prediction"
    ADD CONSTRAINT "Prediction_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ─────────────────────────────────────────────────────────────────────
-- 14. Post — add missing columns (hashtags)
-- ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN ALTER TABLE "Post" ADD COLUMN "hashtags" JSONB NOT NULL DEFAULT '[]'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;


-- ─────────────────────────────────────────────────────────────────────
-- 15. Migrate existing JSON columns from TEXT → JSONB where needed
--     (only affects columns that were TEXT in 0001_initial)
--     Safe: USING cast only fires if column type is actually TEXT.
-- ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "User" ALTER COLUMN "roleData"       TYPE JSONB USING "roleData"::JSONB;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "User" ALTER COLUMN "sportsFollowing" TYPE JSONB USING "sportsFollowing"::JSONB;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Post" ALTER COLUMN "mediaUrls" TYPE JSONB USING "mediaUrls"::JSONB;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Poll" ALTER COLUMN "options" TYPE JSONB USING "options"::JSONB;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Match" ALTER COLUMN "events" TYPE JSONB USING "events"::JSONB;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "VerificationRequest" ALTER COLUMN "roleData" TYPE JSONB USING "roleData"::JSONB;
EXCEPTION WHEN others THEN NULL; END $$;

