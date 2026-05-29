-- CreateTable
CREATE TABLE "ClubSyncSnapshot" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "tables" JSONB NOT NULL,
    "revenue" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubSyncSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubSessionRecord" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "tableId" INTEGER NOT NULL,
    "tableName" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "tableCost" INTEGER NOT NULL,
    "barCost" INTEGER NOT NULL,
    "totalCost" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubSessionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClubSyncSnapshot_clubId_key" ON "ClubSyncSnapshot"("clubId");

-- CreateIndex
CREATE INDEX "ClubSessionRecord_clubId_date_idx" ON "ClubSessionRecord"("clubId", "date");

-- CreateIndex
CREATE INDEX "ClubSessionRecord_clubId_startTime_idx" ON "ClubSessionRecord"("clubId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "ClubSessionRecord_clubId_externalId_key" ON "ClubSessionRecord"("clubId", "externalId");
