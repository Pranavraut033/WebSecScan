import { prisma } from '../src/lib/db'

async function main() {
  // Add sample scan results
  await prisma.scanResult.createMany({
    data: [
      {
        url: 'https://example.com',
        host: 'example.com',
        status: 'safe',
        vulnerabilities: [],
      },
      {
        url: 'https://vulnerable-site.com',
        host: 'vulnerable-site.com',
        status: 'vulnerable',
        vulnerabilities: [
          { type: 'SQL Injection', severity: 'high' },
          { type: 'XSS', severity: 'medium' },
        ],
      },
    ],
  })

  // Add trending sites
  await prisma.trendingSite.createMany({
    data: [
      { url: 'https://google.com', name: 'Google', rank: 1 },
      { url: 'https://github.com', name: 'GitHub', rank: 2 },
      { url: 'https://stackoverflow.com', name: 'Stack Overflow', rank: 3 },
    ],
  })

  console.log('Database seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })