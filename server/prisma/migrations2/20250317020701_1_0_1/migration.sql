-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bpm" INTEGER NOT NULL DEFAULT 120,
    "fps" INTEGER NOT NULL DEFAULT 24,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "trackStartBeat" INTEGER NOT NULL DEFAULT 0,
    "trackDurationBeats" INTEGER NOT NULL DEFAULT 120,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");
