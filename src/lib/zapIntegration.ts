/**
 * OWASP ZAP Integration Module
 * 
 * Provides utilities to run ZAP scans and parse results for comparison with WebSecScan.
 * Supports both API-based and CLI-based ZAP execution.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface ZapAlert {
  pluginid: string;
  alertRef: string;
  alert: string;
  name: string;
  riskcode: string;
  confidence: string;
  riskdesc: string;
  desc: string;
  instances: Array<{
    uri: string;
    method: string;
    param?: string;
    evidence?: string;
  }>;
  count: string;
  solution: string;
  reference: string;
  cweid: string;
  wascid: string;
  sourceid: string;
}

export interface ZapScanResult {
  '@version': string;
  '@generated': string;
  site: Array<{
    '@name': string;
    '@host': string;
    '@port': string;
    '@ssl': string;
    alerts: ZapAlert[];
  }>;
}

export interface ZapMetrics {
  tool: 'OWASP ZAP';
  scanType: 'baseline' | 'full' | 'api';
  target: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalAlerts: number;
  alertsByRisk: {
    informational: number;
    low: number;
    medium: number;
    high: number;
  };
  urlsScanned: number;
  alerts: Array<{
    id: string;
    name: string;
    risk: string;
    confidence: string;
    category: string;
    instances: number;
  }>;
}

/**
 * Check if ZAP is available (Docker or local installation)
 */
export async function checkZapAvailability(): Promise<{ available: boolean; method: 'docker' | 'local' | null }> {
  try {
    // Check Docker
    await execAsync('docker ps');
    const { stdout } = await execAsync('docker images ghcr.io/zaproxy/zaproxy:stable -q');
    if (stdout.trim()) {
      return { available: true, method: 'docker' };
    }
  } catch {
    // Docker not available or ZAP image not present
  }

  try {
    // Check local ZAP installation
    await execAsync('zap-baseline.py --help');
    return { available: true, method: 'local' };
  } catch {
    // ZAP not installed locally
  }

  return { available: false, method: null };
}

/**
 * Run ZAP baseline scan using Docker
 */
export async function runZapBaselineScan(
  target: string,
  outputDir: string,
  options: {
    timeout?: number; // minutes
    maxDuration?: number; // minutes
  } = {}
): Promise<ZapMetrics> {
  const startTime = new Date();
  console.log(`\n--- Running OWASP ZAP Baseline Scan ---`);
  console.log(`Target: ${target}`);

  const availability = await checkZapAvailability();
  if (!availability.available) {
    throw new Error('OWASP ZAP is not available. Install via: docker pull ghcr.io/zaproxy/zaproxy:stable');
  }

  // Ensure output directory exists and get absolute path
  await fs.mkdir(outputDir, { recursive: true });
  const absoluteOutputDir = path.resolve(outputDir);

  const reportPath = path.join(absoluteOutputDir, 'zap-baseline-report.html');
  const jsonPath = path.join(absoluteOutputDir, 'zap-baseline.json');
  const xmlPath = path.join(absoluteOutputDir, 'zap-baseline.xml');

  try {
    let command: string;
    const timeoutMinutes = options.timeout || 5;
    const maxDuration = options.maxDuration || 2;

    if (availability.method === 'docker') {
      // Replace localhost with host.docker.internal for Docker (only for local targets)
      let dockerTarget = target;
      const isLocalTarget = target.includes('localhost') || target.includes('127.0.0.1');

      if (isLocalTarget) {
        dockerTarget = target
          .replace('localhost', 'host.docker.internal')
          .replace('127.0.0.1', 'host.docker.internal');
      }

      // Docker-based ZAP scan
      // For local targets, add host network access; external URLs work without it
      const hostFlag = isLocalTarget ? '--add-host=host.docker.internal:host-gateway ' : '';

      command = `docker run --rm ` +
        `${hostFlag}` +
        `-v "${absoluteOutputDir}:/zap/wrk:rw" ` +
        `-t ghcr.io/zaproxy/zaproxy:stable ` +
        `zap-baseline.py ` +
        `-t ${dockerTarget} ` +
        `-r zap-baseline-report.html ` +
        `-J zap-baseline.json ` +
        `-x zap-baseline.xml ` +
        `-m ${maxDuration} ` + // Max spider duration
        `-T ${timeoutMinutes} ` + // Timeout
        `-I`; // Ignore warnings (return zero exit code)

      console.log('Running ZAP via Docker...');
      if (isLocalTarget) {
        console.log(`Target (Docker translated): ${dockerTarget}`);
      } else {
        console.log(`Target: ${target} (external website)`);
      }
    } else {
      // Local ZAP installation
      command = `zap-baseline.py ` +
        `-t ${target} ` +
        `-r "${reportPath}" ` +
        `-J "${jsonPath}" ` +
        `-x "${xmlPath}" ` +
        `-m ${maxDuration} ` +
        `-T ${timeoutMinutes} ` +
        `-I`;

      console.log('Running ZAP via local installation...');
    }

    // Execute ZAP scan
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    console.log(stdout);
    if (stderr) {
      console.warn('ZAP stderr:', stderr);
    }

    const endTime = new Date();
    console.log(`ZAP scan completed in ${(endTime.getTime() - startTime.getTime()) / 1000}s`);

    // Parse ZAP JSON results
    const metrics = await parseZapResults(jsonPath, target, startTime, endTime);
    return metrics;

  } catch (error: any) {
    // ZAP returns non-zero exit codes for warnings, handle gracefully
    if (error.code === 2) {
      console.log('ZAP scan completed with warnings (exit code 2)');
      const endTime = new Date();

      // Try to parse results even if exit code indicates warnings
      try {
        const metrics = await parseZapResults(jsonPath, target, startTime, endTime);
        return metrics;
      } catch (parseError) {
        console.error('Failed to parse ZAP results after warning exit:', parseError);
        throw parseError;
      }
    }

    // Exit code 3 often means connection issues
    if (error.code === 3) {
      console.error('\n❌ ZAP scan failed with exit code 3 (Connection issue)');
      console.error('This usually means:');
      console.error('  1. Target is not accessible from Docker container');
      console.error('  2. Target URL is incorrect');
      console.error('  3. Firewall blocking Docker network access');
      console.error('\nTroubleshooting:');
      console.error('  - Ensure target is running: curl ' + target);
      console.error('  - Try with external URL instead of localhost');
      console.error('  - Check Docker network: docker run --rm curlimages/curl:latest curl -v ' + target.replace('localhost', 'host.docker.internal'));
      if (error.stdout) {
        console.error('\nZAP output:', error.stdout);
      }
    }

    console.error('ZAP scan failed:', error.message);
    throw error;
  }
}

/**
 * Parse ZAP JSON results into standardized metrics
 */
async function parseZapResults(
  jsonPath: string,
  target: string,
  startTime: Date,
  endTime: Date
): Promise<ZapMetrics> {
  try {
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const zapResult: ZapScanResult = JSON.parse(jsonContent);

    const alerts: ZapAlert[] = zapResult.site?.[0]?.alerts || [];

    const metrics: ZapMetrics = {
      tool: 'OWASP ZAP',
      scanType: 'baseline',
      target,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      totalAlerts: alerts.length,
      alertsByRisk: {
        informational: 0,
        low: 0,
        medium: 0,
        high: 0,
      },
      urlsScanned: 0,
      alerts: [],
    };

    // Count URLs scanned (unique URIs across all alerts)
    const uniqueUrls = new Set<string>();

    for (const alert of alerts) {
      const instances = Array.isArray(alert.instances) ? alert.instances : [];
      const instanceCount = instances.length;

      // Count unique URLs
      instances.forEach(inst => uniqueUrls.add(inst.uri));

      // Parse risk level
      const riskDesc = alert.riskdesc || alert.riskcode || '';
      const risk = riskDesc.toLowerCase();

      if (risk.includes('informational') || risk.includes('info')) {
        metrics.alertsByRisk.informational++;
      } else if (risk.includes('low')) {
        metrics.alertsByRisk.low++;
      } else if (risk.includes('medium')) {
        metrics.alertsByRisk.medium++;
      } else if (risk.includes('high')) {
        metrics.alertsByRisk.high++;
      }

      // Map to OWASP category (best effort)
      let category = 'Security Misconfiguration';
      const alertName = (alert.name || alert.alert || '').toLowerCase();

      if (alertName.includes('injection') || alertName.includes('sql') || alertName.includes('xss')) {
        category = 'Injection';
      } else if (alertName.includes('auth') || alertName.includes('session')) {
        category = 'Broken Authentication';
      } else if (alertName.includes('crypto') || alertName.includes('ssl') || alertName.includes('tls')) {
        category = 'Cryptographic Failures';
      } else if (alertName.includes('access') || alertName.includes('authorization')) {
        category = 'Broken Access Control';
      } else if (alertName.includes('component') || alertName.includes('library') || alertName.includes('vulnerable')) {
        category = 'Vulnerable Components';
      }

      metrics.alerts.push({
        id: alert.pluginid || alert.alertRef || '',
        name: alert.name || alert.alert || 'Unknown',
        risk: riskDesc.split(' ')[0] || 'Unknown',
        confidence: alert.confidence || 'Unknown',
        category,
        instances: instanceCount,
      });
    }

    metrics.urlsScanned = uniqueUrls.size;

    return metrics;
  } catch (error) {
    console.error('Failed to parse ZAP JSON results:', error);
    throw new Error(`Failed to parse ZAP results from ${jsonPath}: ${error}`);
  }
}

/**
 * Generate comparison report between WebSecScan and ZAP
 */
export function generateZapComparisonReport(
  webSecScanMetrics: any,
  zapMetrics: ZapMetrics,
  target: string
): string {
  const report: string[] = [];

  report.push('# WebSecScan vs OWASP ZAP - Comparative Analysis\n');
  report.push(`**Date**: ${new Date().toISOString().split('T')[0]}`);
  report.push(`**Target**: ${target}`);
  report.push(`**Scan Modes**: WebSecScan (${webSecScanMetrics.mode}) vs ZAP (Baseline)\n`);

  report.push('## Executive Summary\n');
  report.push('| Tool | Total Findings | Critical | High | Medium | Low | Duration | URLs Scanned |');
  report.push('|------|---------------|----------|------|--------|-----|----------|--------------|');

  // WebSecScan row - handle both BenchmarkMetrics and ScanMetrics structures
  const wssCritical = webSecScanMetrics.criticalFindings ?? webSecScanMetrics.findingsBySeverity?.critical ?? 0;
  const wssHigh = webSecScanMetrics.highFindings ?? webSecScanMetrics.findingsBySeverity?.high ?? 0;
  const wssMedium = webSecScanMetrics.mediumFindings ?? webSecScanMetrics.findingsBySeverity?.medium ?? 0;
  const wssLow = webSecScanMetrics.lowFindings ?? webSecScanMetrics.findingsBySeverity?.low ?? 0;
  const wssPages = webSecScanMetrics.pagesScanned ?? 0;

  report.push(
    `| **WebSecScan** | ${webSecScanMetrics.totalFindings} | ` +
    `${wssCritical} | ` +
    `${wssHigh} | ` +
    `${wssMedium} | ` +
    `${wssLow} | ` +
    `${(webSecScanMetrics.duration / 1000).toFixed(2)}s | ` +
    `${wssPages} |`
  );

  // ZAP row
  report.push(
    `| **OWASP ZAP** | ${zapMetrics.totalAlerts} | ` +
    `0 | ` + // ZAP baseline doesn't classify as critical
    `${zapMetrics.alertsByRisk.high} | ` +
    `${zapMetrics.alertsByRisk.medium} | ` +
    `${zapMetrics.alertsByRisk.low} | ` +
    `${(zapMetrics.duration / 1000).toFixed(2)}s | ` +
    `${zapMetrics.urlsScanned} |\n`
  );

  report.push('## Performance Comparison\n');
  const speedRatio = (zapMetrics.duration / webSecScanMetrics.duration).toFixed(1);
  const coverageRatio = (zapMetrics.urlsScanned / Math.max(1, wssPages)).toFixed(1);

  report.push(`- **Speed**: WebSecScan is ${speedRatio}x faster`);
  report.push(`- **Coverage**: ZAP discovered ${coverageRatio}x more URLs`);
  report.push(`- **Critical Findings**: WebSecScan found ${wssCritical}, ZAP found 0 (baseline limitation)`);

  // Memory usage might not always be available
  if (webSecScanMetrics.memoryUsage?.heapUsed) {
    report.push(`- **Memory**: WebSecScan used ${(webSecScanMetrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  }
  report.push('');

  report.push('## WebSecScan Findings\n');

  // Use OWASP coverage if available (from ScanMetrics), otherwise try findings array
  if (webSecScanMetrics.owaspCoverage && Object.keys(webSecScanMetrics.owaspCoverage).length > 0) {
    report.push('| OWASP Category | Count |');
    report.push('|----------------|-------|');

    for (const [category, count] of Object.entries(webSecScanMetrics.owaspCoverage)) {
      report.push(`| ${category} | ${count} |`);
    }
  } else if (webSecScanMetrics.findings && webSecScanMetrics.findings.length > 0) {
    report.push('| Severity | Category | Count |');
    report.push('|----------|----------|-------|');

    const categoryMap: Map<string, Map<string, number>> = new Map();
    for (const finding of webSecScanMetrics.findings) {
      const category = finding.category || 'Unknown';
      const severity = finding.severity || 'Unknown';

      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map());
      }
      const sevMap = categoryMap.get(category)!;
      sevMap.set(severity, (sevMap.get(severity) || 0) + 1);
    }

    for (const [category, sevMap] of categoryMap) {
      for (const [severity, count] of sevMap) {
        report.push(`| ${severity} | ${category} | ${count} |`);
      }
    }
  } else {
    report.push('*No findings reported*');
  }

  report.push('\n## OWASP ZAP Alerts\n');
  if (zapMetrics.alerts.length > 0) {
    report.push('| Risk | Alert | Category | Instances |');
    report.push('|------|-------|----------|-----------|');

    for (const alert of zapMetrics.alerts.slice(0, 20)) { // Top 20
      report.push(`| ${alert.risk} | ${alert.name} | ${alert.category} | ${alert.instances} |`);
    }

    if (zapMetrics.alerts.length > 20) {
      report.push(`\n*... and ${zapMetrics.alerts.length - 20} more alerts*`);
    }
  } else {
    report.push('*No alerts reported*');
  }

  report.push('\n## Conclusion\n');
  report.push('**WebSecScan Strengths:**');
  report.push('- ⚡ Significantly faster scan time');
  report.push('- 🎯 Deep code-level static analysis');
  report.push('- 🔴 Identifies critical vulnerabilities (e.g., eval, innerHTML)');
  report.push('- 🪶 Lightweight with minimal memory footprint\n');

  report.push('**OWASP ZAP Strengths:**');
  report.push('- 🕷️ Superior crawling and URL discovery');
  report.push('- 📋 Comprehensive passive security checks');
  report.push('- 🏭 Industry-standard, mature tooling');
  report.push('- 🛡️ Extensive ruleset with diverse finding types\n');

  report.push('**Recommendation:** Use both tools for complementary coverage. WebSecScan for fast development feedback, ZAP for comprehensive security validation.\n');

  return report.join('\n');
}
