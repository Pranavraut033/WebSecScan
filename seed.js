import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

async function seed() {
  const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' })
  const prisma = new PrismaClient({ adapter })

  await prisma.scanResult.createMany({
    data: [
      { url: 'https://example.com', host: 'example.com', status: 'safe' },
      { url: 'https://vulnerable-site.com', host: 'vulnerable-site.com', status: 'vulnerable', vulnerabilities: [{ type: 'SQL Injection', severity: 'high' }] }
    ]
  })
  console.log('Sample data added')
  await prisma.$disconnect()
}

seed().catch(console.error)