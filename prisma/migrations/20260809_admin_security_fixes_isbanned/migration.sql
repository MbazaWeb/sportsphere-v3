-- Add isBanned, bannedAt, bannedReason fields to User model
ALTER TABLE "User" ADD COLUMN "isBanned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "bannedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "bannedReason" TEXT;
CREATE INDEX "User_isBanned_idx" ON "User"("isBanned");