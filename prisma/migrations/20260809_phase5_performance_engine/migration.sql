-- ───────────────────────────────────────────────────────────────────
-- Phase 5 — Performance Points & Ranking Engine
-- ───────────────────────────────────────────────────────────────────
--
-- Adds 10 new tables for a transparent, auditable, position-aware
-- performance ranking system covering Players, Coaches, and Teams.
--
-- Design principles:
--   * All point changes are traceable to a verified PerformanceEvent.
--   * KPI weights are configurable via KPIConfiguration + KPIWeight
--     (no code redeploy needed for tuning).
--   * Self-reported stats generate NO points until verified.
--   * Rank is multi-dimensional (overall, form, season, career,
--     improvement, consistency) and segmented by category bucket.
--   * Snapshots + history preserve the timeline for trend charts.
--   * Anti-gaming anomalies are flagged automatically.
--
-- Purely additive — no existing table is altered except User (new
-- 1:1 / 1:N relations, which add no columns).
-- ───────────────────────────────────────────────────────────────────

-- ─── PerformanceProfile (1:1 with User) ──────────────────────
CREATE TABLE "PerformanceProfile" (
    "id"                       TEXT              NOT NULL,
    "userId"                   TEXT              NOT NULL,
    "performanceScore"         DOUBLE PRECISION  NOT NULL DEFAULT 0,
    "totalPoints"              INTEGER           NOT NULL DEFAULT 0,
    "tier"                     TEXT              NOT NULL DEFAULT 'D',
    "formScore"                DOUBLE PRECISION  NOT NULL DEFAULT 0,
    "consistencyScore"         DOUBLE PRECISION  NOT NULL DEFAULT 0,
    "trendDirection"           TEXT              NOT NULL DEFAULT 'stable',
    "trendDelta"               DOUBLE PRECISION  NOT NULL DEFAULT 0,
    "improvementScore"         DOUBLE PRECISION  NOT NULL DEFAULT 0,
    "rankGlobal"               INTEGER           NOT NULL DEFAULT 0,
    "rankCountry"              INTEGER           NOT NULL DEFAULT 0,
    "rankRegion"               INTEGER           NOT NULL DEFAULT 0,
    "rankCategory"             INTEGER           NOT NULL DEFAULT 0,
    "rankPosition"             INTEGER           NOT NULL DEFAULT 0,
    "rankCompetition"          INTEGER           NOT NULL DEFAULT 0,
    "rankForm"                 INTEGER           NOT NULL DEFAULT 0,
    "rankSeason"               INTEGER           NOT NULL DEFAULT 0,
    "rankCareer"               INTEGER           NOT NULL DEFAULT 0,
    "rankImprovement"          INTEGER           NOT NULL DEFAULT 0,
    "rankConsistency"          INTEGER           NOT NULL DEFAULT 0,
    "rankMovement"             INTEGER           NOT NULL DEFAULT 0,
    "categoryBucket"           TEXT              NOT NULL DEFAULT '',
    "position"                 TEXT,
    "playerType"               TEXT,
    "competitionTier"          TEXT,
    "ageGroup"                 TEXT,
    "nextMilestonePoints"      INTEGER           NOT NULL DEFAULT 0,
    "nextMilestoneRank"        INTEGER           NOT NULL DEFAULT 0,
    "pointsAheadOfNext"        INTEGER           NOT NULL DEFAULT 0,
    "pointsBehindNext"         INTEGER           NOT NULL DEFAULT 0,
    "dataConfidence"           DOUBLE PRECISION  NOT NULL DEFAULT 0,
    "decayStatus"              TEXT              NOT NULL DEFAULT 'active',
    "decayPauseReason"         TEXT,
    "decayPausedUntil"         TIMESTAMP(3),
    "lastEventAt"              TIMESTAMP(3),
    "lastCalculatedAt"         TIMESTAMP(3),
    "lastRankComputedAt"       TIMESTAMP(3),
    "improvementOpportunities" JSONB             NOT NULL DEFAULT '[]',
    "createdAt"                TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                TIMESTAMP(3)      NOT NULL,

    CONSTRAINT "PerformanceProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PerformanceProfile_userId_key" ON "PerformanceProfile"("userId");
CREATE INDEX "PerformanceProfile_tier_idx"              ON "PerformanceProfile"("tier");
CREATE INDEX "PerformanceProfile_totalPoints_idx"       ON "PerformanceProfile"("totalPoints");
CREATE INDEX "PerformanceProfile_performanceScore_idx"  ON "PerformanceProfile"("performanceScore");
CREATE INDEX "PerformanceProfile_categoryBucket_idx"    ON "PerformanceProfile"("categoryBucket");
CREATE INDEX "PerformanceProfile_position_playerType_idx" ON "PerformanceProfile"("position", "playerType");

ALTER TABLE "PerformanceProfile"
  ADD CONSTRAINT "PerformanceProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── KPIConfiguration ────────────────────────────────────────
CREATE TABLE "KPIConfiguration" (
    "id"                        TEXT              NOT NULL,
    "kpiKey"                    TEXT              NOT NULL,
    "label"                     TEXT              NOT NULL,
    "category"                  TEXT              NOT NULL DEFAULT 'attacking',
    "appliesToRoles"            TEXT[]            NOT NULL DEFAULT ARRAY[]::TEXT[],
    "appliesToPositions"        TEXT[]            NOT NULL DEFAULT ARRAY[]::TEXT[],
    "positivePointsPerUnit"     DOUBLE PRECISION  NOT NULL DEFAULT 0,
    "negativePointsPerUnit"     DOUBLE PRECISION  NOT NULL DEFAULT 0,
    "maxContributionPerMatch"   DOUBLE PRECISION  NOT NULL DEFAULT 0,
    "maxContributionPerSeason"  DOUBLE PRECISION  NOT NULL DEFAULT 0,
    "minValue"                  DOUBLE PRECISION  NOT NULL DEFAULT 0,
    "maxValue"                  DOUBLE PRECISION  NOT NULL DEFAULT 0,
    "isActive"                  BOOLEAN           NOT NULL DEFAULT true,
    "description"               TEXT,
    "createdAt"                 TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                 TIMESTAMP(3)      NOT NULL,

    CONSTRAINT "KPIConfiguration_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "KPIConfiguration_kpiKey_key" UNIQUE ("kpiKey")
);

CREATE INDEX "KPIConfiguration_category_idx"        ON "KPIConfiguration"("category");
CREATE INDEX "KPIConfiguration_appliesToRoles_idx"  ON "KPIConfiguration" USING GIN ("appliesToRoles");

-- ─── KPIWeight ───────────────────────────────────────────────
CREATE TABLE "KPIWeight" (
    "id"                    TEXT              NOT NULL,
    "kpiConfigId"           TEXT              NOT NULL,
    "scope"                 TEXT              NOT NULL DEFAULT 'position',
    "scopeValue"            TEXT              NOT NULL,
    "weightMultiplier"      DOUBLE PRECISION  NOT NULL DEFAULT 1.0,
    "difficultyMultiplier"  DOUBLE PRECISION  NOT NULL DEFAULT 1.0,
    "isActive"              BOOLEAN           NOT NULL DEFAULT true,
    "createdAt"             TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3)      NOT NULL,

    CONSTRAINT "KPIWeight_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "KPIWeight_kpiConfigId_scope_scopeValue_key" UNIQUE ("kpiConfigId", "scope", "scopeValue")
);

CREATE INDEX "KPIWeight_scope_scopeValue_idx" ON "KPIWeight"("scope", "scopeValue");

ALTER TABLE "KPIWeight"
  ADD CONSTRAINT "KPIWeight_kpiConfigId_fkey"
  FOREIGN KEY ("kpiConfigId") REFERENCES "KPIConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── PerformanceEvent ────────────────────────────────────────
CREATE TABLE "PerformanceEvent" (
    "id"                   TEXT              NOT NULL,
    "userId"               TEXT              NOT NULL,
    "kpiConfigId"          TEXT,
    "eventType"            TEXT              NOT NULL,
    "value"                DOUBLE PRECISION  NOT NULL DEFAULT 1,
    "matchId"              TEXT,
    "matchExternalRef"     TEXT,
    "competition"          TEXT,
    "competitionTier"      TEXT,
    "season"               TEXT,
    "opponentName"         TEXT,
    "opponentStrength"     DOUBLE PRECISION,
    "teamStrength"         DOUBLE PRECISION,
    "matchDate"            TIMESTAMP(3)      NOT NULL,
    "source"               TEXT              NOT NULL DEFAULT 'manual',
    "sourceUserId"         TEXT,
    "verificationStatus"   TEXT              NOT NULL DEFAULT 'pending',
    "verifiedBy"           TEXT,
    "verifiedAt"           TIMESTAMP(3),
    "rejectionReason"      TEXT,
    "pointsCalculated"     DOUBLE PRECISION  NOT NULL DEFAULT 0,
    "notes"                TEXT,
    "createdAt"            TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PerformanceEvent_userId_matchDate_idx"   ON "PerformanceEvent"("userId", "matchDate");
CREATE INDEX "PerformanceEvent_verificationStatus_idx" ON "PerformanceEvent"("verificationStatus");
CREATE INDEX "PerformanceEvent_eventType_idx"          ON "PerformanceEvent"("eventType");
CREATE INDEX "PerformanceEvent_competition_season_idx" ON "PerformanceEvent"("competition", "season");

ALTER TABLE "PerformanceEvent"
  ADD CONSTRAINT "PerformanceEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PerformanceEvent"
  ADD CONSTRAINT "PerformanceEvent_kpiConfigId_fkey"
  FOREIGN KEY ("kpiConfigId") REFERENCES "KPIConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── PerformancePointTransaction ─────────────────────────────
CREATE TABLE "PerformancePointTransaction" (
    "id"               TEXT              NOT NULL,
    "userId"           TEXT              NOT NULL,
    "eventId"          TEXT,
    "transactionType"  TEXT              NOT NULL,
    "amount"           DOUBLE PRECISION  NOT NULL,
    "balanceBefore"    INTEGER           NOT NULL,
    "balanceAfter"     INTEGER           NOT NULL,
    "reason"           TEXT              NOT NULL,
    "reasonCode"       TEXT              NOT NULL,
    "verified"         BOOLEAN           NOT NULL DEFAULT false,
    "createdAt"        TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformancePointTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PerformancePointTransaction_userId_createdAt_idx" ON "PerformancePointTransaction"("userId", "createdAt");
CREATE INDEX "PerformancePointTransaction_transactionType_idx"  ON "PerformancePointTransaction"("transactionType");
CREATE INDEX "PerformancePointTransaction_reasonCode_idx"       ON "PerformancePointTransaction"("reasonCode");

ALTER TABLE "PerformancePointTransaction"
  ADD CONSTRAINT "PerformancePointTransaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PerformancePointTransaction"
  ADD CONSTRAINT "PerformancePointTransaction_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "PerformanceEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── PerformanceSnapshot ─────────────────────────────────────
CREATE TABLE "PerformanceSnapshot" (
    "id"                TEXT              NOT NULL,
    "userId"            TEXT              NOT NULL,
    "capturedAt"        TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period"            TEXT              NOT NULL DEFAULT 'daily',
    "performanceScore"  DOUBLE PRECISION  NOT NULL,
    "totalPoints"       INTEGER           NOT NULL,
    "formScore"         DOUBLE PRECISION  NOT NULL,
    "consistencyScore"  DOUBLE PRECISION  NOT NULL,
    "rankGlobal"        INTEGER           NOT NULL DEFAULT 0,
    "rankCategory"      INTEGER           NOT NULL DEFAULT 0,
    "tier"              TEXT              NOT NULL,

    CONSTRAINT "PerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PerformanceSnapshot_userId_capturedAt_idx" ON "PerformanceSnapshot"("userId", "capturedAt");
CREATE INDEX "PerformanceSnapshot_period_idx"            ON "PerformanceSnapshot"("period");

ALTER TABLE "PerformanceSnapshot"
  ADD CONSTRAINT "PerformanceSnapshot_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── RankingCategory ─────────────────────────────────────────
CREATE TABLE "RankingCategory" (
    "id"                TEXT              NOT NULL,
    "slug"              TEXT              NOT NULL,
    "label"             TEXT              NOT NULL,
    "dimension"         TEXT              NOT NULL DEFAULT 'overall',
    "role"              TEXT              NOT NULL DEFAULT 'player',
    "filters"           JSONB             NOT NULL DEFAULT '{}',
    "isActive"          BOOLEAN           NOT NULL DEFAULT true,
    "participantCount"  INTEGER           NOT NULL DEFAULT 0,
    "lastComputedAt"    TIMESTAMP(3),
    "createdAt"         TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3)      NOT NULL,

    CONSTRAINT "RankingCategory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RankingCategory_slug_key" UNIQUE ("slug")
);

CREATE INDEX "RankingCategory_dimension_idx" ON "RankingCategory"("dimension");
CREATE INDEX "RankingCategory_role_idx"      ON "RankingCategory"("role");

-- ─── RankingHistory ──────────────────────────────────────────
CREATE TABLE "RankingHistory" (
    "id"                TEXT              NOT NULL,
    "userId"            TEXT              NOT NULL,
    "categoryId"        TEXT              NOT NULL,
    "period"            TEXT              NOT NULL,
    "rank"              INTEGER           NOT NULL,
    "totalParticipants" INTEGER           NOT NULL,
    "points"            INTEGER           NOT NULL,
    "performanceScore"  DOUBLE PRECISION  NOT NULL,
    "capturedAt"        TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankingHistory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RankingHistory_userId_categoryId_period_key" UNIQUE ("userId", "categoryId", "period")
);

CREATE INDEX "RankingHistory_categoryId_rank_idx"   ON "RankingHistory"("categoryId", "rank");
CREATE INDEX "RankingHistory_userId_capturedAt_idx" ON "RankingHistory"("userId", "capturedAt");

ALTER TABLE "RankingHistory"
  ADD CONSTRAINT "RankingHistory_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RankingHistory"
  ADD CONSTRAINT "RankingHistory_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "RankingCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── PerformanceVerification ─────────────────────────────────
CREATE TABLE "PerformanceVerification" (
    "id"                   TEXT              NOT NULL,
    "eventId"              TEXT              NOT NULL,
    "userId"               TEXT              NOT NULL,
    "verifierRole"         TEXT              NOT NULL,
    "verifierUserId"       TEXT,
    "verifierExternalId"   TEXT,
    "status"               TEXT              NOT NULL DEFAULT 'pending',
    "verificationMethod"   TEXT              NOT NULL DEFAULT 'manual',
    "evidence"             JSONB             NOT NULL DEFAULT '{}',
    "notes"                TEXT,
    "reviewedAt"           TIMESTAMP(3),
    "createdAt"            TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceVerification_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PerformanceVerification_eventId_key" UNIQUE ("eventId")
);

CREATE INDEX "PerformanceVerification_status_idx"       ON "PerformanceVerification"("status");
CREATE INDEX "PerformanceVerification_verifierRole_idx" ON "PerformanceVerification"("verifierRole");

ALTER TABLE "PerformanceVerification"
  ADD CONSTRAINT "PerformanceVerification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PerformanceVerification"
  ADD CONSTRAINT "PerformanceVerification_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "PerformanceEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── PerformanceAnomaly ──────────────────────────────────────
CREATE TABLE "PerformanceAnomaly" (
    "id"                TEXT              NOT NULL,
    "userId"            TEXT,
    "eventType"         TEXT,
    "matchId"           TEXT,
    "anomalyType"       TEXT              NOT NULL,
    "severity"          TEXT              NOT NULL DEFAULT 'medium',
    "description"       TEXT              NOT NULL,
    "evidence"          JSONB             NOT NULL DEFAULT '{}',
    "status"            TEXT              NOT NULL DEFAULT 'open',
    "resolvedBy"        TEXT,
    "resolvedAt"        TIMESTAMP(3),
    "resolutionNotes"   TEXT,
    "createdAt"         TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceAnomaly_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PerformanceAnomaly_status_idx"      ON "PerformanceAnomaly"("status");
CREATE INDEX "PerformanceAnomaly_anomalyType_idx" ON "PerformanceAnomaly"("anomalyType");
CREATE INDEX "PerformanceAnomaly_userId_idx"      ON "PerformanceAnomaly"("userId");
