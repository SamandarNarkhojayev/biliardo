-- CreateTable
CREATE TABLE "admin"."service_health_sample" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "status" INTEGER,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_health_sample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_health_sample_service_createdAt_idx" ON "admin"."service_health_sample"("service", "createdAt");

-- CreateIndex
CREATE INDEX "service_health_sample_createdAt_idx" ON "admin"."service_health_sample"("createdAt");
