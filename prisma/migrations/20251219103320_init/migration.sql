-- CreateTable
CREATE TABLE "ScanResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "vulnerabilities" JSONB,
    "scanDuration" INTEGER
);

-- CreateTable
CREATE TABLE "TrendingSite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rank" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "UrlCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "host" TEXT NOT NULL,
    "lastScan" DATETIME,
    "cachedResult" JSONB,
    "expiresAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "TrendingSite_url_key" ON "TrendingSite"("url");

-- CreateIndex
CREATE UNIQUE INDEX "UrlCache_host_key" ON "UrlCache"("host");
