/*
  Warnings:

  - Added the required column `hostname` to the `Scan` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Scan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetUrl" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Extract hostname from existing targetUrl values
INSERT INTO "new_Scan" ("id", "targetUrl", "hostname", "mode", "status", "createdAt") 
SELECT 
    "id", 
    "targetUrl", 
    CASE 
        WHEN instr("targetUrl", '://') > 0 THEN
            CASE 
                WHEN instr(substr("targetUrl", instr("targetUrl", '://') + 3), '/') > 0 
                THEN substr(substr("targetUrl", instr("targetUrl", '://') + 3), 1, instr(substr("targetUrl", instr("targetUrl", '://') + 3), '/') - 1)
                ELSE substr("targetUrl", instr("targetUrl", '://') + 3)
            END
        ELSE "targetUrl"
    END as "hostname",
    "mode", 
    "status", 
    "createdAt" 
FROM "Scan";
DROP TABLE "Scan";
ALTER TABLE "new_Scan" RENAME TO "Scan";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
