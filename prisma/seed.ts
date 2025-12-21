import { prisma } from '../src/lib/db'
import { ScanMode, ScanStatus, Severity, Confidence } from '@prisma/client'

async function main() {
  // Clear existing data
  await prisma.vulnerability.deleteMany({})
  await prisma.scan.deleteMany({})

  // Add sample scans
  const scan1 = await prisma.scan.create({
    data: {
      targetUrl: 'https://example.com',
      hostname: 'example.com',
      mode: ScanMode.STATIC,
      status: ScanStatus.COMPLETED,
    },
  })

  const scan2 = await prisma.scan.create({
    data: {
      targetUrl: 'https://vulnerable-site.com',
      hostname: 'vulnerable-site.com',
      mode: ScanMode.BOTH,
      status: ScanStatus.COMPLETED,
    },
  })

  // Add vulnerabilities for scan2
  await prisma.vulnerability.createMany({
    data: [
      {
        scanId: scan2.id,
        type: 'SQL Injection',
        severity: Severity.HIGH,
        confidence: Confidence.MEDIUM,
        description: 'Potential SQL injection vulnerability detected.',
        location: 'https://vulnerable-site.com/login',
        remediation: 'Use parameterized queries or prepared statements.',
      },
      {
        scanId: scan2.id,
        type: 'XSS',
        severity: Severity.MEDIUM,
        confidence: Confidence.HIGH,
        description: 'Cross-site scripting vulnerability found.',
        location: 'https://vulnerable-site.com/search',
        remediation: 'Sanitize user input and use Content Security Policy.',
      },
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