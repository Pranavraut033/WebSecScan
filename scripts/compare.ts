#!/usr/bin/env tsx
/**
 * Comparison Script - Run WebSecScan vs OWASP ZAP and generate comparison reports
 * 
 * This script orchestrates benchmark runs for both WebSecScan and OWASP ZAP,
 * generating comparative analysis between:
 * - Different WebSecScan modes (STATIC/DYNAMIC/BOTH)
 * - WebSecScan vs OWASP ZAP baseline scans
 */

import { prisma } from '../src/lib/db.js';
import { runBenchmark, type BenchmarkMetrics } from './benchmark.js';
import {
  extractScanMetrics,
  compareScanResults,
  generateBenchmarkReport,
  exportMetricsToCSV,
  type ScanMetrics,
} from '../src/lib/metrics.js';
import {
  checkZapAvailability,
  runZapBaselineScan,
  generateZapComparisonReport,
  type ZapMetrics,
} from '../src/lib/zapIntegration.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';

interface ComparisonConfig {
  target: string;
  runStatic: boolean;
  runDynamic: boolean;
  runBoth: boolean;
  runZap: boolean;
  outputDir: string;
  zapTimeout?: number;
  zapMaxDuration?: number;
  interactive: boolean;
}

async function promptForTarget(defaultTarget: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`Enter target URL (default: ${defaultTarget}): `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultTarget);
    });
  });
}

async function checkTargetAvailability(target: string): Promise<boolean> {
  try {
    console.log(`Checking if ${target} is reachable...`);
    const response = await fetch(target, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok || response.status < 500;
  } catch (error) {
    return false;
  }
}

async function runComparison(config: ComparisonConfig) {
  console.log('=== WebSecScan vs OWASP ZAP Comparison Analysis ===\n');

  // Interactive target prompt if needed
  let target = config.target;
  if (config.interactive) {
    target = await promptForTarget(config.target);
  }

  // Check if target is available
  const targetAvailable = await checkTargetAvailability(target);
  if (!targetAvailable) {
    console.error(`\n❌ Target ${target} is not reachable!`);
    console.error('Please ensure:');
    console.error('  - Juice Shop is running: docker-compose up -d juice-shop');
    console.error('  - Or provide a different target URL\n');
    throw new Error('Target not reachable');
  }

  console.log(`✅ Target is reachable: ${target}\n`);
  console.log(`Output Directory: ${config.outputDir}\n`);

  // Ensure output directory exists
  await fs.mkdir(config.outputDir, { recursive: true });

  const results: { [key: string]: BenchmarkMetrics } = {};
  const scanMetrics: ScanMetrics[] = [];
  let zapMetrics: ZapMetrics | null = null;

  try {
    // Run STATIC scan
    if (config.runStatic) {
      console.log('\n--- Running STATIC scan ---');
      results.static = await runBenchmark({
        target,
        mode: 'STATIC',
        outputFile: path.join(config.outputDir, 'static-raw.json'),
      });

      const staticMetrics = await extractScanMetrics(prisma, results.static.scanId);
      scanMetrics.push(staticMetrics);

      const staticReport = generateBenchmarkReport(staticMetrics);
      await fs.writeFile(
        path.join(config.outputDir, 'static-report.md'),
        staticReport,
        'utf-8'
      );
    }

    // Run DYNAMIC scan
    if (config.runDynamic) {
      console.log('\n--- Running DYNAMIC scan ---');
      results.dynamic = await runBenchmark({
        target,
        mode: 'DYNAMIC',
        outputFile: path.join(config.outputDir, 'dynamic-raw.json'),
      });

      const dynamicMetrics = await extractScanMetrics(prisma, results.dynamic.scanId);
      scanMetrics.push(dynamicMetrics);

      const dynamicReport = generateBenchmarkReport(dynamicMetrics);
      await fs.writeFile(
        path.join(config.outputDir, 'dynamic-report.md'),
        dynamicReport,
        'utf-8'
      );
    }

    // Run BOTH (combined) scan
    if (config.runBoth) {
      console.log('\n--- Running BOTH (combined) scan ---');
      results.both = await runBenchmark({
        target,
        mode: 'BOTH',
        outputFile: path.join(config.outputDir, 'both-raw.json'),
      });

      const bothMetrics = await extractScanMetrics(prisma, results.both.scanId);
      scanMetrics.push(bothMetrics);

      const bothReport = generateBenchmarkReport(bothMetrics);
      await fs.writeFile(
        path.join(config.outputDir, 'both-report.md'),
        bothReport,
        'utf-8'
      );
    }

    // Run OWASP ZAP scan if requested
    if (config.runZap) {
      console.log('\n--- Checking OWASP ZAP Availability ---');
      const zapAvailability = await checkZapAvailability();

      if (!zapAvailability.available) {
        console.warn('⚠️  OWASP ZAP is not available. Skipping ZAP scan.');
        console.warn('Install ZAP: docker pull ghcr.io/zaproxy/zaproxy:stable');
      } else {
        console.log(`✅ ZAP available via ${zapAvailability.method}\n`);

        try {
          zapMetrics = await runZapBaselineScan(target, config.outputDir, {
            timeout: config.zapTimeout || 5,
            maxDuration: config.zapMaxDuration || 2,
          });

          console.log(`\n✅ ZAP scan completed!`);
          console.log(`   Total Alerts: ${zapMetrics.totalAlerts}`);
          console.log(`   High: ${zapMetrics.alertsByRisk.high} | Medium: ${zapMetrics.alertsByRisk.medium} | Low: ${zapMetrics.alertsByRisk.low}`);
          console.log(`   URLs Scanned: ${zapMetrics.urlsScanned}`);
          console.log(`   Duration: ${(zapMetrics.duration / 1000).toFixed(2)}s`);

          // Generate WebSecScan vs ZAP comparison report
          if (scanMetrics.length > 0) {
            const webSecScanMetrics = scanMetrics.find(m => m.mode === 'BOTH') || scanMetrics[scanMetrics.length - 1];
            const zapComparisonReport = generateZapComparisonReport(webSecScanMetrics, zapMetrics, target);

            await fs.writeFile(
              path.join(config.outputDir, 'ZAP-COMPARISON.md'),
              zapComparisonReport,
              'utf-8'
            );

            console.log('   Generated: ZAP-COMPARISON.md');
          }
        } catch (zapError) {
          console.error('⚠️  ZAP scan failed:', zapError);
          console.error('Continuing with WebSecScan results only...');
        }
      }
    }

    // Generate WebSecScan mode comparison reports
    if (scanMetrics.length >= 2) {
      console.log('\n--- Generating WebSecScan Mode Comparison ---');

      let comparisonReport = `# WebSecScan Mode Comparison\n\n`;
      comparisonReport += `**Target**: ${target}\n`;
      comparisonReport += `**Date**: ${new Date().toISOString()}\n\n`;

      // Compare each pair
      for (let i = 0; i < scanMetrics.length; i++) {
        for (let j = i + 1; j < scanMetrics.length; j++) {
          const m1 = scanMetrics[i];
          const m2 = scanMetrics[j];

          const comparison = compareScanResults(
            m1,
            m2,
            m1.mode,
            m2.mode
          );

          comparisonReport += `## ${m1.mode} vs ${m2.mode}\n\n`;
          comparisonReport += `- **Common Findings** (estimated): ${comparison.commonFindings}\n`;
          comparisonReport += `- **Unique to ${m1.mode}**: ${comparison.uniqueToTool1}\n`;
          comparisonReport += `- **Unique to ${m2.mode}**: ${comparison.uniqueToTool2}\n`;
          comparisonReport += `- **Duration Ratio**: ${comparison.durationRatio.toFixed(2)}x\n`;
          comparisonReport += `- **Category Overlap**: ${comparison.categoryCoverage.overlap.length} categories\n\n`;

          comparisonReport += `### Finding Distribution\n\n`;
          comparisonReport += `| Metric | ${m1.mode} | ${m2.mode} |\n`;
          comparisonReport += `|--------|${'-'.repeat(m1.mode.length + 2)}|${'-'.repeat(m2.mode.length + 2)}|\n`;
          comparisonReport += `| Total | ${m1.totalFindings} | ${m2.totalFindings} |\n`;
          comparisonReport += `| Critical | ${m1.criticalFindings} | ${m2.criticalFindings} |\n`;
          comparisonReport += `| High | ${m1.highFindings} | ${m2.highFindings} |\n`;
          comparisonReport += `| Medium | ${m1.mediumFindings} | ${m2.mediumFindings} |\n`;
          comparisonReport += `| Low | ${m1.lowFindings} | ${m2.lowFindings} |\n`;
          comparisonReport += `| Score | ${m1.score}/100 | ${m2.score}/100 |\n`;
          comparisonReport += `| Risk | ${m1.riskLevel} | ${m2.riskLevel} |\n\n`;
        }
      }

      await fs.writeFile(
        path.join(config.outputDir, 'comparison-report.md'),
        comparisonReport,
        'utf-8'
      );
    }

    // Export CSV summary
    const csv = exportMetricsToCSV(scanMetrics);
    await fs.writeFile(
      path.join(config.outputDir, 'metrics-summary.csv'),
      csv,
      'utf-8'
    );

    console.log('\n=== Comparison Complete ===');
    console.log(`Reports saved to: ${config.outputDir}`);
    console.log('- *-raw.json: Raw benchmark results');
    console.log('- *-report.md: Detailed scan reports');
    if (scanMetrics.length >= 2) {
      console.log('- comparison-report.md: WebSecScan mode comparison');
    }
    if (zapMetrics) {
      console.log('- ZAP-COMPARISON.md: WebSecScan vs OWASP ZAP');
      console.log('- zap-baseline.json: ZAP raw results');
    }
    console.log('- metrics-summary.csv: CSV export for analysis');

  } catch (error) {
    console.error('Comparison failed:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const config: ComparisonConfig = {
    target: 'http://localhost:3001',
    runStatic: false,
    runDynamic: false,
    runBoth: false,
    runZap: false,
    outputDir: './results',
    interactive: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--target':
        config.target = args[++i];
        break;
      case '--static':
        config.runStatic = true;
        break;
      case '--dynamic':
        config.runDynamic = true;
        break;
      case '--both':
        config.runBoth = true;
        break;
      case '--zap':
        config.runZap = true;
        break;
      case '--all':
        config.runStatic = true;
        config.runDynamic = true;
        config.runBoth = true;
        config.runZap = true;
        break;
      case '--output':
        config.outputDir = args[++i];
        break;
      case '--zap-timeout':
        config.zapTimeout = parseInt(args[++i], 10);
        break;
      case '--zap-max-duration':
        config.zapMaxDuration = parseInt(args[++i], 10);
        break;
      case '--interactive':
      case '-i':
        config.interactive = true;
        break;
      case '--help':
        console.log(`
WebSecScan vs OWASP ZAP Comparison Script

Usage:
  npm run compare -- [options]

Options:
  --target <url>           Target URL (default: http://localhost:3001)
  --static                 Run WebSecScan STATIC scan
  --dynamic                Run WebSecScan DYNAMIC scan
  --both                   Run WebSecScan combined BOTH scan
  --zap                    Run OWASP ZAP baseline scan
  --all                    Run all scans (WebSecScan + ZAP)
  --output <dir>           Output directory (default: ./results)
  --zap-timeout <min>      ZAP scan timeout in minutes (default: 5)
  --zap-max-duration <min> ZAP spider max duration (default: 2)
  --interactive, -i        Prompt for target URL at runtime
  --help                   Show this help message

Examples:
  # Full comparison: WebSecScan + ZAP against Juice Shop
  npm run compare -- --all --target http://localhost:3001

  # Interactive mode (prompts for URL if Juice Shop not running)
  npm run compare -- --all --interactive

  # WebSecScan modes only (no ZAP)
  npm run compare -- --static --dynamic --both

  # Just ZAP vs WebSecScan BOTH
  npm run compare -- --both --zap --output results/juice-shop

  # Custom ZAP timeouts
  npm run compare -- --zap --zap-timeout 10 --zap-max-duration 5

Setup:
  # Start Juice Shop (required)
  docker-compose up -d juice-shop

  # Pull ZAP image (optional, for --zap)
  docker pull ghcr.io/zaproxy/zaproxy:stable
        `);
        process.exit(0);
    }
  }

  // Default to --all if no mode specified
  if (!config.runStatic && !config.runDynamic && !config.runBoth && !config.runZap) {
    config.runStatic = true;
    config.runDynamic = true;
    config.runBoth = true;
    config.runZap = true;
  }

  try {
    await runComparison(config);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runComparison };
