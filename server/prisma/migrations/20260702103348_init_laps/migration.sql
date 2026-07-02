-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "trackId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lap" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "lapNumber" INTEGER NOT NULL,
    "lapTimeinMS" INTEGER,
    "status" TEXT NOT NULL,
    "telemetryData" JSONB NOT NULL,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lap_sessionId_idx" ON "Lap"("sessionId");

-- CreateIndex
CREATE INDEX "Lap_status_idx" ON "Lap"("status");

-- AddForeignKey
ALTER TABLE "Lap" ADD CONSTRAINT "Lap_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
