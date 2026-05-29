-- Расширяет домен турниров: участники, матчи, столы.
-- Все таблицы живут в схеме "tournament".

-- CreateEnum
CREATE TYPE "tournament"."MatchStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BYE');

-- AlterTable: добавляем массив номеров столов в Tournament
ALTER TABLE "tournament"."Tournament" ADD COLUMN "tables" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

-- CreateIndex по organizerId (для каталога «мои турниры»)
CREATE INDEX "Tournament_organizerId_idx" ON "tournament"."Tournament"("organizerId");

-- CreateTable: Participant
CREATE TABLE "tournament"."Participant" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "seed" INTEGER,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- Уникальные индексы — один номер и один user.id на турнир.
CREATE UNIQUE INDEX "Participant_tournamentId_phone_key" ON "tournament"."Participant"("tournamentId", "phone");
CREATE UNIQUE INDEX "Participant_tournamentId_userId_key" ON "tournament"."Participant"("tournamentId", "userId");
CREATE INDEX "Participant_tournamentId_idx" ON "tournament"."Participant"("tournamentId");

-- FK Participant -> Tournament
ALTER TABLE "tournament"."Participant" ADD CONSTRAINT "Participant_tournamentId_fkey"
    FOREIGN KEY ("tournamentId") REFERENCES "tournament"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: Match
CREATE TABLE "tournament"."Match" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "participant1Id" TEXT,
    "participant2Id" TEXT,
    "winnerId" TEXT,
    "score1" INTEGER,
    "score2" INTEGER,
    "status" "tournament"."MatchStatus" NOT NULL DEFAULT 'PENDING',
    "tableLabel" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'main',
    "notifiedReady" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Match_tournamentId_round_matchNumber_idx" ON "tournament"."Match"("tournamentId", "round", "matchNumber");

-- FK Match -> Tournament
ALTER TABLE "tournament"."Match" ADD CONSTRAINT "Match_tournamentId_fkey"
    FOREIGN KEY ("tournamentId") REFERENCES "tournament"."Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
