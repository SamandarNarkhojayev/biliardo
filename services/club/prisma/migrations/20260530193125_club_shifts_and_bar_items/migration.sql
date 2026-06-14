-- AlterTable
ALTER TABLE "ClubSessionRecord" ADD COLUMN     "barOrders" JSONB,
ADD COLUMN     "shiftId" TEXT,
ADD COLUMN     "tariffName" TEXT;

-- CreateTable
CREATE TABLE "ClubShiftRecord" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "operatorName" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "tableRevenue" INTEGER NOT NULL DEFAULT 0,
    "barRevenue" INTEGER NOT NULL DEFAULT 0,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubShiftRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClubShiftRecord_clubId_startTime_idx" ON "ClubShiftRecord"("clubId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "ClubShiftRecord_clubId_externalId_key" ON "ClubShiftRecord"("clubId", "externalId");

-- CreateIndex
CREATE INDEX "ClubSessionRecord_clubId_shiftId_idx" ON "ClubSessionRecord"("clubId", "shiftId");
