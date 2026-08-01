-- SportSphere Initial Migration
-- Generated from schema.prisma

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE "UserRole" AS ENUM ('fan','team','player','coach','referee','journalist','analyst','creator','scout','stadium','venue','academy','community','organization','business');
CREATE TYPE "VerificationStatus" AS ENUM ('none','pending','verified','rejected');
CREATE TYPE "PostType" AS ENUM ('post','photo','video','spotlight','poll','prediction','highlight');
CREATE TYPE "MatchStatus" AS ENUM ('upcoming','live','ht','ft','postponed','cancelled');
CREATE TYPE "NotificationType" AS ENUM ('like','comment','follow','mention','match_start','match_goal','match_end','verification','system');

CREATE TABLE "User" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "handle" TEXT NOT NULL,
  "passwordHash" TEXT,
  "avatarUrl" TEXT,
  "avatarInitials" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'fan',
  "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'none',
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "bio" TEXT,
  "location" TEXT,
  "coverGradient" TEXT NOT NULL DEFAULT 'from-emerald-600 to-emerald-900',
  "followerCount" INTEGER NOT NULL DEFAULT 0,
  "followingCount" INTEGER NOT NULL DEFAULT 0,
  "postCount" INTEGER NOT NULL DEFAULT 0,
  "roleData" JSONB NOT NULL DEFAULT '{}',
  "sportsFollowing" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "registeredAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastSeenAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");
CREATE INDEX "User_handle_idx" ON "User"("handle");
CREATE INDEX "User_role_idx" ON "User"("role");

CREATE TABLE "Follow" (
  "followerId" TEXT NOT NULL,
  "followingId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Follow_pkey" PRIMARY KEY ("followerId","followingId"),
  CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Post" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "postType" "PostType" NOT NULL DEFAULT 'post',
  "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "teamTag" TEXT, "playerTag" TEXT,
  "isBreaking" BOOLEAN NOT NULL DEFAULT false,
  "likeCount" INTEGER NOT NULL DEFAULT 0,
  "commentCount" INTEGER NOT NULL DEFAULT 0,
  "shareCount" INTEGER NOT NULL DEFAULT 0,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Post_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX "Post_userId_idx" ON "Post"("userId");
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt" DESC);

CREATE TABLE "PostLike" (
  "postId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "PostLike_pkey" PRIMARY KEY ("postId","userId"),
  CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE,
  CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Comment" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "postId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL, "likeCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Comment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE,
  CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Poll" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "postId" TEXT NOT NULL, "question" TEXT NOT NULL,
  "options" JSONB NOT NULL DEFAULT '[]',
  "totalVotes" INTEGER NOT NULL DEFAULT 0, "endsAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Poll_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Poll_postId_key" UNIQUE ("postId"),
  CONSTRAINT "Poll_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE
);

CREATE TABLE "Match" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "league" TEXT NOT NULL, "homeTeam" TEXT NOT NULL, "awayTeam" TEXT NOT NULL,
  "homeScore" INTEGER, "awayScore" INTEGER,
  "status" "MatchStatus" NOT NULL DEFAULT 'upcoming',
  "minute" INTEGER, "venue" TEXT,
  "kickoffAt" TIMESTAMPTZ NOT NULL,
  "events" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Match_status_idx" ON "Match"("status");
CREATE INDEX "Match_kickoffAt_idx" ON "Match"("kickoffAt");

CREATE TABLE "Prediction" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL, "matchId" TEXT,
  "homeTeam" TEXT NOT NULL, "awayTeam" TEXT NOT NULL,
  "predictedHome" INTEGER, "predictedAway" INTEGER,
  "result" TEXT, "isCorrect" BOOLEAN, "pointsEarned" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Prediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL
);

CREATE TABLE "Community" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL, "description" TEXT, "topic" TEXT,
  "memberCount" INTEGER NOT NULL DEFAULT 0, "createdById" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Community_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Community_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE "CommunityMember" (
  "communityId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'member',
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "CommunityMember_pkey" PRIMARY KEY ("communityId","userId"),
  CONSTRAINT "CommunityMember_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE,
  CONSTRAINT "CommunityMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL, "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL, "body" TEXT, "isRead" BOOLEAN NOT NULL DEFAULT false,
  "actorId" TEXT, "referenceId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId","isRead","createdAt" DESC);

CREATE TABLE "Message" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "senderId" TEXT NOT NULL, "receiverId" TEXT NOT NULL,
  "content" TEXT NOT NULL, "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "VerificationRequest" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL, "role" TEXT NOT NULL,
  "roleData" JSONB NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "adminNotes" TEXT, "reviewedBy" TEXT,
  "submittedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(), "reviewedAt" TIMESTAMPTZ,
  CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Prisma migrations table
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" VARCHAR(36) NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);
