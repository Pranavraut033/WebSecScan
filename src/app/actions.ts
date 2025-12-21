'use server'

import { prisma } from '@/lib/db'
import { ScanMode, ScanStatus, Vulnerability } from '@prisma/client'
import { revalidatePath } from 'next/cache'

// Import modular security analyzers
import { analyzeJavaScript } from '@/security/static/jsAnalyzer'
import { analyzeHTML } from '@/security/static/htmlAnalyzer'
import { analyzeDependenciesFromUrl } from '@/security/static/dependencyAnalyzer'
import { crawlWebsite } from '@/security/dynamic/crawler'
import { testXss, testFormXss } from '@/security/dynamic/xssTester'
import { performAuthChecks, checkAuthWeaknesses } from '@/security/dynamic/authChecks'

// Server Actions as per specs

export async function createScan(targetUrl: string, mode: ScanMode): Promise<{ scanId: string }> {
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
      },
    })
    return scans
  } catch (error) {
    console.error('Error fetching recent scans:', error)
    throw new Error('Failed to fetch recent scans')
  }
}

export async function runStaticAnalysis(scanId: string): Promise<void> {
  try {
    // Update scan status to RUNNING
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: ScanStatus.RUNNING },
    })

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
    })
    if (!scan) throw new Error('Scan not found')

    // Fetch the page HTML and inline scripts
    const response = await fetch(scan.targetUrl, {
      headers: { 'User-Agent': 'WebSecScan/1.0 (Educational Security Scanner)' }
    })
    const html = await response.text()

    // Use any[] to allow flexibility with vulnerability object structure
    const allVulnerabilities: any[] = []

    // 1. Analyze HTML for security issues
    const htmlAnalysis = await analyzeHTML(html, scan.targetUrl)
    allVulnerabilities.push(...htmlAnalysis.vulnerabilities)

    // 2. Analyze JavaScript code from inline scripts and script tags
    // Extract inline scripts
    const scriptMatches = html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)
    for (const match of scriptMatches) {
      const scriptContent = match[1]
      if (scriptContent.trim()) {
        const jsAnalysis = await analyzeJavaScript(scriptContent, `${scan.targetUrl} (inline script)`)
        allVulnerabilities.push(...jsAnalysis.vulnerabilities)
      }
    }

    // Extract external script URLs and fetch them for analysis
    const externalScriptMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)
    const scriptUrls = Array.from(externalScriptMatches).map(m => m[1])

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
    const depAnalysis = await analyzeDependenciesFromUrl(scan.targetUrl)
    allVulnerabilities.push(...depAnalysis.vulnerabilities)

    // Create vulnerability records in database
    for (const vuln of allVulnerabilities) {
      await prisma.vulnerability.create({
        data: {
          type: vuln.type,
          severity: vuln.severity as any, // Cast from string to enum
          confidence: vuln.confidence as any, // Cast from string to enum
          description: vuln.description,
          location: vuln.location,
          remediation: vuln.remediation,
          scanId,
        },
      })
    }

    // Update scan status to COMPLETED
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: ScanStatus.COMPLETED },
    })

    revalidatePath('/')
  } catch (error) {
    console.error('Error in static analysis:', error)
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

    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
    })
    if (!scan) throw new Error('Scan not found')

    // Use any[] to allow flexibility with vulnerability object structure
    const allVulnerabilities: any[] = []

    // 1. Crawl the website to discover endpoints and forms
    console.log(`Starting crawl of ${scan.targetUrl}...`)
    const crawlResult = await crawlWebsite(scan.targetUrl, {
      maxDepth: 2,
      maxPages: 20,
      rateLimit: 1000,
      respectRobotsTxt: true
    })

    console.log(`Crawl completed. Found ${crawlResult.urls.length} URLs, ${crawlResult.endpoints.length} endpoints, ${crawlResult.forms.length} forms`)

    // 2. Perform authentication and security header checks
    console.log('Performing auth and security header checks...')
    const authCheckResult = await performAuthChecks(scan.targetUrl)
    allVulnerabilities.push(...authCheckResult.vulnerabilities)

    // 3. Check for authentication weaknesses
    const authWeaknesses = await checkAuthWeaknesses(scan.targetUrl)
    allVulnerabilities.push(...authWeaknesses)

    // 4. Test for XSS vulnerabilities on discovered endpoints
    console.log('Testing for XSS vulnerabilities...')
    const xssResult = await testXss(scan.targetUrl, crawlResult.endpoints)
    allVulnerabilities.push(...xssResult.vulnerabilities)

    // 5. Test forms for XSS
    if (crawlResult.forms.length > 0) {
      console.log(`Testing ${crawlResult.forms.length} forms for XSS...`)
      const formXssResult = await testFormXss(crawlResult.forms)
      allVulnerabilities.push(...formXssResult.vulnerabilities)
    }

    // Create vulnerability records in database
    console.log(`Found ${allVulnerabilities.length} vulnerabilities, saving to database...`)
    for (const vuln of allVulnerabilities) {
      await prisma.vulnerability.create({
        data: {
          type: vuln.type,
          severity: vuln.severity as any, // Cast from string to enum
          confidence: vuln.confidence as any, // Cast from string to enum
          description: vuln.description,
          location: vuln.location,
          remediation: vuln.remediation,
          scanId,
        },
      })
    }

    // Update scan status to COMPLETED
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: ScanStatus.COMPLETED },
    })

    revalidatePath('/')
  } catch (error) {
    console.error('Error in dynamic analysis:', error)
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