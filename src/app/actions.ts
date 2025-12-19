'use server'

import { prisma } from '@/lib/db'
import { Prisma, ScanResult, TrendingSite } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getRecentScans(): Promise<ScanResult[]> {
  try {
    const recentScans = await prisma.scanResult.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10,
    })
    return recentScans
  } catch (error) {
    console.error('Error fetching recent scans:', error)
    throw new Error('Failed to fetch recent scans')
  }
}

export async function getTrendingSites(): Promise<TrendingSite[]> {
  try {
    let trendingSites = await prisma.trendingSite.findMany({
      orderBy: { rank: 'asc' },
      take: 10,
    })

    // If no trending sites, add some defaults
    if (trendingSites.length === 0) {
      await prisma.trendingSite.createMany({
        data: [
          { url: 'https://google.com', name: 'Google', rank: 1 },
          { url: 'https://github.com', name: 'GitHub', rank: 2 },
          { url: 'https://stackoverflow.com', name: 'Stack Overflow', rank: 3 },
          { url: 'https://youtube.com', name: 'YouTube', rank: 4 },
          { url: 'https://facebook.com', name: 'Facebook', rank: 5 },
        ],
      })
      trendingSites = await prisma.trendingSite.findMany({
        orderBy: { rank: 'asc' },
        take: 10,
      })
    }

    return trendingSites
  } catch (error) {
    console.error('Error fetching trending sites:', error)
    throw new Error('Failed to fetch trending sites')
  }
}

interface CacheResult {
  cached: boolean
  result?: Prisma.JsonValue
  lastScan?: Date
}

export async function checkCache(host: string): Promise<CacheResult> {
  try {
    const cached = await prisma.urlCache.findUnique({
      where: { host },
    })

    if (cached && cached.expiresAt && cached.expiresAt > new Date()) {
      return {
        cached: true,
        result: cached.cachedResult,
        lastScan: cached.lastScan || undefined,
      }
    }

    return { cached: false }
  } catch (error) {
    console.error('Error checking cache:', error)
    throw new Error('Failed to check cache')
  }
}

export async function setCache(host: string, result: Prisma.InputJsonValue): Promise<{ success: boolean }> {
  try {
    // Cache for 24 hours
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await prisma.urlCache.upsert({
      where: { host },
      update: {
        cachedResult: result,
        lastScan: new Date(),
        expiresAt,
      },
      create: {
        host,
        cachedResult: result,
        lastScan: new Date(),
        expiresAt,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error caching result:', error)
    throw new Error('Failed to cache result')
  }
}

export async function createScanResult(data: Prisma.ScanResultCreateInput): Promise<ScanResult> {
  try {
    const scanResult = await prisma.scanResult.create({
      data: data,
    })
    revalidatePath('/')
    return scanResult
  } catch (error) {
    console.error('Error creating scan result:', error)
    throw new Error('Failed to create scan result')
  }
}

// Mock vulnerability database
const VULNERABILITIES = [
  // OWASP Top 10
  {
    id: 'broken-access-control',
    name: 'Broken Access Control',
    severity: 'high' as const,
    description: 'The application fails to properly enforce access controls, allowing users to access resources they should not have access to.',
    owaspTop10: true,
    owaspCategory: 'A01:2021 - Broken Access Control',
    owaspLink: 'https://owasp.org/Top10/A01_2021-Broken_Access_Control/',
  },
  {
    id: 'cryptographic-failures',
    name: 'Cryptographic Failures',
    severity: 'high' as const,
    description: 'The application uses weak or improper cryptographic functions, potentially exposing sensitive data.',
    owaspTop10: true,
    owaspCategory: 'A02:2021 - Cryptographic Failures',
    owaspLink: 'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
  },
  {
    id: 'injection',
    name: 'Injection',
    severity: 'critical' as const,
    description: 'The application is vulnerable to injection attacks such as SQL injection, NoSQL injection, or command injection.',
    owaspTop10: true,
    owaspCategory: 'A03:2021 - Injection',
    owaspLink: 'https://owasp.org/Top10/A03_2021-Injection/',
  },
  {
    id: 'insecure-design',
    name: 'Insecure Design',
    severity: 'medium' as const,
    description: 'The application has design flaws that can lead to security vulnerabilities.',
    owaspTop10: true,
    owaspCategory: 'A04:2021 - Insecure Design',
    owaspLink: 'https://owasp.org/Top10/A04_2021-Insecure_Design/',
  },
  {
    id: 'security-misconfiguration',
    name: 'Security Misconfiguration',
    severity: 'medium' as const,
    description: 'The application or its infrastructure has insecure default configurations.',
    owaspTop10: true,
    owaspCategory: 'A05:2021 - Security Misconfiguration',
    owaspLink: 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/',
  },
  {
    id: 'vulnerable-components',
    name: 'Vulnerable and Outdated Components',
    severity: 'medium' as const,
    description: 'The application uses components with known vulnerabilities.',
    owaspTop10: true,
    owaspCategory: 'A06:2021 - Vulnerable and Outdated Components',
    owaspLink: 'https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/',
  },
  {
    id: 'identification-authentication-failures',
    name: 'Identification and Authentication Failures',
    severity: 'medium' as const,
    description: 'Authentication mechanisms are improperly implemented.',
    owaspTop10: true,
    owaspCategory: 'A07:2021 - Identification and Authentication Failures',
    owaspLink: 'https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/',
  },
  {
    id: 'software-data-integrity-failures',
    name: 'Software and Data Integrity Failures',
    severity: 'high' as const,
    description: 'The application does not verify the integrity of software or data.',
    owaspTop10: true,
    owaspCategory: 'A08:2021 - Software and Data Integrity Failures',
    owaspLink: 'https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/',
  },
  {
    id: 'security-logging-monitoring-failures',
    name: 'Security Logging and Monitoring Failures',
    severity: 'low' as const,
    description: 'The application does not properly log security events or monitor for suspicious activity.',
    owaspTop10: true,
    owaspCategory: 'A09:2021 - Security Logging and Monitoring Failures',
    owaspLink: 'https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/',
  },
  {
    id: 'ssrf',
    name: 'Server-Side Request Forgery (SSRF)',
    severity: 'high' as const,
    description: 'The application can be tricked into making requests to internal resources.',
    owaspTop10: true,
    owaspCategory: 'A10:2021 - Server-Side Request Forgery',
    owaspLink: 'https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery_(SSRF)/',
  },
  // Other common vulnerabilities
  {
    id: 'xss',
    name: 'Cross-Site Scripting (XSS)',
    severity: 'high' as const,
    description: 'The application does not properly sanitize user input, allowing malicious scripts to be executed.',
    owaspTop10: false,
  },
  {
    id: 'csrf',
    name: 'Cross-Site Request Forgery (CSRF)',
    severity: 'medium' as const,
    description: 'The application does not protect against CSRF attacks.',
    owaspTop10: false,
  },
  {
    id: 'clickjacking',
    name: 'Clickjacking',
    severity: 'medium' as const,
    description: 'The application is vulnerable to clickjacking attacks due to missing X-Frame-Options header.',
    owaspTop10: false,
  },
  {
    id: 'insecure-cookies',
    name: 'Insecure Cookies',
    severity: 'medium' as const,
    description: 'Cookies are not properly secured with appropriate flags.',
    owaspTop10: false,
  },
  {
    id: 'missing-https',
    name: 'Missing HTTPS',
    severity: 'high' as const,
    description: 'The application does not enforce HTTPS connections.',
    owaspTop10: false,
  },
  {
    id: 'exposed-sensitive-info',
    name: 'Information Disclosure',
    severity: 'medium' as const,
    description: 'Sensitive information is exposed in error messages or responses.',
    owaspTop10: false,
  },
]

export async function scanWebsite(url: string): Promise<Prisma.ScanResultCreateInput> {
  const startTime = Date.now()

  try {
    // Validate URL
    const urlObj = new URL(url)
    const host = urlObj.host

    // Check cache first
    const cacheResult = await checkCache(host)
    if (cacheResult.cached) {
      return cacheResult.result as Prisma.ScanResultCreateInput
    }

    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock scanning logic - randomly select some vulnerabilities
    const foundVulnerabilities: typeof VULNERABILITIES = []
    const numVulnerabilities = Math.floor(Math.random() * 5) + 1 // 1-5 vulnerabilities

    for (let i = 0; i < numVulnerabilities; i++) {
      const randomIndex = Math.floor(Math.random() * VULNERABILITIES.length)
      const vuln = VULNERABILITIES[randomIndex]
      if (!foundVulnerabilities.find(v => v.id === vuln.id)) {
        foundVulnerabilities.push({
          ...vuln,
          id: `${vuln.id}-${Date.now()}-${i}`, // Make IDs unique
        })
      }
    }

    const scanDuration = Date.now() - startTime
    const status = foundVulnerabilities.length > 0 ? 'vulnerable' : 'safe'

    const result: Prisma.ScanResultCreateInput = {
      url,
      host,
      status,
      vulnerabilities: foundVulnerabilities,
      scanDuration,
    }

    // Cache the result
    await setCache(host, result as Prisma.InputJsonValue)

    // Save to database
    await createScanResult(result)

    return result
  } catch (error) {
    console.error('Error scanning website:', error)
    const scanDuration = Date.now() - startTime
    const result: Prisma.ScanResultCreateInput = {
      url,
      host: 'unknown',
      status: 'error',
      vulnerabilities: [],
      scanDuration,
    }
    await createScanResult(result)
    throw new Error('Failed to scan website')
  }
}