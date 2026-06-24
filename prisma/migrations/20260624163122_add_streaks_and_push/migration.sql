-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "seeds" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" DATETIME
);
INSERT INTO "new_Profile" ("biomeType", "createdAt", "email", "hapticsEnabled", "id", "name", "onboarded", "passwordHash", "role", "seeds", "shareTerrarium", "updatedAt", "voiceEnabled") SELECT "biomeType", "createdAt", "email", "hapticsEnabled", "id", "name", "onboarded", "passwordHash", "role", "seeds", "shareTerrarium", "updatedAt", "voiceEnabled" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PushSubscription_profileId_idx" ON "PushSubscription"("profileId");
