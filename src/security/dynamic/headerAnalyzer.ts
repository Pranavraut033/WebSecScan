/**
 * Header Analyzer - Analyzes HTTP security headers
 * Checks for presence and proper configuration of security headers
 */

export interface HeaderTestResult {
  testName: string;
  passed: boolean;
  score: number;
  result: 'Passed' | 'Failed' | 'Info' | 'N/A';
  reason: string;
  recommendation?: string;
  details?: Record<string, any>;
}

export interface SecurityHeaders {
  'content-security-policy'?: string;
  'strict-transport-security'?: string;
  'x-frame-options'?: string;
  'x-content-type-options'?: string;
  'referrer-policy'?: string;
  'permissions-policy'?: string;
  'x-xss-protection'?: string;
  [key: string]: string | undefined;
}

export async function analyzeHeaders(
  url: string,
  headers: Record<string, string>
): Promise<HeaderTestResult[]> {
  const results: HeaderTestResult[] = [];
  const normalizedHeaders: SecurityHeaders = {};

  // Normalize header names to lowercase
  Object.keys(headers).forEach((key) => {
    normalizedHeaders[key.toLowerCase()] = headers[key];
  });

  // Check Strict-Transport-Security (HSTS)
  results.push(checkHSTS(normalizedHeaders, url));

  // Check X-Content-Type-Options
  results.push(checkXContentTypeOptions(normalizedHeaders));

  // Check X-Frame-Options
  results.push(checkXFrameOptions(normalizedHeaders));

  // Check Referrer-Policy
  results.push(checkReferrerPolicy(normalizedHeaders));

  // Check X-XSS-Protection (deprecated but still checked)
  results.push(checkXXSSProtection(normalizedHeaders));

  return results;
}

function checkHSTS(headers: SecurityHeaders, url: string): HeaderTestResult {
  const hstsHeader = headers['strict-transport-security'];
  const isHttps = url.startsWith('https://');

  if (!isHttps) {
    return {
      testName: 'Strict Transport Security (HSTS)',
      passed: false,
      score: 0,
      result: 'N/A',
      reason: 'Not able to connect via HTTP, so no redirection necessary.',
      recommendation: 'Ensure site is accessible via HTTPS.',
    };
  }

  if (!hstsHeader) {
    return {
      testName: 'Strict Transport Security (HSTS)',
      passed: false,
      score: -20,
      result: 'Failed',
      reason: 'Strict-Transport-Security header not implemented.',
      recommendation:
        'Add HSTS. Consider rolling out with shorter periods first (as suggested on https://hstspreload.org/).',
    };
  }

  const maxAgeMatch = hstsHeader.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
  const hasIncludeSubDomains = hstsHeader.includes('includeSubDomains');
  const hasPreload = hstsHeader.includes('preload');

  if (maxAge < 15552000) {
    // Less than 6 months
    return {
      testName: 'Strict Transport Security (HSTS)',
      passed: false,
      score: -10,
      result: 'Failed',
      reason: `HSTS max-age is too short (${maxAge} seconds). Should be at least 15552000 (6 months).`,
      recommendation:
        'Increase max-age to at least 15552000 seconds (6 months).',
      details: { maxAge, hasIncludeSubDomains, hasPreload },
    };
  }

  return {
    testName: 'Strict Transport Security (HSTS)',
    passed: true,
    score: 0,
    result: 'Passed',
    reason: `HSTS header properly configured with max-age of ${maxAge} seconds.`,
    details: { maxAge, hasIncludeSubDomains, hasPreload },
  };
}

function checkXContentTypeOptions(headers: SecurityHeaders): HeaderTestResult {
  const header = headers['x-content-type-options'];

  if (!header) {
    return {
      testName: 'X-Content-Type-Options',
      passed: false,
      score: -5,
      result: 'Failed',
      reason: 'X-Content-Type-Options header not implemented.',
      recommendation: 'Set to nosniff.',
    };
  }

  if (header.toLowerCase() === 'nosniff') {
    return {
      testName: 'X-Content-Type-Options',
      passed: true,
      score: 0,
      result: 'Passed',
      reason: 'X-Content-Type-Options header set to nosniff.',
    };
  }

  return {
    testName: 'X-Content-Type-Options',
    passed: false,
    score: -5,
    result: 'Failed',
    reason: `X-Content-Type-Options header set to invalid value: ${header}`,
    recommendation: 'Set to nosniff.',
  };
}

function checkXFrameOptions(headers: SecurityHeaders): HeaderTestResult {
  const header = headers['x-frame-options'];

  if (!header) {
    return {
      testName: 'X-Frame-Options',
      passed: false,
      score: -20,
      result: 'Failed',
      reason: 'X-Frame-Options (XFO) header not implemented.',
      recommendation: 'Set to DENY or SAMEORIGIN.',
    };
  }

  const value = header.toLowerCase();
  if (value === 'deny' || value === 'sameorigin') {
    return {
      testName: 'X-Frame-Options',
      passed: true,
      score: 0,
      result: 'Passed',
      reason: `X-Frame-Options (XFO) header set to ${value.toUpperCase()}.`,
    };
  }

  return {
    testName: 'X-Frame-Options',
    passed: false,
    score: -10,
    result: 'Failed',
    reason: `X-Frame-Options header set to weak value: ${header}`,
    recommendation: 'Set to DENY or SAMEORIGIN.',
  };
}

function checkReferrerPolicy(headers: SecurityHeaders): HeaderTestResult {
  const header = headers['referrer-policy'];

  if (!header) {
    return {
      testName: 'Referrer Policy',
      passed: false,
      score: 0,
      result: 'Info',
      reason: 'Referrer-Policy header not implemented.',
      recommendation: 'Set to strict-origin-when-cross-origin at a minimum.',
    };
  }

  const safeValues = [
    'no-referrer',
    'strict-origin',
    'strict-origin-when-cross-origin',
  ];
  const value = header.toLowerCase();

  if (safeValues.includes(value)) {
    return {
      testName: 'Referrer Policy',
      passed: true,
      score: 5,
      result: 'Passed',
      reason: `Referrer-Policy header set to secure value: ${header}`,
    };
  }

  return {
    testName: 'Referrer Policy',
    passed: false,
    score: -5,
    result: 'Failed',
    reason: `Referrer-Policy header set to weak value: ${header}`,
    recommendation: 'Set to strict-origin-when-cross-origin at a minimum.',
  };
}

function checkXXSSProtection(headers: SecurityHeaders): HeaderTestResult {
  const header = headers['x-xss-protection'];

  if (!header) {
    return {
      testName: 'X-XSS-Protection',
      passed: true,
      score: 0,
      result: 'Info',
      reason:
        'X-XSS-Protection header not set. This is acceptable as the header is deprecated.',
      recommendation:
        'Implement a strong Content Security Policy instead of relying on X-XSS-Protection.',
    };
  }

  // X-XSS-Protection: 0 is actually the recommended value now (disable the feature)
  if (header === '0') {
    return {
      testName: 'X-XSS-Protection',
      passed: true,
      score: 0,
      result: 'Passed',
      reason:
        'X-XSS-Protection header set to 0 (disabled), which is the recommended value.',
    };
  }

  return {
    testName: 'X-XSS-Protection',
    passed: true,
    score: 0,
    result: 'Info',
    reason: `X-XSS-Protection header set to: ${header}. This header is deprecated.`,
    recommendation: 'Consider removing and relying on CSP instead.',
  };
}
