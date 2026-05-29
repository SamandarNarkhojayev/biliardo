-- AlterTable: добавляем telegramChatId/telegramUsername в auth.User
ALTER TABLE "auth"."User"
  ADD COLUMN "telegramChatId"   BIGINT,
  ADD COLUMN "telegramUsername" TEXT;

CREATE UNIQUE INDEX "User_telegramChatId_key" ON "auth"."User"("telegramChatId");

-- CreateTable: TelegramLinkToken (одноразовые токены привязки)
CREATE TABLE "auth"."TelegramLinkToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelegramLinkToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TelegramLinkToken_token_key" ON "auth"."TelegramLinkToken"("token");
CREATE INDEX "TelegramLinkToken_userId_idx" ON "auth"."TelegramLinkToken"("userId");

ALTER TABLE "auth"."TelegramLinkToken" ADD CONSTRAINT "TelegramLinkToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
