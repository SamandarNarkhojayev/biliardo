-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'REGISTRATION', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BracketType" AS ENUM ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS', 'GROUP_PLAYOFF', 'PAGE_PLAYOFF');

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizerId" TEXT NOT NULL,
    "organizerName" TEXT,
    "status" "TournamentStatus" NOT NULL DEFAULT 'REGISTRATION',
    "bracketType" "BracketType" NOT NULL DEFAULT 'SINGLE_ELIMINATION',
    "maxParticipants" INTEGER NOT NULL DEFAULT 16,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "inviteCode" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "prizeFund" INTEGER,
    "entryFee" INTEGER,
    "location" TEXT,
    "city" TEXT,
    "coverGradient" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrizePlace" (
    "id" TEXT NOT NULL,
    "place" INTEGER NOT NULL,
    "prize" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,

    CONSTRAINT "PrizePlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_inviteCode_key" ON "Tournament"("inviteCode");

-- CreateIndex
CREATE INDEX "Tournament_status_scheduledAt_idx" ON "Tournament"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Tournament_city_idx" ON "Tournament"("city");

-- CreateIndex
CREATE UNIQUE INDEX "PrizePlace_tournamentId_place_key" ON "PrizePlace"("tournamentId", "place");

-- AddForeignKey
ALTER TABLE "PrizePlace" ADD CONSTRAINT "PrizePlace_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
