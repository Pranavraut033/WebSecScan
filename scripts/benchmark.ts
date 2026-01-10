#!/usr/bin/env tsx
/**
 * WebSecScan Benchmarking Harness
 * 
 * This script runs WebSecScan against test targets and collects comprehensive metrics
 * for evaluation and comparison with OWASP ZAP.
 * 
 * Usage:
 *   npm run benchmark -- --target http://localhost:3001 --mode BOTH
 *   npm run benchmark -- --target http://localhost:3001 --mode STATIC --output results.json
 */

import { ScanMode } from '@prisma/client';
import { prisma } from '../src/lib/db.js';
import { calculateScore } from '../src/lib/scoring.js';
import { ScanLogger } from '../src/lib/scanLogger.js';

// Import security analyzers
import { analyzeJavaScript } from '../src/security/static/jsAnalyzer.js';
import { analyzeHTML } from '../src/security/static/htmlAnalyzer.js';
import { analyzeDependenciesFromUrl } from '../src/security/static/dependencyAnalyzer.js';
import { crawlWebsite } from '../src/security/dynamic/crawler.js';
import { testXss, testFormXss } from '../src/security/dynamic/xssTester.js';
import { performAuthChecks, checkAuthWeaknesses } from '../src/security/dynamic/authChecks.js';
import { analyzeHeaders } from '../src/security/dynamic/headerAnalyzer.js';
import { analyzeCookies } from '../src/security/dynamic/cookieAnalyzer.js';
import { analyzeCSP } from '../src/security/dynamic/cspAnalyzer.js';

interface BenchmarkConfig {
  target: string;
  mode: ScanMode;
  outputFile?: string;
  maxDepth?: number;
  maxPages?: number;
  rateLimit?: number;
}

interface BenchmarkMetrics {
  scanId: string;
  target: string;
  mode: ScanMode;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds

  // Finding metrics
  totalFindings: number;
  findingsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  findingsByCategory: Record<string, number>;

  // Coverage metrics
  pagesScanned: number;
  endpointsDiscovered: number;
  scriptsAnalyzed: number;
  dependenciesChecked: number;

  // Performance metrics
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };

  // Scoring
  score: number;
  riskLevel: string;

  // Findings list
  findings: Array<{
    id: string;
    category: string;
    severity: string;
    confidence: number;
  }>;
}

async function runBenchmark(config: BenchmarkConfig): Promise<BenchmarkMetrics> {
  const startTime = new Date();
  const startMemory = process.memoryUsage();

  console.log(`\n=== Starting Benchmark ===`);
  console.log(`Target: ${config.target}`);
  console.log(`Mode: ${config.mode}`);
  console.log(`Start time: ${startTime.toISOString()}\n`);

  // Parse URL
  const targetUrl = config.target;
  const hostname = new URL(targetUrl).hostname;

  // Create scan record
  const scan = await prisma.scan.create({
    data: {
      targetUrl,
      hostname,
      mode: config.mode,
      status: 'RUNNING',
    },
  });

  ScanLogger.info(scan.id, `Starting ${config.mode} scan of ${targetUrl}`);

  let allFindings: any[] = [];
  let allTests: any[] = [];
  let pagesScanned = 0;
  let endpointsDiscovered = 0;
  let scriptsAnalyzed = 0;
  let dependenciesChecked = 0;

  try {
    // Run static analysis
    if (config.mode === 'STATIC' || config.mode === 'BOTH') {
      ScanLogger.info(scan.id, 'Starting static analysis...', 'STATIC');

      // Fetch page content
      ScanLogger.info(scan.id, `Fetching page content from ${targetUrl}`, 'STATIC');
      const response = await fetch(targetUrl, {
        headers: { 'User-Agent': 'WebSecScan/1.0 (Educational Security Scanner)' }
      });
      const html = await response.text();

      // Analyze HTML
      ScanLogger.info(scan.id, 'Analyzing HTML content...', 'STATIC');
      const htmlAnalysis = await analyzeHTML(html, targetUrl);
      allFindings.push(...htmlAnalysis.vulnerabilities);
      ScanLogger.success(scan.id, `Found ${htmlAnalysis.vulnerabilities.length} HTML issues`, 'STATIC');

      // Analyze inline JavaScript
      ScanLogger.info(scan.id, 'Analyzing JavaScript code...', 'STATIC');
      const scriptMatches = html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
      for (const match of scriptMatches) {
        const scriptContent = match[1];
        if (scriptContent.trim()) {
          scriptsAnalyzed++;
          const jsAnalysis = await analyzeJavaScript(scriptContent, `${targetUrl} (inline script)`);
          allFindings.push(...jsAnalysis.vulnerabilities);
        }
      }

      // Analyze external scripts (limited to 5)
      const externalScriptMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi);
      const scriptUrls = Array.from(externalScriptMatches).map(m => m[1]);
      ScanLogger.info(scan.id, `Analyzing ${Math.min(scriptUrls.length, 5)} external scripts...`, 'STATIC');

      for (const scriptUrl of scriptUrls.slice(0, 5)) {
        try {
          const absoluteUrl = new URL(scriptUrl, targetUrl).toString();
          const scriptResponse = await fetch(absoluteUrl, {
            headers: { 'User-Agent': 'WebSecScan/1.0' },
            signal: AbortSignal.timeout(5000)
          });

          if (scriptResponse.ok) {
            scriptsAnalyzed++;
            const scriptCode = await scriptResponse.text();
            const jsAnalysis = await analyzeJavaScript(scriptCode, absoluteUrl);
            allFindings.push(...jsAnalysis.vulnerabilities);
          }
        } catch {
          continue;
        }
      }

      // Analyze dependencies
      ScanLogger.info(scan.id, 'Checking dependencies...', 'STATIC');
      const depAnalysis = await analyzeDependenciesFromUrl(targetUrl);
      allFindings.push(...depAnalysis.vulnerabilities);
      dependenciesChecked = depAnalysis.vulnerabilities.length > 0 ? 1 : 0;

      ScanLogger.success(scan.id, 'Static analysis completed', 'STATIC');
    }

    // Run dynamic analysis
    if (config.mode === 'DYNAMIC' || config.mode === 'BOTH') {
      ScanLogger.info(scan.id, 'Starting dynamic analysis...', 'DYNAMIC');

      // Fetch and analyze headers
      ScanLogger.info(scan.id, `Fetching headers from ${targetUrl}...`, 'DYNAMIC');
      const response = await fetch(targetUrl, {
        headers: { 'User-Agent': 'WebSecScan/1.0 (Educational Security Scanner)' },
        redirect: 'manual'
      });

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Analyze security headers
      ScanLogger.info(scan.id, 'Analyzing security headers...', 'DYNAMIC');
      const headerTests = await analyzeHeaders(targetUrl, headers);
      allTests.push(...headerTests);

      // Analyze CSP
      const cspHeader = headers['content-security-policy'];
      const cspTest = analyzeCSP(cspHeader);
      allTests.push(cspTest);

      // Analyze cookies
      const setCookieHeader = response.headers.get('set-cookie');
      const setCookieHeaders = setCookieHeader ? [setCookieHeader] : [];
      const cookieTest = analyzeCookies(targetUrl, setCookieHeaders);
      allTests.push(cookieTest);

      // Crawl website
      ScanLogger.info(scan.id, `Crawling website...`, 'DYNAMIC');
      const crawlResult = await crawlWebsite(targetUrl, {
        maxDepth: config.maxDepth || 2,
        maxPages: config.maxPages || 50,
        rateLimit: config.rateLimit || 1000,
        respectRobotsTxt: true
      });

      pagesScanned = crawlResult.urls.length;
      endpointsDiscovered = crawlResult.endpoints.length;

      ScanLogger.success(
        scan.id,
        `Crawl completed. Found ${crawlResult.urls.length} URLs, ${crawlResult.endpoints.length} endpoints, ${crawlResult.forms.length} forms`,
        'DYNAMIC'
      );

      // Authentication checks
      ScanLogger.info(scan.id, 'Performing auth checks...', 'DYNAMIC');
      const authCheckResult = await performAuthChecks(targetUrl);
      allFindings.push(...authCheckResult.vulnerabilities);

      const authWeaknesses = await checkAuthWeaknesses(targetUrl);
      allFindings.push(...authWeaknesses);

      // XSS testing
      if (crawlResult.endpoints.length > 0) {
        ScanLogger.info(scan.id, 'Testing for XSS vulnerabilities...', 'DYNAMIC');
        const xssResult = await testXss(targetUrl, crawlResult.endpoints);
        allFindings.push(...xssResult.vulnerabilities);
      }

      // Form XSS testing
      if (crawlResult.forms.length > 0) {
        ScanLogger.info(scan.id, `Testing ${crawlResult.forms.length} forms for XSS...`, 'DYNAMIC');
        const formXssResult = await testFormXss(crawlResult.forms);
        allFindings.push(...formXssResult.vulnerabilities);
      }

      ScanLogger.success(scan.id, 'Dynamic analysis completed', 'DYNAMIC');
    }

    // Store vulnerabilities
    for (const finding of allFindings) {
      await prisma.vulnerability.create({
        data: {
          scanId: scan.id,
          type: finding.type,
          severity: finding.severity as any,
          confidence: finding.confidence as any,
          description: finding.description,
          location: finding.location,
          remediation: finding.remediation,
          owaspCategory: finding.owaspCategory || null,
          owaspId: finding.owaspId || null,
          ruleId: finding.ruleId || null,
        },
      });
    }

    // Store security tests
    for (const test of allTests) {
      await prisma.securityTest.create({
        data: {
          scanId: scan.id,
          testName: test.testName,
          passed: test.passed,
          score: test.score,
          result: test.result,
          reason: test.reason || null,
          recommendation: test.recommendation || null,
          details: test.details ? (test.details as any) : undefined,
        },
      });
    }

    // Calculate score from tests (if available), otherwise use base score
    let scoringResult;
    if (allTests.length > 0) {
      scoringResult = calculateScore(allTests);
    } else {
      // For static-only scans, calculate score based on findings severity
      let baseScore = 100;
      for (const finding of allFindings) {
        if (finding.severity === 'CRITICAL') baseScore -= 20;
        else if (finding.severity === 'HIGH') baseScore -= 15;
        else if (finding.severity === 'MEDIUM') baseScore -= 10;
        else if (finding.severity === 'LOW') baseScore -= 5;
      }
      const finalScore = Math.max(0, Math.min(100, baseScore));
      scoringResult = {
        score: finalScore,
        riskLevel: finalScore >= 80 ? 'LOW' : finalScore >= 60 ? 'MEDIUM' : finalScore >= 40 ? 'HIGH' : 'CRITICAL',
        grade: null,
        breakdown: [],
      };
    }

    // Update scan with results
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        score: scoringResult.score,
      },
    });

    const endTime = new Date();
    const endMemory = process.memoryUsage();

    // Aggregate findings by severity
    const findingsBySeverity = {
      critical: allFindings.filter(f => f.severity === 'CRITICAL').length,
      high: allFindings.filter(f => f.severity === 'HIGH').length,
      medium: allFindings.filter(f => f.severity === 'MEDIUM').length,
      low: allFindings.filter(f => f.severity === 'LOW').length,
      info: allFindings.filter(f => f.severity === 'INFO').length,
    };

    // Aggregate findings by category
    const findingsByCategory: Record<string, number> = {};
    for (const finding of allFindings) {
      const category = finding.owaspCategory || finding.category || 'Unknown';
      findingsByCategory[category] = (findingsByCategory[category] || 0) + 1;
    }

    const metrics: BenchmarkMetrics = {
      scanId: scan.id,
      target: targetUrl,
      mode: config.mode,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      totalFindings: allFindings.length,
      findingsBySeverity,
      findingsByCategory,
      pagesScanned,
      endpointsDiscovered,
      scriptsAnalyzed,
      dependenciesChecked,
      memoryUsage: {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
      },
      score: scoringResult.score,
      riskLevel: scoringResult.riskLevel,
      findings: allFindings.map(f => ({
        id: f.id,
        category: f.owaspCategory || f.category,
        severity: f.severity,
        confidence: f.confidence,
      })),
    };

    // Print summary
    console.log(`\n=== Benchmark Complete ===`);
    console.log(`Duration: ${metrics.duration}ms (${(metrics.duration / 1000).toFixed(2)}s)`);
    console.log(`Total Findings: ${metrics.totalFindings}`);
    console.log(`  Critical: ${findingsBySeverity.critical}`);
    console.log(`  High: ${findingsBySeverity.high}`);
    console.log(`  Medium: ${findingsBySeverity.medium}`);
    console.log(`  Low: ${findingsBySeverity.low}`);
    console.log(`  Info: ${findingsBySeverity.info}`);
    console.log(`Score: ${metrics.score}/100 (${metrics.riskLevel})`);
    console.log(`Pages Scanned: ${pagesScanned}`);
    console.log(`Endpoints Discovered: ${endpointsDiscovered}`);
    console.log(`Memory Delta: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);

    // Save to file if requested
    if (config.outputFile) {
      const fs = await import('fs/promises');
      await fs.writeFile(
        config.outputFile,
        JSON.stringify(metrics, null, 2),
        'utf-8'
      );
      console.log(`\nResults saved to ${config.outputFile}`);
    }

    return metrics;

  } catch (error) {
    console.error('Benchmark failed:', error);
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const config: BenchmarkConfig = {
    target: 'http://localhost:3001',
    mode: 'BOTH',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--target':
        config.target = args[++i];
        break;
      case '--mode':
        config.mode = args[++i] as ScanMode;
        break;
      case '--output':
        config.outputFile = args[++i];
        break;
      case '--max-depth':
        config.maxDepth = parseInt(args[++i], 10);
        break;
      case '--max-pages':
        config.maxPages = parseInt(args[++i], 10);
        break;
      case '--rate-limit':
        config.rateLimit = parseInt(args[++i], 10);
        break;
      case '--help':
        console.log(`
WebSecScan Benchmarking Harness

Usage:
  npm run benchmark -- [options]

Options:
  --target <url>        Target URL (default: http://localhost:3001)
  --mode <mode>         Scan mode: STATIC, DYNAMIC, or BOTH (default: BOTH)
  --output <file>       Save results to JSON file
  --max-depth <n>       Maximum crawl depth (default: 2)
  --max-pages <n>       Maximum pages to crawl (default: 50)
  --rate-limit <ms>     Rate limit between requests (default: 1000)
  --help                Show this help message

Examples:
  npm run benchmark -- --target http://localhost:3001 --mode BOTH
  npm run benchmark -- --target http://localhost:3001 --output results.json
  npm run benchmark -- --mode STATIC --max-depth 3
        `);
        process.exit(0);
    }
  }

  try {
    await runBenchmark(config);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runBenchmark, type BenchmarkConfig, type BenchmarkMetrics };
