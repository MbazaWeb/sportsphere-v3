-- ───────────────────────────────────────────────────────────────────
-- Phase 4 — Typed Role-Specific Profile Tables
-- ───────────────────────────────────────────────────────────────────
--
-- One table per custom role (17 total). Each table is 1:1 with User
-- via `userId` (primary key + foreign key). Columns match the FieldDef
-- keys in that role's config.ts exactly.
--
-- The legacy `roleProfile` JSON column on User is KEPT for the 5
-- generic roles (fan, official, support-staff, moderator,
-- administrator) and 4 legacy aliases (referee, stadium, medical,
-- developer). All 17 custom roles below take precedence when present.
--
-- Backfill: run `npx tsx prisma/backfill-typed-profiles.ts` after
-- applying this migration to copy existing roleProfile JSON into the
-- matching typed table.

-- ─── PlayerProfile ─────────────────────────────────────────────
CREATE TABLE "PlayerProfile" (
    "userId" TEXT NOT NULL,
    "position" TEXT,
    "secondaryPosition" TEXT,
    "preferredFoot" TEXT,
    "jerseyNumber" TEXT,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "playerType" TEXT,
    "careerStatus" TEXT,
    "appearances" DOUBLE PRECISION,
    "starts" DOUBLE PRECISION,
    "minutes" DOUBLE PRECISION,
    "goals" DOUBLE PRECISION,
    "assists" DOUBLE PRECISION,
    "yellowCards" DOUBLE PRECISION,
    "redCards" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "motm" DOUBLE PRECISION,
    "passAccuracy" DOUBLE PRECISION,
    "chancesCreated" DOUBLE PRECISION,
    "shots" DOUBLE PRECISION,
    "shotsOnTarget" DOUBLE PRECISION,
    "tackles" DOUBLE PRECISION,
    "interceptions" DOUBLE PRECISION,
    "duelsWon" DOUBLE PRECISION,
    "aerialDuels" DOUBLE PRECISION,
    "cleanSheets" DOUBLE PRECISION,
    "saves" DOUBLE PRECISION,
    "savePct" DOUBLE PRECISION,
    "goalsConceded" DOUBLE PRECISION,
    "penaltiesSaved" DOUBLE PRECISION,
    "currentClub" TEXT,
    "contractUntil" TEXT,
    "contractStatus" TEXT,
    "academy" TEXT,
    "debutYear" TEXT,
    "nationalTeam" TEXT,
    "internationalCaps" DOUBLE PRECISION,
    "internationalGoals" DOUBLE PRECISION,
    "transferHistory" TEXT,
    "marketValue" TEXT,
    "playingStyle" TEXT,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "injuryHistory" TEXT,
    "form" TEXT,
    "ranking" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlayerProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "PlayerProfile"
  ADD CONSTRAINT "PlayerProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── CoachProfile ──────────────────────────────────────────────
CREATE TABLE "CoachProfile" (
    "userId" TEXT NOT NULL,
    "coachingRole" TEXT,
    "currentTeam" TEXT,
    "license" TEXT,
    "licenseFederation" TEXT,
    "nationality" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "yearsCoaching" DOUBLE PRECISION,
    "matchesManaged" DOUBLE PRECISION,
    "wins" DOUBLE PRECISION,
    "draws" DOUBLE PRECISION,
    "losses" DOUBLE PRECISION,
    "goalsFor" DOUBLE PRECISION,
    "goalsAgainst" DOUBLE PRECISION,
    "cleanSheets" DOUBLE PRECISION,
    "pointsPerGame" DOUBLE PRECISION,
    "trophiesWon" DOUBLE PRECISION,
    "preferredFormation" TEXT,
    "alternateFormations" TEXT[],
    "playingPhilosophy" TEXT,
    "pressingStyle" TEXT,
    "possessionStyle" TEXT,
    "defensiveApproach" TEXT,
    "buildUpStyle" TEXT,
    "previousClubs" TEXT,
    "nationalTeams" TEXT,
    "academyExperience" TEXT,
    "playingCareer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "CoachProfile"
  ADD CONSTRAINT "CoachProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── TeamProfile ───────────────────────────────────────────────
CREATE TABLE "TeamProfile" (
    "userId" TEXT NOT NULL,
    "nickname" TEXT,
    "foundedYear" TEXT,
    "country" TEXT,
    "city" TEXT,
    "stadium" TEXT,
    "capacity" DOUBLE PRECISION,
    "league" TEXT,
    "division" TEXT,
    "coach" TEXT,
    "owner" TEXT,
    "colors" TEXT,
    "matchesPlayed" DOUBLE PRECISION,
    "wins" DOUBLE PRECISION,
    "draws" DOUBLE PRECISION,
    "losses" DOUBLE PRECISION,
    "goalsFor" DOUBLE PRECISION,
    "goalsAgainst" DOUBLE PRECISION,
    "points" DOUBLE PRECISION,
    "position" TEXT,
    "form" TEXT,
    "squad" TEXT,
    "achievements" TEXT,
    "historicPlayers" TEXT,
    "historicCoaches" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeamProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "TeamProfile"
  ADD CONSTRAINT "TeamProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── ScoutProfile ──────────────────────────────────────────────
CREATE TABLE "ScoutProfile" (
    "userId" TEXT NOT NULL,
    "scoutType" TEXT,
    "organization" TEXT,
    "geographicCoverage" TEXT,
    "sportsCovered" TEXT[],
    "yearsExperience" DOUBLE PRECISION,
    "specialization" TEXT,
    "playersDiscovered" DOUBLE PRECISION,
    "playersRecommended" DOUBLE PRECISION,
    "successfulSignings" DOUBLE PRECISION,
    "countriesCovered" DOUBLE PRECISION,
    "competitionsMonitored" DOUBLE PRECISION,
    "scoutingBoard" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ScoutProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "ScoutProfile"
  ADD CONSTRAINT "ScoutProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── JournalistProfile ─────────────────────────────────────────
CREATE TABLE "JournalistProfile" (
    "userId" TEXT NOT NULL,
    "publication" TEXT,
    "beat" TEXT,
    "location" TEXT,
    "yearsActive" DOUBLE PRECISION,
    "languages" TEXT[],
    "coverage" TEXT[],
    "articleCount" DOUBLE PRECISION,
    "exclusives" DOUBLE PRECISION,
    "interviews" DOUBLE PRECISION,
    "breakingNews" DOUBLE PRECISION,
    "totalViews" TEXT,
    "pressCredentials" TEXT,
    "articles" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JournalistProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "JournalistProfile"
  ADD CONSTRAINT "JournalistProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── CreatorProfile ────────────────────────────────────────────
CREATE TABLE "CreatorProfile" (
    "userId" TEXT NOT NULL,
    "creatorType" TEXT,
    "platforms" TEXT[],
    "niche" TEXT,
    "audienceLocation" TEXT,
    "audienceAgeRange" TEXT,
    "audienceGender" TEXT,
    "languages" TEXT[],
    "followers" TEXT,
    "engagementRate" DOUBLE PRECISION,
    "avgViews" TEXT,
    "reach" TEXT,
    "postsPerWeek" DOUBLE PRECISION,
    "topContent" TEXT,
    "brandCollabs" TEXT,
    "bookingEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CreatorProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "CreatorProfile"
  ADD CONSTRAINT "CreatorProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── AnalystProfile ────────────────────────────────────────────
CREATE TABLE "AnalystProfile" (
    "userId" TEXT NOT NULL,
    "analystType" TEXT,
    "organization" TEXT,
    "expertise" TEXT[],
    "reportsPublished" DOUBLE PRECISION,
    "modelsCreated" DOUBLE PRECISION,
    "teamsAnalyzed" DOUBLE PRECISION,
    "playersAnalyzed" DOUBLE PRECISION,
    "topModels" TEXT,
    "predictions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AnalystProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "AnalystProfile"
  ADD CONSTRAINT "AnalystProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── CommentatorProfile ────────────────────────────────────────
CREATE TABLE "CommentatorProfile" (
    "userId" TEXT NOT NULL,
    "commentatorType" TEXT,
    "broadcaster" TEXT,
    "languages" TEXT[],
    "sports" TEXT[],
    "yearsActive" DOUBLE PRECISION,
    "matchesCovered" DOUBLE PRECISION,
    "competitions" DOUBLE PRECISION,
    "countries" DOUBLE PRECISION,
    "majorEvents" TEXT,
    "matchLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommentatorProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "CommentatorProfile"
  ADD CONSTRAINT "CommentatorProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── AgentProfile ──────────────────────────────────────────────
CREATE TABLE "AgentProfile" (
    "userId" TEXT NOT NULL,
    "agentType" TEXT,
    "agency" TEXT,
    "license" TEXT,
    "federation" TEXT,
    "countries" TEXT[],
    "playersRepresented" DOUBLE PRECISION,
    "coachesRepresented" DOUBLE PRECISION,
    "transfersCompleted" DOUBLE PRECISION,
    "totalTransferValue" TEXT,
    "activeNegotiations" DOUBLE PRECISION,
    "contractsManaged" DOUBLE PRECISION,
    "clientRoster" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgentProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "AgentProfile"
  ADD CONSTRAINT "AgentProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── OrganizationProfile ───────────────────────────────────────
CREATE TABLE "OrganizationProfile" (
    "userId" TEXT NOT NULL,
    "orgType" TEXT,
    "country" TEXT,
    "headquarters" TEXT,
    "foundedYear" TEXT,
    "leadership" TEXT,
    "departments" TEXT,
    "affiliates" TEXT,
    "competitions" TEXT,
    "programs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrganizationProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "OrganizationProfile"
  ADD CONSTRAINT "OrganizationProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── CompetitionProfile ────────────────────────────────────────
CREATE TABLE "CompetitionProfile" (
    "userId" TEXT NOT NULL,
    "competitionName" TEXT,
    "season" TEXT,
    "organizer" TEXT,
    "country" TEXT,
    "level" TEXT,
    "format" TEXT,
    "participants" DOUBLE PRECISION,
    "topScorer" TEXT,
    "topAssists" TEXT,
    "standings" TEXT,
    "fixtures" TEXT,
    "previousWinners" TEXT,
    "records" TEXT,
    "bracket" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompetitionProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "CompetitionProfile"
  ADD CONSTRAINT "CompetitionProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── LeagueProfile ─────────────────────────────────────────────
CREATE TABLE "LeagueProfile" (
    "userId" TEXT NOT NULL,
    "leagueName" TEXT,
    "country" TEXT,
    "division" TEXT,
    "organizer" TEXT,
    "foundedYear" TEXT,
    "currentSeason" TEXT,
    "teams" DOUBLE PRECISION,
    "matchdays" DOUBLE PRECISION,
    "topScorer" TEXT,
    "topAssists" TEXT,
    "avgGoals" DOUBLE PRECISION,
    "avgAttendance" DOUBLE PRECISION,
    "allTimeTopScorer" TEXT,
    "allTimeTopAppearances" TEXT,
    "standings" TEXT,
    "fixtures" TEXT,
    "champions" TEXT,
    "previousChampions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeagueProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "LeagueProfile"
  ADD CONSTRAINT "LeagueProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── AcademyProfile ────────────────────────────────────────────
CREATE TABLE "AcademyProfile" (
    "userId" TEXT NOT NULL,
    "academyName" TEXT,
    "parentOrg" TEXT,
    "location" TEXT,
    "foundedYear" TEXT,
    "director" TEXT,
    "programs" TEXT[],
    "curriculum" TEXT,
    "playersDeveloped" DOUBLE PRECISION,
    "playersPromoted" DOUBLE PRECISION,
    "proGraduates" DOUBLE PRECISION,
    "scholarships" DOUBLE PRECISION,
    "graduates" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AcademyProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "AcademyProfile"
  ADD CONSTRAINT "AcademyProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── VenueProfile ──────────────────────────────────────────────
CREATE TABLE "VenueProfile" (
    "userId" TEXT NOT NULL,
    "venueName" TEXT,
    "venueType" TEXT,
    "location" TEXT,
    "capacity" DOUBLE PRECISION,
    "surface" TEXT,
    "opened" TEXT,
    "owner" TEXT,
    "operator" TEXT,
    "facilities" TEXT[],
    "tenants" TEXT,
    "upcomingEvents" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VenueProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "VenueProfile"
  ADD CONSTRAINT "VenueProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── BusinessProfile ───────────────────────────────────────────
CREATE TABLE "BusinessProfile" (
    "userId" TEXT NOT NULL,
    "companyName" TEXT,
    "industry" TEXT,
    "foundedYear" TEXT,
    "headquarters" TEXT,
    "website" TEXT,
    "employees" DOUBLE PRECISION,
    "products" TEXT,
    "partnerTeams" TEXT,
    "partnerAthletes" TEXT,
    "sponsorships" TEXT,
    "campaigns" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "BusinessProfile"
  ADD CONSTRAINT "BusinessProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── CommercialPartnerProfile ──────────────────────────────────
CREATE TABLE "CommercialPartnerProfile" (
    "userId" TEXT NOT NULL,
    "partnerType" TEXT,
    "brand" TEXT,
    "sportsCategory" TEXT,
    "partnershipStatus" TEXT,
    "foundedYear" TEXT,
    "headquarters" TEXT,
    "website" TEXT,
    "sponsoredTeams" TEXT,
    "sponsoredPlayers" TEXT,
    "sponsoredCompetitions" TEXT,
    "sponsoredEvents" TEXT,
    "activeCampaigns" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommercialPartnerProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "CommercialPartnerProfile"
  ADD CONSTRAINT "CommercialPartnerProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── CommunityProfile ──────────────────────────────────────────
CREATE TABLE "CommunityProfile" (
    "userId" TEXT NOT NULL,
    "communityName" TEXT,
    "communityType" TEXT,
    "foundedYear" TEXT,
    "location" TEXT,
    "supportedTeam" TEXT,
    "description" TEXT,
    "memberCount" DOUBLE PRECISION,
    "activeMembers" DOUBLE PRECISION,
    "eventCount" DOUBLE PRECISION,
    "postCount" DOUBLE PRECISION,
    "events" TEXT,
    "rules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommunityProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "CommunityProfile"
  ADD CONSTRAINT "CommunityProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
