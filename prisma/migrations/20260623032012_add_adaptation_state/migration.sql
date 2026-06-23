-- CreateTable
CREATE TABLE "AdaptationState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "habitEwma" TEXT NOT NULL DEFAULT '{}',
    "moodEwma" REAL NOT NULL DEFAULT 0,
    "engagementEwma" TEXT NOT NULL DEFAULT '{}',
    "adaptationReason" TEXT,
    "moduleOrderOverride" TEXT,
    "difficultyOverride" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdaptationState_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AdaptationState_profileId_key" ON "AdaptationState"("profileId");
