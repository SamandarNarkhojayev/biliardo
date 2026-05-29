-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('PLAYER', 'CLUB');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'PLAYER',
ADD COLUMN     "clubName" TEXT;

-- CreateTable
CREATE TABLE "ClubApiPassword" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubApiPassword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClubApiPassword_userId_key" ON "ClubApiPassword"("userId");

-- AddForeignKey
ALTER TABLE "ClubApiPassword" ADD CONSTRAINT "ClubApiPassword_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
