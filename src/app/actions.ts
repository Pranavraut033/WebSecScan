'use server'

import { prisma } from '@/lib/db'
import { ScanMode, ScanStatus, Vulnerability } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { ScanLogger } from '@/lib/scanLogger'

// Import modular security analyzers
import { analyzeJavaScript } from '@/security/static/jsAnalyzer'
import { analyzeHTML } from '@/security/static/htmlAnalyzer'
import { analyzeDependenciesFromUrl } from '@/security/static/dependencyAnalyzer'
import { crawlWebsite, CrawlerOptions } from '@/security/dynamic/crawler'
import { testXss, testFormXss } from '@/security/dynamic/xssTester'
import { performAuthChecks, checkAuthWeaknesses } from '@/security/dynamic/authChecks'
import { analyzeHeaders, type HeaderTestResult } from '@/security/dynamic/headerAnalyzer'
import { analyzeCookies } from '@/security/dynamic/cookieAnalyzer'
import { analyzeCSP } from '@/security/dynamic/cspAnalyzer'
import { calculateScore } from '@/lib/scoring'
import type { NormalizeUrlResult } from '@/lib/urlNormalizer'
import type { AuthConfig } from '@/security/dynamic/authScanner'
import { performAuthenticatedScan } from '@/security/dynamic/authScanner'

// Global store for crawler options (temporary, per-scan)
// In production, this would be stored in Redis or the database
declare global {
  var scanCrawlerOptions: Record<string, Required<CrawlerOptions>> | undefined;
  var scanAuthConfig: Record<string, AuthConfig> | undefined;
}

/**
 * Deduplicate vulnerabilities by grouping same ruleId/type together
 * and merging their locations into a single finding
 */
function deduplicateVulnerabilities(vulnerabilities: any[]): any[] {
  const grouped = new Map<string, any>()

  for (const vuln of vulnerabilities) {
    // Use ruleId as primary key, fallback to type
    const key = vuln.ruleId || vuln.type

    if (grouped.has(key)) {
      const existing = grouped.get(key)!
      // Append location with newline separator
      existing.location = `${existing.location}

${vuln.location}`
      // Increment occurrence count if not already tracked
      existing.occurrences = (existing.occurrences || 1) + 1
    } else {
      grouped.set(key, { ...vuln, occurrences: 1 })
    }
  }

  return Array.from(grouped.values())
}

// Server Actions as per specs

export async function createScan(
  targetUrl: string,
  mode: ScanMode,
  crawlerOptions?: Required<CrawlerOptions>,
  authConfig?: AuthConfig
): Promise<{ scanId: string }> {
  try {
    // Extract hostname from URL
    const url = new URL(targetUrl)
    const hostname = url.hostname

    const scan = await prisma.scan.create({
      data: {
        targetUrl,
        hostname,
        mode,
        status: ScanStatus.PENDING,
      },
    })

    // Store crawler options in scan metadata if provided
    if (crawlerOptions) {
      // Options will be retrieved when running dynamic analysis
      global.scanCrawlerOptions = global.scanCrawlerOptions || {};
      global.scanCrawlerOptions[scan.id] = crawlerOptions;
    }

    // Store auth config if provided (never persist to database)
    if (authConfig) {
      global.scanAuthConfig = global.scanAuthConfig || {};
      global.scanAuthConfig[scan.id] = authConfig;
    }

    revalidatePath('/')
    return { scanId: scan.id }
  } catch (error) {
    console.error('Error creating scan:', error)
    throw new Error('Failed to create scan')
  }
}

export async function getRecentScans() {
  try {
    const scans = await prisma.scan.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        results: true,
        securityTests: true,
      },
    })
    return scans
  } catch (error) {
    console.error('Error fetching recent scans:', error)
    throw new Error('Failed to fetch recent scans')
  }
}

export async function getScanHistory(hostname: string) {
  try {
    const scans = await prisma.scan.findMany({
      where: { hostname },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        results: {
          select: {
            id: true,
            severity: true,
          },
        },
        _count: {
          select: {
            results: true,
            securityTests: true,
          },
        },
      },
    })
    return scans
  } catch (error) {
    console.error('Error fetching scan history:', error)
    throw new Error('Failed to fetch scan history')
  }
}

export async function recordProtocolVulnerability(
  scanId: string,
  threat: NormalizeUrlResult['securityThreats'][0]
): Promise<void> {
  try {
    // Map to OWASP category
    let owaspCategory = 'A02:2025-Security Misconfiguration'
    let owaspId = 'A02:2025'
    if (threat.type === 'INSECURE_PROTOCOL') {
      owaspCategory = 'A04:2025-Cryptographic Failures'
      owaspId = 'A04:2025'
    }

    await prisma.vulnerability.create({
      data: {
        scanId,
        type: 'Insecure HTTP Protocol',
        description: threat.message,
        severity: threat.severity,
        owaspCategory,
        owaspId,
        confidence: 'HIGH',
        location: 'Protocol: HTTP (plaintext)',
        remediation: 'Enable HTTPS by obtaining an SSL/TLS certificate from a trusted Certificate Authority. Configure your web server to redirect all HTTP traffic to HTTPS. Use HSTS (HTTP Strict Transport Security) headers to enforce HTTPS.',
        ruleId: 'WSS-PROTOCOL-001',
      },
    })
  } catch (error) {
    console.error('Error recording protocol vulnerability:', error)
  }
}

export async function runStaticAnalysis(scanId: string): Promise<void> {
  try {
    // Update scan status to RUNNING
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: ScanStatus.RUNNING },
    })

    ScanLogger.info(scanId, 'Starting static analysis...', 'STATIC')

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
    })
    if (!scan) throw new Error('Scan not found')

    ScanLogger.info(scanId, `Fetching page content from ${scan.targetUrl}`, 'STATIC')

    // Fetch the page HTML and inline scripts
    const response = await fetch(scan.targetUrl, {
      headers: { 'User-Agent': 'WebSecScan/1.0 (Educational Security Scanner)' }
    })
    const html = await response.text()

    // Use any[] to allow flexibility with vulnerability object structure
    const allVulnerabilities: any[] = []

    // 1. Analyze HTML for security issues
    ScanLogger.info(scanId, 'Analyzing HTML content...', 'STATIC')
    const htmlAnalysis = await analyzeHTML(html, scan.targetUrl)
    allVulnerabilities.push(...htmlAnalysis.vulnerabilities)
    ScanLogger.success(scanId, `Found ${htmlAnalysis.vulnerabilities.length} HTML issues`, 'STATIC')

    // 2. Analyze JavaScript code from inline scripts and script tags
    ScanLogger.info(scanId, 'Analyzing JavaScript code...', 'STATIC')
    // Extract inline scripts
    const scriptMatches = html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)
    let scriptCount = 0
    for (const match of scriptMatches) {
      const scriptContent = match[1]
      if (scriptContent.trim()) {
        scriptCount++
        const jsAnalysis = await analyzeJavaScript(scriptContent, `${scan.targetUrl} (inline script)`)
        allVulnerabilities.push(...jsAnalysis.vulnerabilities)
      }
    }

    // Extract external script URLs and fetch them for analysis
    const externalScriptMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)
    const scriptUrls = Array.from(externalScriptMatches).map(m => m[1])

    ScanLogger.info(scanId, `Analyzing ${scriptUrls.length} external scripts...`, 'STATIC')
    for (const scriptUrl of scriptUrls.slice(0, 5)) { // Limit to 5 scripts to avoid excessive requests
      try {
        const absoluteUrl = new URL(scriptUrl, scan.targetUrl).toString()
        const scriptResponse = await fetch(absoluteUrl, {
          headers: { 'User-Agent': 'WebSecScan/1.0' },
          signal: AbortSignal.timeout(5000)
        })

        if (scriptResponse.ok) {
          const scriptCode = await scriptResponse.text()
          const jsAnalysis = await analyzeJavaScript(scriptCode, absoluteUrl)
          allVulnerabilities.push(...jsAnalysis.vulnerabilities)
        }
      } catch {
        // Skip failed script fetches
        continue
      }
    }

    // 3. Analyze dependencies (check for package.json)
    ScanLogger.info(scanId, 'Checking dependencies...', 'STATIC')
    const depAnalysis = await analyzeDependenciesFromUrl(scan.targetUrl)
    allVulnerabilities.push(...depAnalysis.vulnerabilities)

    // Deduplicate vulnerabilities: merge same type/ruleId with multiple locations
    const deduplicatedVulns = deduplicateVulnerabilities(allVulnerabilities)

    ScanLogger.info(scanId, `Saving ${deduplicatedVulns.length} vulnerabilities...`, 'STATIC')

    // Create vulnerability records in database
    for (const vuln of deduplicatedVulns) {
      await prisma.vulnerability.create({
        data: {
          type: vuln.type,
          severity: vuln.severity as any, // Cast from string to enum
          confidence: vuln.confidence as any, // Cast from string to enum
          description: vuln.description,
          location: vuln.location,
          remediation: vuln.remediation,
          owaspCategory: vuln.owaspCategory || null,
          owaspId: vuln.owaspId || null,
          ruleId: vuln.ruleId || null,
          scanId,
        },
      })
    }

    // Update scan status to COMPLETED
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: ScanStatus.COMPLETED },
    })

    ScanLogger.success(scanId, 'Static analysis completed successfully', 'STATIC')

    revalidatePath('/')
  } catch (error) {
    console.error('Error in static analysis:', error)
    ScanLogger.error(scanId, 'Static analysis failed', 'STATIC')
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: ScanStatus.FAILED },
    })
    throw error
  }
}

export async function runDynamicAnalysis(scanId: string): Promise<void> {
  try {
    // Update scan status to RUNNING
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: ScanStatus.RUNNING },
    })

    ScanLogger.info(scanId, 'Starting dynamic analysis...', 'DYNAMIC')

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
    })
    if (!scan) throw new Error('Scan not found')

    // Use any[] to allow flexibility with vulnerability object structure
    const allVulnerabilities: any[] = []
    const securityTests: HeaderTestResult[] = []

    // 0. Fetch and analyze HTTP headers first
    ScanLogger.info(scanId, `Fetching headers from ${scan.targetUrl}...`, 'DYNAMIC')
    const response = await fetch(scan.targetUrl, {
      headers: { 'User-Agent': 'WebSecScan/1.0 (Educational Security Scanner)' },
      redirect: 'manual' // Don't follow redirects to see original headers
    })

    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Fetch HTML content for cross-origin script analysis
    let htmlContent: string | undefined;
    try {
      const htmlResponse = await fetch(scan.targetUrl, {
        headers: { 'User-Agent': 'WebSecScan/1.0 (Educational Security Scanner)' }
      });
      htmlContent = await htmlResponse.text();
    } catch (error) {
      ScanLogger.warning(scanId, 'Could not fetch HTML content for analysis', 'DYNAMIC');
    }

    // Analyze security headers (with HTML for cross-origin script detection)
    ScanLogger.info(scanId, 'Analyzing security headers...', 'DYNAMIC')
    const headerTests = await analyzeHeaders(scan.targetUrl, headers, htmlContent)
    securityTests.push(...headerTests)

    // Analyze CSP separately for detailed checks
    const cspHeader = headers['content-security-policy']
    const cspTest = analyzeCSP(cspHeader)
    securityTests.push(cspTest)

    // Analyze cookies
    const setCookieHeader = response.headers.get('set-cookie')
    const setCookieHeaders = setCookieHeader ? [setCookieHeader] : []
    const cookieTest = analyzeCookies(scan.targetUrl, setCookieHeaders)
    securityTests.push(cookieTest)

    // Calculate overall score
    const scoringResult = calculateScore(securityTests)

    // 1. Crawl the website to discover endpoints and forms
    ScanLogger.info(scanId, `Starting crawl of ${scan.targetUrl}...`, 'DYNAMIC')

    // Retrieve crawler options if configured, otherwise use defaults
    const crawlerOptions = (global.scanCrawlerOptions && global.scanCrawlerOptions[scanId]) || {
      maxDepth: 2,
      maxPages: 20,
      rateLimit: 1000,
      respectRobotsTxt: true,
      allowExternalLinks: false,
      timeout: 10000
    };

    // Check for authenticated scan configuration
    const authConfig = global.scanAuthConfig && global.scanAuthConfig[scanId];

    // Perform authenticated scan if config provided
    if (authConfig) {
      ScanLogger.info(scanId, 'Performing authenticated scan with Playwright...', 'DYNAMIC')

      try {
        const authScanResult = await performAuthenticatedScan(authConfig);

        if (authScanResult.authResult.success) {
          ScanLogger.success(
            scanId,
            `Authentication successful. Found ${authScanResult.authResult.cookies.length} cookies`,
            'DYNAMIC'
          );

          // Add auth warnings as vulnerabilities
          if (authScanResult.authResult.warnings && authScanResult.authResult.warnings.length > 0) {
            ScanLogger.warning(
              scanId,
              `Auth warnings: ${authScanResult.authResult.warnings.join(', ')}`,
              'DYNAMIC'
            );
          }

          // Add session vulnerabilities to results
          allVulnerabilities.push(...authScanResult.scanResult.vulnerabilities);

          // Use session credentials for crawling (cast to avoid type issues with optional property)
          (crawlerOptions as CrawlerOptions).sessionCredentials = {
            headers: authScanResult.authResult.sessionHeaders,
            cookies: authScanResult.authResult.cookies.map(c => ({
              name: c.name,
              value: c.value
            }))
          };

          ScanLogger.info(
            scanId,
            `Crawling with authenticated session (${authScanResult.scanResult.sessionAnalysis.cookieCount} cookies)`,
            'DYNAMIC'
          );
        } else {
          ScanLogger.error(
            scanId,
            `Authentication failed: ${authScanResult.authResult.error}`,
            'DYNAMIC'
          );
          // Continue with unauthenticated scan
        }

        // Clean up auth config from memory (security: never persist credentials)
        if (global.scanAuthConfig) {
          delete global.scanAuthConfig[scanId];
        }
      } catch (authError) {
        ScanLogger.error(
          scanId,
          `Authentication error: ${authError instanceof Error ? authError.message : String(authError)}`,
          'DYNAMIC'
        );
        // Continue with unauthenticated scan
      }
    }

    const crawlResult = await crawlWebsite(scan.targetUrl, crawlerOptions)

    ScanLogger.success(
      scanId,
      `Crawl completed. Found ${crawlResult.urls.length} URLs, ${crawlResult.endpoints.length} endpoints, ${crawlResult.forms.length} forms`,
      'DYNAMIC'
    )

    // 2. Perform authentication and security header checks
    ScanLogger.info(scanId, 'Performing auth and security header checks...', 'DYNAMIC')
    const authCheckResult = await performAuthChecks(scan.targetUrl)
    allVulnerabilities.push(...authCheckResult.vulnerabilities)

    // 3. Check for authentication weaknesses
    const authWeaknesses = await checkAuthWeaknesses(scan.targetUrl)
    allVulnerabilities.push(...authWeaknesses)

    // 4. Test for XSS vulnerabilities on discovered endpoints
    ScanLogger.info(scanId, 'Testing for XSS vulnerabilities...', 'DYNAMIC')
    const xssResult = await testXss(scan.targetUrl, crawlResult.endpoints)
    allVulnerabilities.push(...xssResult.vulnerabilities)

    // 5. Test forms for XSS
    if (crawlResult.forms.length > 0) {
      ScanLogger.info(scanId, `Testing ${crawlResult.forms.length} forms for XSS...`, 'DYNAMIC')
      const formXssResult = await testFormXss(crawlResult.forms)
      allVulnerabilities.push(...formXssResult.vulnerabilities)
    }

    // Deduplicate vulnerabilities: merge same type/ruleId with multiple locations
    const deduplicatedVulns = deduplicateVulnerabilities(allVulnerabilities)

    // Create vulnerability records in database
    ScanLogger.info(
      scanId,
      `Found ${allVulnerabilities.length} vulnerabilities (${deduplicatedVulns.length} after deduplication)`,
      'DYNAMIC'
    )
    for (const vuln of deduplicatedVulns) {
      await prisma.vulnerability.create({
        data: {
          type: vuln.type,
          severity: vuln.severity as any, // Cast from string to enum
          confidence: vuln.confidence as any, // Cast from string to enum
          description: vuln.description,
          location: vuln.location,
          remediation: vuln.remediation,
          owaspCategory: vuln.owaspCategory || null,
          owaspId: vuln.owaspId || null,
          ruleId: vuln.ruleId || null,
          scanId,
        },
      })
    }

    // Save security test results
    ScanLogger.info(scanId, `Saving ${securityTests.length} security test results...`, 'DYNAMIC')
    for (const test of securityTests) {
      await prisma.securityTest.create({
        data: {
          scanId,
          testName: test.testName,
          passed: test.passed,
          score: test.score,
          result: test.result,
          reason: test.reason,
          recommendation: test.recommendation || null,
          details: test.details ? (test.details as any) : undefined,
        },
      })
    }

    // Update scan status to COMPLETED with score and grade
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: ScanStatus.COMPLETED,
        score: scoringResult.score,
        grade: scoringResult.grade,
        completedAt: new Date(),
        scanSummary: {
          totalTests: securityTests.length,
          passedTests: securityTests.filter(t => t.passed).length,
          failedTests: securityTests.filter(t => !t.passed).length,
          vulnerabilityCount: allVulnerabilities.length,
          rawHeaders: headers,
          setCookieHeaders,
          csp: cspHeader || null,
        }
      },
    })

    ScanLogger.success(scanId, `Dynamic analysis completed. Score: ${scoringResult.score}/100 (Grade: ${scoringResult.grade})`, 'DYNAMIC')

    revalidatePath('/')
  } catch (error) {
    console.error('Error in dynamic analysis:', error)
    ScanLogger.error(scanId, 'Dynamic analysis failed', 'DYNAMIC')
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: ScanStatus.FAILED },
    })
    throw error
  }
}

export async function generateReport(scanId: string): Promise<{ report: string }> {
  try {
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: { results: true },
    })

    if (!scan) throw new Error('Scan not found')

    // Generate a simple text report
    let report = `Security Scan Report\n`
    report += `==================\n\n`
    report += `Scan ID: ${scan.id}\n`
    report += `Target URL: ${scan.targetUrl}\n`
    report += `Mode: ${scan.mode}\n`
    report += `Status: ${scan.status}\n`
    report += `Created At: ${scan.createdAt.toISOString()}\n\n`

    report += `Summary:\n`
    const critical = scan.results.filter(v => v.severity === 'CRITICAL').length
    const high = scan.results.filter(v => v.severity === 'HIGH').length
    const medium = scan.results.filter(v => v.severity === 'MEDIUM').length
    const low = scan.results.filter(v => v.severity === 'LOW').length
    report += `- Critical: ${critical}\n`
    report += `- High: ${high}\n`
    report += `- Medium: ${medium}\n`
    report += `- Low: ${low}\n\n`

    if (scan.results.length > 0) {
      report += `Vulnerabilities:\n`
      scan.results.forEach((vuln, index) => {
        report += `${index + 1}. ${vuln.type}\n`
        report += `   Severity: ${vuln.severity}\n`
        report += `   Confidence: ${vuln.confidence}\n`
        report += `   Description: ${vuln.description}\n`
        report += `   Location: ${vuln.location}\n`
        report += `   Remediation: ${vuln.remediation}\n\n`
      })
    } else {
      report += `No vulnerabilities found.\n`
    }

    return { report }
  } catch (error) {
    console.error('Error generating report:', error)
    throw new Error('Failed to generate report')
  }
}