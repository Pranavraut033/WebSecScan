/**
 * JavaScript Static Analyzer
 * 
 * Detects dangerous JavaScript patterns, unsafe APIs, and potential XSS vectors
 * in JavaScript/TypeScript source code through deterministic pattern matching.
 */

import { createVulnerabilityFinding } from '../rules/owaspRules.ts';

export interface JsAnalysisResult {
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
 * Analyze JavaScript/TypeScript code for security vulnerabilities
 */
export async function analyzeJavaScript(
  code: string,
  sourceUrl: string
): Promise<JsAnalysisResult> {
  const vulnerabilities: JsAnalysisResult['vulnerabilities'] = [];

  // Check for eval() usage
  const evalMatches = findEvalUsage(code);
  for (const match of evalMatches) {
    vulnerabilities.push(
      createVulnerabilityFinding(
        'WSS-XSS-003',
        `${sourceUrl} - Line ${match.line}`,
        match.context
      )
    );
  }

  // Check for new Function() usage
  const functionConstructorMatches = findFunctionConstructor(code);
  for (const match of functionConstructorMatches) {
    vulnerabilities.push(
      createVulnerabilityFinding(
        'WSS-XSS-003',
        `${sourceUrl} - Line ${match.line}`,
        match.context,
        'Use of Function() constructor enables arbitrary code execution, similar to eval().'
      )
    );
  }

  // Check for innerHTML usage
  const innerHTMLMatches = findInnerHTMLUsage(code);
  for (const match of innerHTMLMatches) {
    vulnerabilities.push(
      createVulnerabilityFinding(
        'WSS-XSS-002',
        `${sourceUrl} - Line ${match.line}`,
        match.context
      )
    );
  }

  // Check for dangerouslySetInnerHTML (React)
  const dangerouslySetMatches = findDangerouslySetInnerHTML(code);
  for (const match of dangerouslySetMatches) {
    vulnerabilities.push(
      createVulnerabilityFinding(
        'WSS-XSS-002',
        `${sourceUrl} - Line ${match.line}`,
        match.context,
        'React dangerouslySetInnerHTML bypasses XSS protection. Sanitize HTML or use safe alternatives.'
      )
    );
  }

  // Check for hardcoded secrets
  const secretMatches = findHardcodedSecrets(code);
  for (const match of secretMatches) {
    vulnerabilities.push(
      createVulnerabilityFinding(
        'WSS-SEC-006',
        `${sourceUrl} - Line ${match.line}`,
        match.context,
        `Potential ${match.type} hardcoded in source code.`
      )
    );
  }

  return { vulnerabilities };
}

/**
 * Find eval() usage in code
 */
function findEvalUsage(code: string): Array<{ line: number; context: string }> {
  const matches: Array<{ line: number; context: string }> = [];
  const lines = code.split('\n');

  // Regex to detect eval() calls (not in comments)
  const evalPattern = /\beval\s*\(/;

  lines.forEach((line, index) => {
    // Skip comments
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }

    if (evalPattern.test(line)) {
      matches.push({
        line: index + 1,
        context: line.trim()
      });
    }
  });

  return matches;
}

/**
 * Find new Function() constructor usage
 */
function findFunctionConstructor(code: string): Array<{ line: number; context: string }> {
  const matches: Array<{ line: number; context: string }> = [];
  const lines = code.split('\n');

  // Regex to detect new Function() or Function() calls
  const functionPattern = /\bnew\s+Function\s*\(|\bFunction\s*\(/;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }

    if (functionPattern.test(line)) {
      matches.push({
        line: index + 1,
        context: line.trim()
      });
    }
  });

  return matches;
}

/**
 * Find innerHTML usage
 */
function findInnerHTMLUsage(code: string): Array<{ line: number; context: string }> {
  const matches: Array<{ line: number; context: string }> = [];
  const lines = code.split('\n');

  // Regex to detect .innerHTML = assignments
  const innerHTMLPattern = /\.innerHTML\s*=/;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }

    if (innerHTMLPattern.test(line)) {
      matches.push({
        line: index + 1,
        context: line.trim()
      });
    }
  });

  return matches;
}

/**
 * Find dangerouslySetInnerHTML usage in React/JSX
 */
function findDangerouslySetInnerHTML(code: string): Array<{ line: number; context: string }> {
  const matches: Array<{ line: number; context: string }> = [];
  const lines = code.split('\n');

  const dangerousPattern = /dangerouslySetInnerHTML/;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }

    if (dangerousPattern.test(line)) {
      matches.push({
        line: index + 1,
        context: line.trim()
      });
    }
  });

  return matches;
}

/**
 * Find hardcoded secrets and credentials
 * Uses regex patterns to detect common secret patterns
 */
function findHardcodedSecrets(code: string): Array<{ line: number; context: string; type: string }> {
  const matches: Array<{ line: number; context: string; type: string }> = [];
  const lines = code.split('\n');

  // Patterns for common secrets (case-insensitive)
  const secretPatterns = [
    { pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{3,}['"]/, type: 'password' },
    { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{10,}['"]/, type: 'API key' },
    { pattern: /(?:secret[_-]?key|secretkey)\s*[:=]\s*['"][^'"]{10,}['"]/, type: 'secret key' },
    { pattern: /(?:access[_-]?token|accesstoken)\s*[:=]\s*['"][^'"]{10,}['"]/, type: 'access token' },
    { pattern: /(?:private[_-]?key|privatekey)\s*[:=]\s*['"]-----BEGIN/, type: 'private key' },
    { pattern: /(?:aws[_-]?access[_-]?key|aws_secret)\s*[:=]\s*['"][^'"]{10,}['"]/, type: 'AWS credential' },
    { pattern: /(?:db[_-]?password|database[_-]?password)\s*[:=]\s*['"][^'"]{3,}['"]/, type: 'database password' }
  ];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }

    // Skip lines that are clearly placeholder/example values
    if (/(?:your|example|test|dummy|placeholder|xxx)/i.test(line)) {
      return;
    }

    for (const { pattern, type } of secretPatterns) {
      if (pattern.test(line.toLowerCase())) {
        // Redact the actual value in context
        const redactedContext = line.replace(/['"][^'"]+['"]/, "'***REDACTED***'");
        matches.push({
          line: index + 1,
          context: redactedContext,
          type
        });
        break; // Only report one match per line
      }
    }
  });

  return matches;
}
