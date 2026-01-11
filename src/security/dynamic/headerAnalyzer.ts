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
  headers: Record<string, string>,
  htmlContent?: string
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

  // Check CORS configuration (OWASP A02:2025 - Security Misconfiguration)
  results.push(checkCORS(normalizedHeaders));

  // Check Permissions-Policy (OWASP A02:2025)
  results.push(checkPermissionsPolicy(normalizedHeaders));

  // Check Spectre mitigation headers (OWASP A02:2025)
  results.push(checkSpectreMitigation(normalizedHeaders));

  // Check for cross-origin script inclusions if HTML provided
  if (htmlContent) {
    results.push(checkCrossOriginScripts(url, htmlContent));
  }

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

/**
 * Check CORS configuration for security issues
 * OWASP A02:2025 - Security Misconfiguration
 */
function checkCORS(headers: SecurityHeaders): HeaderTestResult {
  const acao = headers['access-control-allow-origin'];
  const acac = headers['access-control-allow-credentials'];

  // No CORS headers is actually safe (restrictive)
  if (!acao) {
    return {
      testName: 'CORS Configuration',
      passed: true,
      score: 0,
      result: 'Info',
      reason: 'No CORS headers present. Resources are restricted to same-origin only.',
      recommendation: 'If cross-origin access is needed, configure CORS securely.',
    };
  }

  // Check for dangerous wildcard with credentials
  if (acao === '*' && acac === 'true') {
    return {
      testName: 'CORS Configuration',
      passed: false,
      score: -25,
      result: 'Failed',
      reason: 'CRITICAL: Access-Control-Allow-Origin set to wildcard (*) with credentials enabled. This allows any origin to access sensitive data.',
      recommendation: 'Never use Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true. Specify exact origins instead.',
      details: {
        owaspId: 'A02:2025',
        category: 'Security Misconfiguration',
        acao,
        acac
      }
    };
  }

  // Check for overly permissive wildcard
  if (acao === '*') {
    return {
      testName: 'CORS Configuration',
      passed: false,
      score: -10,
      result: 'Failed',
      reason: 'Access-Control-Allow-Origin set to wildcard (*). Any website can read responses from your API.',
      recommendation: 'Use specific origins instead of wildcard for better security.',
      details: {
        owaspId: 'A02:2025',
        category: 'Security Misconfiguration',
        acao
      }
    };
  }

  // Valid CORS configuration
  return {
    testName: 'CORS Configuration',
    passed: true,
    score: 0,
    result: 'Passed',
    reason: `CORS configured with specific origin: ${acao}`,
    details: { acao, acac }
  };
}

/**
 * Check Permissions-Policy header
 * OWASP A02:2025 - Security Misconfiguration
 */
function checkPermissionsPolicy(headers: SecurityHeaders): HeaderTestResult {
  const permissionsPolicy = headers['permissions-policy'];
  const featurePolicy = headers['feature-policy']; // Deprecated predecessor

  if (!permissionsPolicy && !featurePolicy) {
    return {
      testName: 'Permissions-Policy',
      passed: false,
      score: -5,
      result: 'Failed',
      reason: 'Permissions-Policy header not implemented. Browser features like camera, microphone, and geolocation are not restricted.',
      recommendation: 'Implement Permissions-Policy to control access to sensitive browser features. Example: Permissions-Policy: camera=(), microphone=(), geolocation=()',
      details: {
        owaspId: 'A02:2025',
        category: 'Security Misconfiguration'
      }
    };
  }

  // Parse and check for sensitive features
  const policy = permissionsPolicy || featurePolicy || '';
  const sensitiveFeatures = ['camera', 'microphone', 'geolocation', 'payment', 'usb'];
  const configuredFeatures: string[] = [];
  const unrestrictedFeatures: string[] = [];

  for (const feature of sensitiveFeatures) {
    if (policy.includes(feature)) {
      configuredFeatures.push(feature);
      // Check if feature allows all origins with *
      const featureRegex = new RegExp(`${feature}=\\([^)]*\\*[^)]*\\)`, 'i');
      if (featureRegex.test(policy)) {
        unrestrictedFeatures.push(feature);
      }
    }
  }

  if (unrestrictedFeatures.length > 0) {
    return {
      testName: 'Permissions-Policy',
      passed: false,
      score: -10,
      result: 'Failed',
      reason: `Permissions-Policy allows unrestricted access to sensitive features: ${unrestrictedFeatures.join(', ')}`,
      recommendation: 'Restrict sensitive features to specific origins or disable them entirely with feature=()',
      details: {
        owaspId: 'A02:2025',
        category: 'Security Misconfiguration',
        unrestrictedFeatures,
        configuredFeatures
      }
    };
  }

  return {
    testName: 'Permissions-Policy',
    passed: true,
    score: 5,
    result: 'Passed',
    reason: featurePolicy
      ? `Feature-Policy (deprecated) configured. Consider migrating to Permissions-Policy.`
      : `Permissions-Policy properly configured${configuredFeatures.length > 0 ? ` for: ${configuredFeatures.join(', ')}` : ''}`,
    details: {
      configuredFeatures,
      policy: permissionsPolicy || featurePolicy
    }
  };
}

/**
 * Check Spectre mitigation headers (Cross-Origin-Embedder-Policy, Cross-Origin-Opener-Policy)
 * OWASP A02:2025 - Security Misconfiguration
 */
function checkSpectreMitigation(headers: SecurityHeaders): HeaderTestResult {
  const coep = headers['cross-origin-embedder-policy'];
  const coop = headers['cross-origin-opener-policy'];

  if (!coep && !coop) {
    return {
      testName: 'Spectre Mitigation Headers',
      passed: false,
      score: -5,
      result: 'Failed',
      reason: 'Missing Spectre mitigation headers (COEP, COOP). Site may be vulnerable to side-channel timing attacks.',
      recommendation: 'Implement Cross-Origin-Embedder-Policy: require-corp and Cross-Origin-Opener-Policy: same-origin to enable cross-origin isolation.',
      details: {
        owaspId: 'A02:2025',
        category: 'Security Misconfiguration',
        vulnerability: 'Spectre side-channel attacks'
      }
    };
  }

  const issues: string[] = [];
  const implemented: string[] = [];

  // Check COEP
  if (coep) {
    implemented.push('COEP');
    if (coep !== 'require-corp' && coep !== 'credentialless') {
      issues.push(`COEP has weak value: ${coep}`);
    }
  } else {
    issues.push('Missing Cross-Origin-Embedder-Policy');
  }

  // Check COOP
  if (coop) {
    implemented.push('COOP');
    if (coop !== 'same-origin' && coop !== 'same-origin-allow-popups') {
      issues.push(`COOP has weak value: ${coop}`);
    }
  } else {
    issues.push('Missing Cross-Origin-Opener-Policy');
  }

  if (issues.length > 0) {
    return {
      testName: 'Spectre Mitigation Headers',
      passed: false,
      score: -5,
      result: 'Failed',
      reason: issues.join('. '),
      recommendation: 'Set Cross-Origin-Embedder-Policy: require-corp and Cross-Origin-Opener-Policy: same-origin for full protection.',
      details: {
        owaspId: 'A02:2025',
        category: 'Security Misconfiguration',
        coep,
        coop,
        implemented
      }
    };
  }

  return {
    testName: 'Spectre Mitigation Headers',
    passed: true,
    score: 5,
    result: 'Passed',
    reason: `Spectre mitigation headers properly configured (${implemented.join(', ')})`,
    details: { coep, coop }
  };
}

/**
 * Check for cross-origin script inclusions in HTML
 * OWASP A02:2025 - Security Misconfiguration
 */
function checkCrossOriginScripts(pageUrl: string, htmlContent: string): HeaderTestResult {
  try {
    const pageOrigin = new URL(pageUrl).origin;
    const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
    const matches = [...htmlContent.matchAll(scriptRegex)];

    const externalScripts: string[] = [];
    const cdnScripts: string[] = [];

    for (const match of matches) {
      const src = match[1];

      // Skip relative URLs and data URIs
      if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//')) {
        continue;
      }

      try {
        const scriptUrl = src.startsWith('//') ? `https:${src}` : src;
        const scriptOrigin = new URL(scriptUrl).origin;

        if (scriptOrigin !== pageOrigin) {
          externalScripts.push(scriptUrl);

          // Check if it's a known CDN
          const hostname = new URL(scriptUrl).hostname.toLowerCase();
          if (
            hostname.includes('cdn.') ||
            hostname.includes('cloudflare') ||
            hostname.includes('jsdelivr') ||
            hostname.includes('unpkg') ||
            hostname.includes('googleapis')
          ) {
            cdnScripts.push(scriptUrl);
          }
        }
      } catch {
        // Invalid URL, skip
      }
    }

    if (externalScripts.length === 0) {
      return {
        testName: 'Cross-Origin Script Inclusions',
        passed: true,
        score: 5,
        result: 'Passed',
        reason: 'No external scripts detected. All JavaScript is loaded from same origin.',
        details: {
          owaspId: 'A02:2025',
          category: 'Security Misconfiguration'
        }
      };
    }

    const nonCdnScripts = externalScripts.filter(s => !cdnScripts.includes(s));

    return {
      testName: 'Cross-Origin Script Inclusions',
      passed: false,
      score: -10,
      result: 'Failed',
      reason: `Found ${externalScripts.length} cross-origin script(s). External scripts can execute arbitrary code and access sensitive data.`,
      recommendation: 'Use Subresource Integrity (SRI) for external scripts and implement a strict CSP. Consider hosting critical scripts on your own domain.',
      details: {
        owaspId: 'A02:2025',
        category: 'Security Misconfiguration',
        externalScriptCount: externalScripts.length,
        cdnScriptCount: cdnScripts.length,
        nonCdnScriptCount: nonCdnScripts.length,
        externalScripts: externalScripts.slice(0, 10), // Limit to first 10
        nonCdnScripts: nonCdnScripts.slice(0, 5)
      }
    };
  } catch (error) {
    return {
      testName: 'Cross-Origin Script Inclusions',
      passed: true,
      score: 0,
      result: 'Info',
      reason: 'Could not analyze cross-origin scripts due to parsing error.',
    };
  }
}
