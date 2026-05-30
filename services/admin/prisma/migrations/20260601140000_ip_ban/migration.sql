-- CreateTable
CREATE TABLE "admin"."ip_ban" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "reason" TEXT,
    "until" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ip_ban_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ip_ban_ip_key" ON "admin"."ip_ban"("ip");

-- CreateIndex
CREATE INDEX "ip_ban_until_idx" ON "admin"."ip_ban"("until");
