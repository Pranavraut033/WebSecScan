-- AlterTable
ALTER TABLE "Scan" ADD COLUMN "completedAt" DATETIME;
ALTER TABLE "Scan" ADD COLUMN "grade" TEXT;
ALTER TABLE "Scan" ADD COLUMN "scanSummary" JSONB;
ALTER TABLE "Scan" ADD COLUMN "score" INTEGER;

-- CreateTable
CREATE TABLE "SecurityTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "score" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "reason" TEXT,
    "recommendation" TEXT,
    "details" JSONB,
    CONSTRAINT "SecurityTest_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
