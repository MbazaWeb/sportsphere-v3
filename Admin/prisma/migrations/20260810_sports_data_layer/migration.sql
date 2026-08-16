-- ─── SportSphere — Sports Data Layer Migration ──────────────
-- Adds: League, Team, Player, Coach, MatchProfile, NewsItem, Rumor,
--       ClaimRequest, AIJobLog tables
-- Adds: back-relations on Sport (no DB column change — Prisma virtual)
-- Adds: 'ai' to AuditLog.module (string column, no enum change)
--
-- Run with: prisma migrate deploy
-- Or manually: psql $DATABASE_URL -f this_file.sql

-- ─── League ─────────────────────────────────────────────────
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "sportId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT,
    "countryCode" TEXT,
    "logoUrl" TEXT,
    "type" TEXT NOT NULL DEFAULT 'league',
    "season" TEXT,
    "externalId" TEXT,
    "source" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdByAI" BOOLEAN NOT NULL DEFAULT false,
    "claimedById" TEXT,
    "claimedAt" TIMESTAMP(3),
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "League_slug_key" ON "League"("slug");
CREATE INDEX "League_sportId_idx" ON "League"("sportId");
CREATE INDEX "League_country_idx" ON "League"("country");
CREATE INDEX "League_source_externalId_idx" ON "League"("source", "externalId");

-- ─── Team ───────────────────────────────────────────────────
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT,
    "sportId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortName" TEXT,
    "city" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "logoUrl" TEXT,
    "venue" TEXT,
    "foundedYear" INTEGER,
    "externalId" TEXT,
    "source" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdByAI" BOOLEAN NOT NULL DEFAULT false,
    "claimedById" TEXT,
    "claimedAt" TIMESTAMP(3),
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");
CREATE INDEX "Team_leagueId_idx" ON "Team"("leagueId");
CREATE INDEX "Team_sportId_idx" ON "Team"("sportId");
CREATE INDEX "Team_country_idx" ON "Team"("country");
CREATE INDEX "Team_source_externalId_idx" ON "Team"("source", "externalId");
CREATE INDEX "Team_verified_idx" ON "Team"("verified");
CREATE INDEX "Team_createdByAI_idx" ON "Team"("createdByAI");

-- ─── Player ─────────────────────────────────────────────────
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "teamId" TEXT,
    "leagueId" TEXT,
    "sportId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "position" TEXT,
    "nationality" TEXT,
    "countryCode" TEXT,
    "photoUrl" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "heightCm" INTEGER,
    "weightKg" INTEGER,
    "shirtNumber" INTEGER,
    "externalId" TEXT,
    "source" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdByAI" BOOLEAN NOT NULL DEFAULT false,
    "claimedById" TEXT,
    "claimedAt" TIMESTAMP(3),
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Player_slug_key" ON "Player"("slug");
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");
CREATE INDEX "Player_leagueId_idx" ON "Player"("leagueId");
CREATE INDEX "Player_sportId_idx" ON "Player"("sportId");
CREATE INDEX "Player_nationality_idx" ON "Player"("nationality");
CREATE INDEX "Player_source_externalId_idx" ON "Player"("source", "externalId");
CREATE INDEX "Player_verified_idx" ON "Player"("verified");
CREATE INDEX "Player_createdByAI_idx" ON "Player"("createdByAI");
CREATE INDEX "Player_name_idx" ON "Player"("name");

-- ─── Coach ──────────────────────────────────────────────────
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "teamId" TEXT,
    "leagueId" TEXT,
    "sportId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "nationality" TEXT,
    "countryCode" TEXT,
    "photoUrl" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "role" TEXT NOT NULL DEFAULT 'head_coach',
    "externalId" TEXT,
    "source" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdByAI" BOOLEAN NOT NULL DEFAULT false,
    "claimedById" TEXT,
    "claimedAt" TIMESTAMP(3),
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Coach_slug_key" ON "Coach"("slug");
CREATE INDEX "Coach_teamId_idx" ON "Coach"("teamId");
CREATE INDEX "Coach_leagueId_idx" ON "Coach"("leagueId");
CREATE INDEX "Coach_sportId_idx" ON "Coach"("sportId");
CREATE INDEX "Coach_source_externalId_idx" ON "Coach"("source", "externalId");
CREATE INDEX "Coach_verified_idx" ON "Coach"("verified");
CREATE INDEX "Coach_createdByAI_idx" ON "Coach"("createdByAI");

-- ─── MatchProfile ───────────────────────────────────────────
CREATE TABLE "MatchProfile" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT,
    "sportId" TEXT,
    "homeTeamId" TEXT,
    "awayTeamId" TEXT,
    "homeTeamName" TEXT NOT NULL,
    "awayTeamName" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "minute" INTEGER,
    "period" TEXT,
    "venue" TEXT,
    "kickoffAt" TIMESTAMP(3) NOT NULL,
    "events" JSONB NOT NULL DEFAULT '[]',
    "externalId" TEXT,
    "source" TEXT,
    "createdByAI" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchProfile_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MatchProfile_leagueId_idx" ON "MatchProfile"("leagueId");
CREATE INDEX "MatchProfile_sportId_idx" ON "MatchProfile"("sportId");
CREATE INDEX "MatchProfile_status_idx" ON "MatchProfile"("status");
CREATE INDEX "MatchProfile_kickoffAt_idx" ON "MatchProfile"("kickoffAt");
CREATE INDEX "MatchProfile_source_externalId_idx" ON "MatchProfile"("source", "externalId");

-- ─── NewsItem ───────────────────────────────────────────────
CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "summary" TEXT,
    "imageUrl" TEXT,
    "imageOwnerName" TEXT,
    "imageOwnerUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "sportId" TEXT,
    "leagueId" TEXT,
    "teamId" TEXT,
    "playerId" TEXT,
    "coachId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "externalUrl" TEXT,
    "createdByAI" BOOLEAN NOT NULL DEFAULT false,
    "aiJobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NewsItem_slug_key" ON "NewsItem"("slug");
CREATE INDEX "NewsItem_sportId_idx" ON "NewsItem"("sportId");
CREATE INDEX "NewsItem_leagueId_idx" ON "NewsItem"("leagueId");
CREATE INDEX "NewsItem_teamId_idx" ON "NewsItem"("teamId");
CREATE INDEX "NewsItem_playerId_idx" ON "NewsItem"("playerId");
CREATE INDEX "NewsItem_createdByAI_idx" ON "NewsItem"("createdByAI");
CREATE INDEX "NewsItem_status_idx" ON "NewsItem"("status");
CREATE INDEX "NewsItem_createdAt_idx" ON "NewsItem"("createdAt");

-- ─── Rumor ──────────────────────────────────────────────────
CREATE TABLE "Rumor" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "externalUrl" TEXT,
    "credibility" INTEGER NOT NULL DEFAULT 50,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "sportId" TEXT,
    "leagueId" TEXT,
    "teamId" TEXT,
    "playerId" TEXT,
    "coachId" TEXT,
    "createdByAI" BOOLEAN NOT NULL DEFAULT false,
    "aiJobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rumor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Rumor_slug_key" ON "Rumor"("slug");
CREATE INDEX "Rumor_sportId_idx" ON "Rumor"("sportId");
CREATE INDEX "Rumor_teamId_idx" ON "Rumor"("teamId");
CREATE INDEX "Rumor_playerId_idx" ON "Rumor"("playerId");
CREATE INDEX "Rumor_createdByAI_idx" ON "Rumor"("createdByAI");
CREATE INDEX "Rumor_status_idx" ON "Rumor"("status");
CREATE INDEX "Rumor_createdAt_idx" ON "Rumor"("createdAt");

-- ─── ClaimRequest ───────────────────────────────────────────
CREATE TABLE "ClaimRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileType" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "profileName" TEXT NOT NULL,
    "leagueId" TEXT,
    "teamId" TEXT,
    "playerId" TEXT,
    "coachId" TEXT,
    "claimEmail" TEXT,
    "claimPhone" TEXT,
    "evidenceNotes" TEXT,
    "evidenceUrls" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewerId" TEXT,
    "reviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ClaimRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ClaimRequest_userId_idx" ON "ClaimRequest"("userId");
CREATE INDEX "ClaimRequest_profileType_profileId_idx" ON "ClaimRequest"("profileType", "profileId");
CREATE INDEX "ClaimRequest_status_idx" ON "ClaimRequest"("status");
CREATE INDEX "ClaimRequest_submittedAt_idx" ON "ClaimRequest"("submittedAt");

-- ─── AIJobLog ───────────────────────────────────────────────
CREATE TABLE "AIJobLog" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "triggeredBy" TEXT NOT NULL DEFAULT 'manual',
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsCreated" INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "logMessage" TEXT,
    "errorDetails" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AIJobLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AIJobLog_jobType_idx" ON "AIJobLog"("jobType");
CREATE INDEX "AIJobLog_status_idx" ON "AIJobLog"("status");
CREATE INDEX "AIJobLog_startedAt_idx" ON "AIJobLog"("startedAt");

-- ─── Foreign Keys ───────────────────────────────────────────
ALTER TABLE "League"    ADD CONSTRAINT "League_sportId_fkey"    FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Team"      ADD CONSTRAINT "Team_leagueId_fkey"     FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Team"      ADD CONSTRAINT "Team_sportId_fkey"      FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Player"    ADD CONSTRAINT "Player_teamId_fkey"     FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Player"    ADD CONSTRAINT "Player_leagueId_fkey"   FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Player"    ADD CONSTRAINT "Player_sportId_fkey"    FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Coach"     ADD CONSTRAINT "Coach_teamId_fkey"      FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Coach"     ADD CONSTRAINT "Coach_leagueId_fkey"    FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Coach"     ADD CONSTRAINT "Coach_sportId_fkey"     FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MatchProfile" ADD CONSTRAINT "MatchProfile_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MatchProfile" ADD CONSTRAINT "MatchProfile_sportId_fkey"  FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MatchProfile" ADD CONSTRAINT "MatchProfile_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MatchProfile" ADD CONSTRAINT "MatchProfile_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NewsItem"  ADD CONSTRAINT "NewsItem_sportId_fkey"  FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NewsItem"  ADD CONSTRAINT "NewsItem_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NewsItem"  ADD CONSTRAINT "NewsItem_teamId_fkey"   FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NewsItem"  ADD CONSTRAINT "NewsItem_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NewsItem"  ADD CONSTRAINT "NewsItem_coachId_fkey"  FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Rumor"     ADD CONSTRAINT "Rumor_sportId_fkey"     FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Rumor"     ADD CONSTRAINT "Rumor_leagueId_fkey"    FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Rumor"     ADD CONSTRAINT "Rumor_teamId_fkey"      FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Rumor"     ADD CONSTRAINT "Rumor_playerId_fkey"    FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Rumor"     ADD CONSTRAINT "Rumor_coachId_fkey"     FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClaimRequest" ADD CONSTRAINT "ClaimRequest_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClaimRequest" ADD CONSTRAINT "ClaimRequest_teamId_fkey"   FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClaimRequest" ADD CONSTRAINT "ClaimRequest_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClaimRequest" ADD CONSTRAINT "ClaimRequest_coachId_fkey"  FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;
