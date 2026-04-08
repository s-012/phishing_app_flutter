-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "username" TEXT,
    "displayName" TEXT,
    "phoneNumber" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "oauthProvider" TEXT,
    "oauthId" TEXT,
    "oauthEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "text" TEXT,
    "isPhishing" BOOLEAN NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "confidenceScore" REAL NOT NULL,
    "detectionMethod" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "totalScans" INTEGER NOT NULL DEFAULT 0,
    "phishingDetected" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_oauthId_idx" ON "User"("oauthId");

-- CreateIndex
CREATE INDEX "Scan_userId_idx" ON "Scan"("userId");

-- CreateIndex
CREATE INDEX "Scan_isPhishing_idx" ON "Scan"("isPhishing");

-- CreateIndex
CREATE INDEX "Scan_createdAt_idx" ON "Scan"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserStat_userId_key" ON "UserStat"("userId");

-- CreateIndex
CREATE INDEX "UserStat_userId_idx" ON "UserStat"("userId");
