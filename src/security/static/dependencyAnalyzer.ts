/**
 * Dependency Vulnerability Analyzer
 * 
 * Analyzes package.json for known vulnerable dependencies and outdated packages.
 * Uses local vulnerability database for deterministic offline scanning.
 */

import { createVulnerabilityFinding } from '../rules/owaspRules';

export interface DependencyAnalysisResult {
  vulnerabilities: Array<{
    type: string;
    severity: string;
    confidence: string;
    description: string;
    location: string;
    remediation: string;
    owaspCategory?: string;
    owaspId?: string;
    ruleId?: string;
    evidence?: string;
  }>;
}

/**
 * Known vulnerable package versions (curated list for academic demo)
 * In production, this would be loaded from NVD, OSV.dev, or npm audit database
 */
const KNOWN_VULNERABILITIES: Record<string, Array<{
  versions: string[];
  cve?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  fixedIn?: string;
}>> = {
  'lodash': [
    {
      versions: ['< 4.17.21'],
      cve: 'CVE-2021-23337',
      severity: 'HIGH',
      description: 'Command injection vulnerability in lodash',
      fixedIn: '4.17.21'
    }
  ],
  'axios': [
    {
      versions: ['< 0.21.2'],
      cve: 'CVE-2021-3749',
      severity: 'MEDIUM',
      description: 'Server-Side Request Forgery (SSRF) vulnerability',
      fixedIn: '0.21.2'
    }
  ],
  'express': [
    {
      versions: ['< 4.17.3'],
      cve: 'CVE-2022-24999',
      severity: 'MEDIUM',
      description: 'Open redirect vulnerability in express',
      fixedIn: '4.17.3'
    }
  ],
  'next': [
    {
      versions: ['< 12.1.0'],
      cve: 'CVE-2022-23646',
      severity: 'HIGH',
      description: 'Server-Side Request Forgery in Next.js',
      fixedIn: '12.1.0'
    }
  ],
  'react-dom': [
    {
      versions: ['< 16.14.0', '17.0.0 - 17.0.1'],
      cve: 'CVE-2021-23654',
      severity: 'MEDIUM',
      description: 'XSS vulnerability in react-dom',
      fixedIn: '16.14.0, 17.0.2'
    }
  ]
};

/**
 * Package versions that are significantly outdated (for educational purposes)
 */
const OUTDATED_THRESHOLDS: Record<string, { latestMajor: number; warningBelow: number }> = {
  'react': { latestMajor: 18, warningBelow: 17 },
  'next': { latestMajor: 14, warningBelow: 13 },
  'typescript': { latestMajor: 5, warningBelow: 4 },
  'webpack': { latestMajor: 5, warningBelow: 4 }
};

/**
 * Analyze package.json dependencies for vulnerabilities
 */
export async function analyzeDependencies(
  packageJsonContent: string,
  sourceUrl: string
): Promise<DependencyAnalysisResult> {
  const vulnerabilities: DependencyAnalysisResult['vulnerabilities'] = [];

  try {
    const packageJson = JSON.parse(packageJsonContent);
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    // Check each dependency against known vulnerabilities
    for (const [pkgName, versionSpec] of Object.entries(allDeps)) {
      if (typeof versionSpec !== 'string') continue;

      // Check for known vulnerabilities
      const knownVulns = KNOWN_VULNERABILITIES[pkgName];
      if (knownVulns) {
        for (const vuln of knownVulns) {
          if (isVersionVulnerable(versionSpec as string, vuln.versions)) {
            const finding = createVulnerabilityFinding(
              'WSS-DEP-001',
              `${sourceUrl} - package.json`,
              `${pkgName}@${versionSpec}`,
              `${vuln.description}${vuln.cve ? ` (${vuln.cve})` : ''}. Current: ${versionSpec}, Fixed in: ${vuln.fixedIn || 'latest'}`
            );

            // Override severity from vulnerability database
            finding.severity = vuln.severity;

            vulnerabilities.push(finding);
          }
        }
      }

      // Check for outdated major versions
      const outdatedCheck = OUTDATED_THRESHOLDS[pkgName];
      if (outdatedCheck) {
        const majorVersion = extractMajorVersion(versionSpec as string);
        if (majorVersion !== null && majorVersion < outdatedCheck.warningBelow) {
          vulnerabilities.push(
            createVulnerabilityFinding(
              'WSS-DEP-002',
              `${sourceUrl} - package.json`,
              `${pkgName}@${versionSpec}`,
              `Package ${pkgName} is significantly outdated (v${majorVersion} vs v${outdatedCheck.latestMajor} available). May contain unpatched vulnerabilities.`
            )
          );
        }
      }
    }

  } catch (error) {
    // Invalid package.json - not a vulnerability per se, but worth noting
    console.error('Failed to parse package.json:', error);
  }

  return { vulnerabilities };
}

/**
 * Check if a version specification matches vulnerable version patterns
 */
function isVersionVulnerable(versionSpec: string, vulnerablePatterns: string[]): boolean {
  // Remove common prefixes
  const cleanVersion = versionSpec.replace(/^[\^~]/, '');
  const majorVersion = extractMajorVersion(cleanVersion);

  if (majorVersion === null) return false;

  for (const pattern of vulnerablePatterns) {
    // Simple pattern matching (for academic purposes)
    // Real implementation would use semver library

    if (pattern.startsWith('< ')) {
      const thresholdVersion = pattern.substring(2);
      const threshold = extractMajorVersion(thresholdVersion);
      if (threshold !== null && majorVersion < threshold) {
        return true;
      }

      // Also check minor/patch versions
      if (compareVersions(cleanVersion, thresholdVersion) < 0) {
        return true;
      }
    } else if (pattern.includes(' - ')) {
      // Range pattern like "17.0.0 - 17.0.1"
      const [min, max] = pattern.split(' - ').map(v => v.trim());
      if (compareVersions(cleanVersion, min) >= 0 && compareVersions(cleanVersion, max) <= 0) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Extract major version number from version string
 */
function extractMajorVersion(version: string): number | null {
  const match = version.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Simple version comparison (returns -1, 0, or 1)
 * Real implementation would use semver library
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = v2.split('.').map(p => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
}

/**
 * Analyze a remote package.json URL
 */
export async function analyzeDependenciesFromUrl(targetUrl: string): Promise<DependencyAnalysisResult> {
  try {
    // Try common package.json locations
    const possiblePaths = [
      '/package.json',
      '/api/package.json'
    ];

    for (const path of possiblePaths) {
      try {
        const url = new URL(path, targetUrl);
        const response = await fetch(url.toString(), {
          headers: { 'User-Agent': 'WebSecScan/1.0' },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (response.ok) {
          const content = await response.text();
          return await analyzeDependencies(content, url.toString());
        }
      } catch {
        // Continue to next path
        continue;
      }
    }

    // No package.json found - return empty result
    return { vulnerabilities: [] };

  } catch (error) {
    console.error('Dependency analysis error:', error);
    return { vulnerabilities: [] };
  }
}
