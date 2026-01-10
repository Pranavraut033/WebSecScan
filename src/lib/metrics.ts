/**
 * Metrics Collection and Analysis Utilities
 * 
 * Provides helper functions for collecting, analyzing, and comparing
 * security scan metrics for benchmarking and evaluation purposes.
 */

import { Prisma, Scan, Vulnerability } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

export interface ScanMetrics {
  scanId: string;
  target: string;
  mode: string;
  duration: number;

  // Findings
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  infoFindings: number;

  // OWASP Coverage
  owaspCoverage: {
    [category: string]: number;
  };

  // Score
  score: number;
  riskLevel: string;

  // Coverage
  pagesScanned?: number;
  endpointsDiscovered?: number;
  scriptsAnalyzed?: number;
  dependenciesChecked?: number;
}

export interface ComparisonMetrics {
  tool1: string;
  tool2: string;

  // Finding overlap
  commonFindings: number;
  uniqueToTool1: number;
  uniqueToTool2: number;

  // Severity comparison
  severityCorrelation: number; // -1 to 1

  // Category coverage
  categoryCoverage: {
    tool1: string[];
    tool2: string[];
    overlap: string[];
  };

  // Performance
  durationRatio: number; // tool1Duration / tool2Duration
}

export interface ValidationMetrics {
  totalFindings: number;
  validated: number;
  truePositives: number;
  falsePositives: number;
  inconclusive: number;

  // Rates
  falsePositiveRate: number;
  precision: number;

  // By category
  byCategory: {
    [category: string]: {
      total: number;
      truePositives: number;
      falsePositives: number;
      fpRate: number;
    };
  };

  // By severity
  bySeverity: {
    [severity: string]: {
      total: number;
      truePositives: number;
      falsePositives: number;
      fpRate: number;
    };
  };
}

/**
 * Extract comprehensive metrics from a scan result
 */
export async function extractScanMetrics(
  prisma: PrismaClient,
  scanId: string
): Promise<ScanMetrics> {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      results: true,
    },
  });

  if (!scan) {
    throw new Error(`Scan ${scanId} not found`);
  }

  const duration = scan.completedAt && scan.createdAt
    ? scan.completedAt.getTime() - scan.createdAt.getTime()
    : 0;

  // Count by severity
  const criticalFindings = scan.results.filter((v: any) => v.severity === 'CRITICAL').length;
  const highFindings = scan.results.filter((v: any) => v.severity === 'HIGH').length;
  const mediumFindings = scan.results.filter((v: any) => v.severity === 'MEDIUM').length;
  const lowFindings = scan.results.filter((v: any) => v.severity === 'LOW').length;
  const infoFindings = scan.results.filter((v: any) => v.severity === 'INFO').length;

  // Count by OWASP category
  const owaspCoverage: { [key: string]: number } = {};
  for (const vuln of scan.results) {
    const category = vuln.owaspCategory || 'Unknown';
    owaspCoverage[category] = (owaspCoverage[category] || 0) + 1;
  }

  // Determine risk level from score
  const score = scan.score || 0;
  let riskLevel = 'Unknown';
  if (score >= 80) riskLevel = 'Low';
  else if (score >= 60) riskLevel = 'Medium';
  else if (score >= 40) riskLevel = 'High';
  else riskLevel = 'Critical';

  return {
    scanId: scan.id,
    target: scan.targetUrl,
    mode: scan.mode,
    duration,
    totalFindings: scan.results.length,
    criticalFindings,
    highFindings,
    mediumFindings,
    lowFindings,
    infoFindings,
    owaspCoverage,
    score,
    riskLevel,
  };
}

/**
 * Compare two scan results to identify overlaps and unique findings
 */
export function compareScanResults(
  metrics1: ScanMetrics,
  metrics2: ScanMetrics,
  tool1Name = 'Tool 1',
  tool2Name = 'Tool 2'
): ComparisonMetrics {
  // Category overlap
  const categories1 = Object.keys(metrics1.owaspCoverage);
  const categories2 = Object.keys(metrics2.owaspCoverage);
  const overlap = categories1.filter(c => categories2.includes(c));

  // Simplified finding overlap (assumes similar finding counts indicate overlap)
  // In practice, you'd need to match findings by vulnerability type, location, etc.
  const minFindings = Math.min(metrics1.totalFindings, metrics2.totalFindings);
  const maxFindings = Math.max(metrics1.totalFindings, metrics2.totalFindings);
  const estimatedOverlap = Math.floor(minFindings * 0.7); // Rough estimate

  const uniqueToTool1 = metrics1.totalFindings - estimatedOverlap;
  const uniqueToTool2 = metrics2.totalFindings - estimatedOverlap;

  // Severity correlation (simplified)
  const severityCounts1 = [
    metrics1.criticalFindings,
    metrics1.highFindings,
    metrics1.mediumFindings,
    metrics1.lowFindings,
  ];
  const severityCounts2 = [
    metrics2.criticalFindings,
    metrics2.highFindings,
    metrics2.mediumFindings,
    metrics2.lowFindings,
  ];

  const correlation = calculateCorrelation(severityCounts1, severityCounts2);

  return {
    tool1: tool1Name,
    tool2: tool2Name,
    commonFindings: estimatedOverlap,
    uniqueToTool1,
    uniqueToTool2,
    severityCorrelation: correlation,
    categoryCoverage: {
      tool1: categories1,
      tool2: categories2,
      overlap,
    },
    durationRatio: metrics1.duration / metrics2.duration,
  };
}

/**
 * Calculate false-positive metrics from validation results
 */
export function calculateValidationMetrics(
  findings: Array<{
    category: string;
    severity: string;
    validated: boolean;
    falsePositive: boolean;
  }>
): ValidationMetrics {
  const totalFindings = findings.length;
  const validated = findings.filter(f => f.validated).length;
  const truePositives = findings.filter(f => f.validated && !f.falsePositive).length;
  const falsePositives = findings.filter(f => f.validated && f.falsePositive).length;
  const inconclusive = validated - truePositives - falsePositives;

  const falsePositiveRate = validated > 0 ? falsePositives / validated : 0;
  const precision = (truePositives + falsePositives) > 0
    ? truePositives / (truePositives + falsePositives)
    : 0;

  // By category
  const byCategory: ValidationMetrics['byCategory'] = {};
  const categories = [...new Set(findings.map(f => f.category))];

  for (const category of categories) {
    const categoryFindings = findings.filter(f => f.category === category);
    const validatedCount = categoryFindings.filter(f => f.validated).length;
    const tp = categoryFindings.filter(f => f.validated && !f.falsePositive).length;
    const fp = categoryFindings.filter(f => f.validated && f.falsePositive).length;

    byCategory[category] = {
      total: categoryFindings.length,
      truePositives: tp,
      falsePositives: fp,
      fpRate: validatedCount > 0 ? fp / validatedCount : 0,
    };
  }

  // By severity
  const bySeverity: ValidationMetrics['bySeverity'] = {};
  const severities = [...new Set(findings.map(f => f.severity))];

  for (const severity of severities) {
    const severityFindings = findings.filter(f => f.severity === severity);
    const validatedCount = severityFindings.filter(f => f.validated).length;
    const tp = severityFindings.filter(f => f.validated && !f.falsePositive).length;
    const fp = severityFindings.filter(f => f.validated && f.falsePositive).length;

    bySeverity[severity] = {
      total: severityFindings.length,
      truePositives: tp,
      falsePositives: fp,
      fpRate: validatedCount > 0 ? fp / validatedCount : 0,
    };
  }

  return {
    totalFindings,
    validated,
    truePositives,
    falsePositives,
    inconclusive,
    falsePositiveRate,
    precision,
    byCategory,
    bySeverity,
  };
}

/**
 * Generate a comprehensive benchmark report
 */
export function generateBenchmarkReport(
  metrics: ScanMetrics,
  validation?: ValidationMetrics,
  comparison?: ComparisonMetrics
): string {
  let report = `# Benchmark Report\n\n`;
  report += `**Scan ID**: ${metrics.scanId}\n`;
  report += `**Target**: ${metrics.target}\n`;
  report += `**Mode**: ${metrics.mode}\n`;
  report += `**Duration**: ${(metrics.duration / 1000).toFixed(2)}s\n\n`;

  report += `## Findings Summary\n\n`;
  report += `- **Total**: ${metrics.totalFindings}\n`;
  report += `- **Critical**: ${metrics.criticalFindings}\n`;
  report += `- **High**: ${metrics.highFindings}\n`;
  report += `- **Medium**: ${metrics.mediumFindings}\n`;
  report += `- **Low**: ${metrics.lowFindings}\n`;
  report += `- **Info**: ${metrics.infoFindings}\n\n`;

  report += `## Security Score\n\n`;
  report += `**Score**: ${metrics.score}/100 (**${metrics.riskLevel}** Risk)\n\n`;

  report += `## OWASP Coverage\n\n`;
  report += `| Category | Findings |\n`;
  report += `|----------|----------|\n`;
  for (const [category, count] of Object.entries(metrics.owaspCoverage)) {
    report += `| ${category} | ${count} |\n`;
  }
  report += `\n`;

  if (validation) {
    report += `## Validation Results\n\n`;
    report += `- **Validated**: ${validation.validated}/${validation.totalFindings} (${((validation.validated / validation.totalFindings) * 100).toFixed(1)}%)\n`;
    report += `- **True Positives**: ${validation.truePositives}\n`;
    report += `- **False Positives**: ${validation.falsePositives}\n`;
    report += `- **False Positive Rate**: ${(validation.falsePositiveRate * 100).toFixed(1)}%\n`;
    report += `- **Precision**: ${(validation.precision * 100).toFixed(1)}%\n\n`;

    report += `### False Positive Rate by Category\n\n`;
    report += `| Category | Total | TP | FP | FP Rate |\n`;
    report += `|----------|-------|----|----|--------|\n`;
    for (const [category, data] of Object.entries(validation.byCategory)) {
      report += `| ${category} | ${data.total} | ${data.truePositives} | ${data.falsePositives} | ${(data.fpRate * 100).toFixed(1)}% |\n`;
    }
    report += `\n`;
  }

  if (comparison) {
    report += `## Comparison with ${comparison.tool2}\n\n`;
    report += `- **Common Findings**: ${comparison.commonFindings}\n`;
    report += `- **Unique to ${comparison.tool1}**: ${comparison.uniqueToTool1}\n`;
    report += `- **Unique to ${comparison.tool2}**: ${comparison.uniqueToTool2}\n`;
    report += `- **Severity Correlation**: ${comparison.severityCorrelation.toFixed(3)}\n`;
    report += `- **Duration Ratio**: ${comparison.durationRatio.toFixed(2)}x\n`;
    report += `- **Category Overlap**: ${comparison.categoryCoverage.overlap.length}/${comparison.categoryCoverage.tool1.length}\n\n`;
  }

  return report;
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(arr1: number[], arr2: number[]): number {
  if (arr1.length !== arr2.length || arr1.length === 0) {
    return 0;
  }

  const n = arr1.length;
  const sum1 = arr1.reduce((a, b) => a + b, 0);
  const sum2 = arr2.reduce((a, b) => a + b, 0);
  const sum1Sq = arr1.reduce((a, b) => a + b * b, 0);
  const sum2Sq = arr2.reduce((a, b) => a + b * b, 0);
  const pSum = arr1.reduce((acc, val, i) => acc + val * arr2[i], 0);

  const num = pSum - (sum1 * sum2 / n);
  const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

  return den === 0 ? 0 : num / den;
}

/**
 * Export metrics to CSV format
 */
export function exportMetricsToCSV(metrics: ScanMetrics[]): string {
  const headers = [
    'Scan ID',
    'Target',
    'Mode',
    'Duration (s)',
    'Total Findings',
    'Critical',
    'High',
    'Medium',
    'Low',
    'Info',
    'Score',
    'Risk Level',
  ];

  let csv = headers.join(',') + '\n';

  for (const m of metrics) {
    const row = [
      m.scanId,
      m.target,
      m.mode,
      (m.duration / 1000).toFixed(2),
      m.totalFindings,
      m.criticalFindings,
      m.highFindings,
      m.mediumFindings,
      m.lowFindings,
      m.infoFindings,
      m.score,
      m.riskLevel,
    ];
    csv += row.join(',') + '\n';
  }

  return csv;
}

/**
 * Sample findings for manual validation
 * Returns a stratified random sample across severity levels
 */
export function sampleFindingsForValidation(
  vulnerabilities: Vulnerability[],
  sampleRate = 0.2 // 20% sample
): Vulnerability[] {
  const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
  const sampled: Vulnerability[] = [];

  for (const severity of severities) {
    const severityVulns = vulnerabilities.filter(v => v.severity === severity);
    const sampleSize = Math.ceil(severityVulns.length * sampleRate);

    // Fisher-Yates shuffle
    const shuffled = [...severityVulns];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    sampled.push(...shuffled.slice(0, sampleSize));
  }

  return sampled;
}
