/*
  Warnings:

  - You are about to drop the column `trackDurationBeats` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `trackStartBeat` on the `Project` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startBeat" INTEGER NOT NULL DEFAULT 0,
    "durationBeats" INTEGER NOT NULL DEFAULT 16,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Track_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bpm" INTEGER NOT NULL DEFAULT 120,
    "fps" INTEGER NOT NULL DEFAULT 24,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("bpm", "createdAt", "duration", "fps", "id", "name", "updatedAt", "userId") SELECT "bpm", "createdAt", "duration", "fps", "id", "name", "updatedAt", "userId" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_userId_idx" ON "Project"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Track_projectId_idx" ON "Track"("projectId");
