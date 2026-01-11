import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const scanId = process.argv[2];

  if (!scanId) {
    console.error('Usage: tsx scripts/get-vulns.ts <scanId>');
    process.exit(1);
  }

  const vulnerabilities = await prisma.vulnerability.findMany({
    where: { scanId },
    select: {
      id: true,
      type: true,
      description: true,
      severity: true,
      confidence: true,
      location: true,
      remediation: true,
      owaspCategory: true,
      owaspId: true,
      ruleId: true,
    },
  });

  console.log(JSON.stringify(vulnerabilities, null, 2));
  await prisma.$disconnect();
}

main();
