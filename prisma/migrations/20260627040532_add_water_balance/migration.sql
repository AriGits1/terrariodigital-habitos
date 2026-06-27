-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Encouragement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromProfileId" TEXT NOT NULL,
    "toProfileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Encouragement_fromProfileId_fkey" FOREIGN KEY ("fromProfileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Encouragement_toProfileId_fkey" FOREIGN KEY ("toProfileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Encouragement" ("createdAt", "fromProfileId", "id", "message", "read", "toProfileId", "type") SELECT "createdAt", "fromProfileId", "id", "message", "read", "toProfileId", "type" FROM "Encouragement";
DROP TABLE "Encouragement";
ALTER TABLE "new_Encouragement" RENAME TO "Encouragement";
CREATE INDEX "Encouragement_toProfileId_read_idx" ON "Encouragement"("toProfileId", "read");
CREATE INDEX "Encouragement_fromProfileId_idx" ON "Encouragement"("fromProfileId");
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
    "seeds" INTEGER NOT NULL DEFAULT 0,
    "water" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" DATETIME
);
INSERT INTO "new_Profile" ("biomeType", "createdAt", "currentStreak", "email", "hapticsEnabled", "id", "lastActiveDate", "name", "onboarded", "passwordHash", "role", "seeds", "shareTerrarium", "updatedAt", "voiceEnabled") SELECT "biomeType", "createdAt", "currentStreak", "email", "hapticsEnabled", "id", "lastActiveDate", "name", "onboarded", "passwordHash", "role", "seeds", "shareTerrarium", "updatedAt", "voiceEnabled" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
