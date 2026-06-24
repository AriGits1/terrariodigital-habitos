-- CreateTable
CREATE TABLE "BiomeDecoration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "x" REAL NOT NULL,
    "z" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BiomeDecoration_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "biomeType" TEXT NOT NULL DEFAULT 'forest',
    "voiceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "hapticsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "shareTerrarium" BOOLEAN NOT NULL DEFAULT false,
    "seeds" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Profile" ("biomeType", "createdAt", "email", "hapticsEnabled", "id", "name", "onboarded", "passwordHash", "role", "shareTerrarium", "updatedAt", "voiceEnabled") SELECT "biomeType", "createdAt", "email", "hapticsEnabled", "id", "name", "onboarded", "passwordHash", "role", "shareTerrarium", "updatedAt", "voiceEnabled" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "BiomeDecoration_profileId_idx" ON "BiomeDecoration"("profileId");
