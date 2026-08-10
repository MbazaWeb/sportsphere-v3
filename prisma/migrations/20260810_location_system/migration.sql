-- CreateTable: Location
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLower" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'city',
    "parentId" TEXT,
    "countryCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "displayLabel" TEXT NOT NULL,
    "searchTokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "population" INTEGER,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Location_search_prefix" ON "Location" USING gin ("searchTokens" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Location_type_idx" ON "Location"("type");

-- CreateIndex
CREATE INDEX "Location_parentId_idx" ON "Location"("parentId");

-- CreateIndex
CREATE INDEX "Location_countryCode_idx" ON "Location"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "Location_nameLower_parentId_key" ON "Location"("nameLower", "parentId");

-- CreateIndex
CREATE INDEX "Location_nameLower_idx" ON "Location"("nameLower");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
