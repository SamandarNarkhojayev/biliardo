-- Взнос участника (отмечает организатор) + идемпотентность напоминания «турнир через 2 часа».

-- AlterTable: флаг оплаты взноса на участнике
ALTER TABLE "tournament"."Participant" ADD COLUMN "paid" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: отметка о разосланном напоминании о старте
ALTER TABLE "tournament"."Tournament" ADD COLUMN "startReminderSentAt" TIMESTAMP(3);
