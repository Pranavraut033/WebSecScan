/**
 * Exception Handling Analyzer
 * 
 * Detects mishandling of errors and exceptional conditions (OWASP A10:2025).
 * Checks for:
 * - Stack traces in production responses
 * - Debug mode indicators
 * - Verbose error messages exposing internal state
 * - Fail-open authentication/authorization logic
 * - Uncaught exceptions revealing system information
 * 
 * @see docs/owasp-mapping.md for A10:2025 definition
 */

import { createVulnerabilityFinding } from '../rules/owaspRules';

export interface ExceptionAnalysisResult {
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
 * Patterns that indicate stack traces or debug information in responses
 */
const STACK_TRACE_PATTERNS = [
  /at\s+[\w$.]+\s*\([^)]*:\d+:\d+\)/i,  // JavaScript stack traces
  /File\s+"[^"]+",\s+line\s+\d+/i,      // Python stack traces
  /Exception\s+in\s+thread\s+"[^"]+"/i, // Java exceptions
  /\.java:\d+\)/i,                       // Java stack trace lines
  /\.php\s+on\s+line\s+\d+/i,           // PHP errors
  /\.rb:\d+:in\s+`[^`]+'/i,             // Ruby stack traces
  /Traceback\s+\(most\s+recent\s+call\s+last\)/i, // Python traceback
  /System\.Exception:/i,                 // .NET exceptions
  /Fatal\s+error:/i,                     // PHP fatal errors
  /Uncaught\s+Error:/i,                  // JavaScript errors
  /Internal\s+Server\s+Error.*at\s+line/i // Generic error with line number
];

/**
 * Patterns indicating debug mode or development configuration
 */
const DEBUG_MODE_PATTERNS = [
  /debug\s*[=:]\s*true/i,
  /DEBUG\s*=\s*True/i,
  /development\s*mode/i,
  /env\s*[=:]\s*['"]?development/i,
  /NODE_ENV\s*=\s*['"]?development/i,
  /__ENV__\s*=\s*['"]?dev/i,
  /RAILS_ENV\s*=\s*development/i,
  /APP_DEBUG\s*=\s*true/i,
  /<!--.*DEBUG.*-->/i,
  /console\.log\(/i  // Production code shouldn't have console.log
];

/**
 * Patterns revealing sensitive internal information in errors
 */
const SENSITIVE_ERROR_PATTERNS = [
  /database\s+connection\s+failed.*host.*port/i,
  /mysql.*access\s+denied\s+for\s+user/i,
  /postgresql.*password\s+authentication\s+failed/i,
  /redis.*connection\s+refused/i,
  /mongodb.*authentication\s+failed/i,
  /sql\s+syntax.*near/i,
  /file\s+not\s+found.*\/usr\/|\/var\/|\/etc\//i, // Exposes server paths
  /permission\s+denied.*\/home\/|\/root\//i,
  /class\s+['"][\w.]+['"]\s+not\s+found/i, // Internal class names
  /undefined\s+method.*for\s+#<[\w:]+:/i
];

/**
 * Analyze HTTP response for exception handling vulnerabilities
 */
export async function analyzeExceptionHandling(
  url: string,
  responseBody: string,
  statusCode: number
): Promise<ExceptionAnalysisResult> {
  const vulnerabilities: ExceptionAnalysisResult['vulnerabilities'] = [];

  // Check for stack traces
  for (const pattern of STACK_TRACE_PATTERNS) {
    if (pattern.test(responseBody)) {
      const match = responseBody.match(pattern);
      vulnerabilities.push(
        createVulnerabilityFinding(
          'WSS-EXC-001',
          url,
          match?.[0].substring(0, 200) // First 200 chars of stack trace
        )
      );
      break; // One finding per URL
    }
  }

  // Check for debug mode indicators
  for (const pattern of DEBUG_MODE_PATTERNS) {
    if (pattern.test(responseBody)) {
      const match = responseBody.match(pattern);
      vulnerabilities.push(
        createVulnerabilityFinding(
          'WSS-EXC-002',
          url,
          match?.[0]
        )
      );
      break;
    }
  }

  // Check for sensitive error messages
  for (const pattern of SENSITIVE_ERROR_PATTERNS) {
    if (pattern.test(responseBody)) {
      const match = responseBody.match(pattern);
      vulnerabilities.push(
        createVulnerabilityFinding(
          'WSS-EXC-003',
          url,
          match?.[0].substring(0, 150)
        )
      );
      break;
    }
  }

  // Check for 500-series errors with detailed messages
  if (statusCode >= 500 && statusCode < 600) {
    // If response is > 1KB and contains technical details, it's likely verbose
    if (responseBody.length > 1024) {
      const hasTechnicalTerms =
        /class|function|method|variable|exception|error|stack/i.test(responseBody);

      if (hasTechnicalTerms) {
        vulnerabilities.push(
          createVulnerabilityFinding(
            'WSS-EXC-004',
            url,
            `HTTP ${statusCode} with ${responseBody.length} bytes of technical details`
          )
        );
      }
    }
  }

  return { vulnerabilities };
}

/**
 * Analyze JavaScript code for unhandled exceptions
 */
export async function analyzeUnhandledExceptions(
  code: string,
  sourceUrl: string
): Promise<ExceptionAnalysisResult> {
  const vulnerabilities: ExceptionAnalysisResult['vulnerabilities'] = [];

  // Check for try-catch blocks without error handling
  const tryBlocks = code.match(/try\s*{[^}]*}\s*catch\s*\([^)]*\)\s*{([^}]*)}/g);

  if (tryBlocks) {
    for (const block of tryBlocks) {
      const catchBody = block.match(/catch\s*\([^)]*\)\s*{([^}]*)}/)?.[1];

      // Empty catch block (swallows exception)
      if (catchBody && catchBody.trim().length === 0) {
        vulnerabilities.push(
          createVulnerabilityFinding(
            'WSS-EXC-005',
            sourceUrl,
            block.substring(0, 100)
          )
        );
      }

      // Catch block that only logs (fail-open)
      if (catchBody && /console\.(log|error|warn)/.test(catchBody) && catchBody.split('\n').length <= 2) {
        vulnerabilities.push(
          createVulnerabilityFinding(
            'WSS-EXC-006',
            sourceUrl,
            block.substring(0, 100),
            'Catch block only logs error without proper handling - may fail open.'
          )
        );
      }
    }
  }

  return { vulnerabilities };
}

/**
 * Check HTML response for error disclosure in production
 */
export async function analyzeHTMLErrorDisclosure(
  html: string,
  url: string
): Promise<ExceptionAnalysisResult> {
  const vulnerabilities: ExceptionAnalysisResult['vulnerabilities'] = [];

  // Check for common error page patterns with technical details
  const errorPageIndicators = [
    /<title>[^<]*error[^<]*<\/title>/i,
    /<h1>[^<]*(error|exception|failed)[^<]*<\/h1>/i
  ];

  const hasErrorPage = errorPageIndicators.some(pattern => pattern.test(html));

  if (hasErrorPage) {
    // Check if error page contains sensitive information
    const hasSensitiveInfo =
      /database|connection|query|sql|stack|trace|exception|path|file/i.test(html);

    if (hasSensitiveInfo) {
      vulnerabilities.push(
        createVulnerabilityFinding(
          'WSS-EXC-007',
          url,
          html.substring(0, 500),
          'Custom error page discloses technical details that could aid attackers.'
        )
      );
    }
  }

  return { vulnerabilities };
}
