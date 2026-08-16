-- CreateTable
CREATE TABLE "CommercialPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "partnerType" TEXT NOT NULL DEFAULT 'brand',
    "industry" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "country" TEXT,
    "city" TEXT,
    "description" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contractStart" TIMESTAMP(3),
    "contractEnd" TIMESTAMP(3),
    "contractValue" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tier" TEXT NOT NULL DEFAULT 'bronze',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialPartner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SponsorCampaign" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campaignType" TEXT NOT NULL DEFAULT 'brand_awareness',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "objectives" TEXT,
    "targetAudience" TEXT,
    "creatives" JSONB NOT NULL DEFAULT '[]',
    "totalImpressions" INTEGER NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalConversions" INTEGER NOT NULL DEFAULT 0,
    "totalEngagement" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CampaignDailyMetric" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignDailyMetric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnerSponsorship" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "sponsorshipType" TEXT NOT NULL DEFAULT 'sponsor',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "value" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "displayLabel" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerSponsorship_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BrandAsset" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "alt" TEXT,
    "description" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnerMetricSnapshot" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "impressions" BIGINT NOT NULL DEFAULT 0,
    "clicks" BIGINT NOT NULL DEFAULT 0,
    "conversions" BIGINT NOT NULL DEFAULT 0,
    "engagement" BIGINT NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION,
    "spend" DOUBLE PRECISION,
    "revenue" DOUBLE PRECISION,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerMetricSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommercialPartner_slug_key" ON "CommercialPartner"("slug");
CREATE INDEX "CommercialPartner_status_idx" ON "CommercialPartner"("status");
CREATE INDEX "CommercialPartner_partnerType_idx" ON "CommercialPartner"("partnerType");
CREATE INDEX "CommercialPartner_tier_idx" ON "CommercialPartner"("tier");
CREATE INDEX "CommercialPartner_isActive_idx" ON "CommercialPartner"("isActive");
CREATE INDEX "CommercialPartner_name_idx" ON "CommercialPartner"("name");
CREATE INDEX "SponsorCampaign_partnerId_idx" ON "SponsorCampaign"("partnerId");
CREATE INDEX "SponsorCampaign_status_idx" ON "SponsorCampaign"("status");
CREATE INDEX "SponsorCampaign_startDate_idx" ON "SponsorCampaign"("startDate");
CREATE UNIQUE INDEX "CampaignDailyMetric_campaignId_date_key" ON "CampaignDailyMetric"("campaignId", "date");
CREATE INDEX "CampaignDailyMetric_campaignId_idx" ON "CampaignDailyMetric"("campaignId");
CREATE INDEX "CampaignDailyMetric_date_idx" ON "CampaignDailyMetric"("date");
CREATE UNIQUE INDEX "PartnerSponsorship_partnerId_entityType_entityId_sponsorshipType_key" ON "PartnerSponsorship"("partnerId", "entityType", "entityId", "sponsorshipType");
CREATE INDEX "PartnerSponsorship_partnerId_idx" ON "PartnerSponsorship"("partnerId");
CREATE INDEX "PartnerSponsorship_entityType_entityId_idx" ON "PartnerSponsorship"("entityType", "entityId");
CREATE INDEX "PartnerSponsorship_isActive_idx" ON "PartnerSponsorship"("isActive");
CREATE INDEX "PartnerSponsorship_isVisible_idx" ON "PartnerSponsorship"("isVisible");
CREATE INDEX "BrandAsset_partnerId_idx" ON "BrandAsset"("partnerId");
CREATE INDEX "BrandAsset_assetType_idx" ON "BrandAsset"("assetType");
CREATE INDEX "BrandAsset_isPrimary_idx" ON "BrandAsset"("isPrimary");
CREATE UNIQUE INDEX "PartnerMetricSnapshot_partnerId_period_date_key" ON "PartnerMetricSnapshot"("partnerId", "period", "date");
CREATE INDEX "PartnerMetricSnapshot_partnerId_idx" ON "PartnerMetricSnapshot"("partnerId");
CREATE INDEX "PartnerMetricSnapshot_period_idx" ON "PartnerMetricSnapshot"("period");
CREATE INDEX "PartnerMetricSnapshot_date_idx" ON "PartnerMetricSnapshot"("date");

ALTER TABLE "SponsorCampaign" ADD CONSTRAINT "SponsorCampaign_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "CommercialPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignDailyMetric" ADD CONSTRAINT "CampaignDailyMetric_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SponsorCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerSponsorship" ADD CONSTRAINT "PartnerSponsorship_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "CommercialPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrandAsset" ADD CONSTRAINT "BrandAsset_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "CommercialPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerMetricSnapshot" ADD CONSTRAINT "PartnerMetricSnapshot_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "CommercialPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;