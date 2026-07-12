/*
  Warnings:

  - You are about to drop the column `lapTimeinMS` on the `Lap` table. All the data in the column will be lost.
  - You are about to drop the column `metrics` on the `Lap` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Lap` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Lap_status_idx";

-- AlterTable
ALTER TABLE "Lap" DROP COLUMN "lapTimeinMS",
DROP COLUMN "metrics",
DROP COLUMN "status",
ADD COLUMN     "finalTimeInMS" INTEGER,
ADD COLUMN     "isLapInvalid" BOOLEAN NOT NULL DEFAULT false;
