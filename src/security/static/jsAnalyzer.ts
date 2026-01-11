/**
 * JavaScript Static Analyzer
 * 
 * Detects dangerous JavaScript patterns, unsafe APIs, and potential XSS vectors
 * in JavaScript/TypeScript source code through deterministic pattern matching.
 * Includes context-aware confidence scoring to reduce false positives from framework code.
 */

import { createVulnerabilityFinding } from '../rules/owaspRules';
import type { Confidence } from '@prisma/client';

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
  codeContext: CodeContext;
}

export interface CodeContext {
  isFramework: boolean;
  isMinified: boolean;
  frameworkName?: string;
  hasCSP: boolean;
}

/**
 * Analyze JavaScript/TypeScript code for security vulnerabilities
 * with context-aware confidence scoring
 */
export async function analyzeJavaScript(
  code: string,
  sourceUrl: string,
  hasCSP: boolean = false
): Promise<JsAnalysisResult> {
  const vulnerabilities: JsAnalysisResult['vulnerabilities'] = [];

  // Analyze code context to adjust confidence scoring
  const context = analyzeCodeContext(code, hasCSP);

  // Check for eval() usage
  const evalMatches = findEvalUsage(code);
  for (const match of evalMatches) {
    const baseVuln = createVulnerabilityFinding(
      'WSS-XSS-003',
      `${sourceUrl} - Line ${match.line}`,
      match.context
    );
    const adjustedConfidence = adjustConfidence(baseVuln.confidence, context, 'eval');

    let description = baseVuln.description;
    if (context.isFramework) {
      description += ` (Found in ${context.frameworkName || 'framework'} code - likely library code)`;
    }
    if (context.isMinified) {
      description += ' (Found in minified code - verify source maps for actual location)';
    }

    vulnerabilities.push({
      ...baseVuln,
      confidence: adjustedConfidence,
      description
    });
  }

  // Check for new Function() usage
  const functionConstructorMatches = findFunctionConstructor(code);
  for (const match of functionConstructorMatches) {
    const baseVuln = createVulnerabilityFinding(
      'WSS-XSS-003',
      `${sourceUrl} - Line ${match.line}`,
      match.context,
      'Use of Function() constructor enables arbitrary code execution, similar to eval().'
    );
    const adjustedConfidence = adjustConfidence(baseVuln.confidence, context, 'Function');

    let description = baseVuln.description;
    if (context.isFramework) {
      description += ` (Found in ${context.frameworkName || 'framework'} code - likely library code)`;
    }
    if (context.isMinified) {
      description += ' (Found in minified code - verify source maps for actual location)';
    }

    vulnerabilities.push({
      ...baseVuln,
      confidence: adjustedConfidence,
      description
    });
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

  return { 
    vulnerabilities,
    codeContext: context
  };
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

/**
 * Analyze code context to determine if it's framework/library code or minified
 */
function analyzeCodeContext(code: string, hasCSP: boolean): CodeContext {
  const context: CodeContext = {
    isFramework: false,
    isMinified: false,
    hasCSP
  };

  // Detect framework signatures
  const frameworkPatterns = [
    { pattern: /@angular\/core|ng-|ngOnInit|@Component|@Injectable/, name: 'Angular' },
    { pattern: /React\.createElement|React\.Component|import.*from.*['"]react['"]/, name: 'React' },
    { pattern: /Vue\.component|createApp|defineComponent|import.*from.*['"]vue['"]/, name: 'Vue' },
    { pattern: /@sveltejs|svelte:component/, name: 'Svelte' },
    { pattern: /jQuery|\$\(|\$\.|\bjQuery\b/, name: 'jQuery' },
    { pattern: /lodash|underscore|_\.map|_\.filter/, name: 'Lodash/Underscore' }
  ];

  for (const { pattern, name } of frameworkPatterns) {
    if (pattern.test(code)) {
      context.isFramework = true;
      context.frameworkName = name;
      break;
    }
  }

  // Detect minified code patterns
  const minifiedIndicators = [
    // Long lines (>500 chars without newlines)
    /^.{500,}$/m,
    // Single-letter variable names in high density (>10 in 100 chars)
    /\b[a-z]\b.*\b[a-z]\b.*\b[a-z]\b.*\b[a-z]\b.*\b[a-z]\b.*\b[a-z]\b.*\b[a-z]\b.*\b[a-z]\b.*\b[a-z]\b.*\b[a-z]\b/,
    // Webpack/Rollup markers
    /\/\*\*\*\*\*\*\*\*\*\*|webpackBootstrap|__webpack_require__|\(function\s*\(modules\)/,
    // UMD pattern (with s flag for multiline)
    /typeof\s+exports[\s\S]*typeof\s+module[\s\S]*typeof\s+define/,
    // Terser/UglifyJS markers
    /!function\s*\(.*\)\{.*\}\s*\(/
  ];

  for (const pattern of minifiedIndicators) {
    if (pattern.test(code)) {
      context.isMinified = true;
      break;
    }
  }

  return context;
}

/**
 * Adjust confidence based on code context
 * Framework/minified code gets downgraded confidence
 * CSP presence can upgrade confidence for some vulnerabilities
 */
function adjustConfidence(
  baseConfidence: Confidence,
  context: CodeContext,
  vulnType: string
): Confidence {
  let confidence: Confidence = baseConfidence;

  // Downgrade if framework or minified code
  if (context.isFramework || context.isMinified) {
    if (baseConfidence === 'HIGH') {
      confidence = 'MEDIUM';
    }
    // MEDIUM stays MEDIUM, LOW stays LOW
  }

  // CSP cross-check for eval-related vulnerabilities
  if ((vulnType === 'eval' || vulnType === 'Function') && context.hasCSP) {
    // If CSP is present and blocks unsafe-eval, downgrade further
    confidence = 'LOW';
  }

  return confidence;
}

/**
 * Detect if code context is framework/library code
 * Exported for testing
 */
export function detectFramework(code: string): { isFramework: boolean; frameworkName?: string } {
  const context = analyzeCodeContext(code, false);
  return {
    isFramework: context.isFramework,
    frameworkName: context.frameworkName
  };
}

/**
 * Detect if code is minified
 * Exported for testing
 */
export function detectMinifiedCode(code: string): boolean {
  const context = analyzeCodeContext(code, false);
  return context.isMinified;
}
