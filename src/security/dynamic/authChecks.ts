/**
 * Authentication & Security Checks
 * 
 * Performs safe, non-invasive checks for authentication and session
 * management issues, security headers, and cookie configurations.
 */

import { chromium, Browser } from 'playwright';
import { createVulnerabilityFinding } from '../rules/owaspRules';

export interface AuthCheckResult {
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
  headers: Record<string, string>;
}

/**
 * Perform comprehensive authentication and security header checks
 */
export async function performAuthChecks(targetUrl: string): Promise<AuthCheckResult> {
  const vulnerabilities: AuthCheckResult['vulnerabilities'] = [];
  let headers: Record<string, string> = {};
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      userAgent: 'WebSecScan/1.0 (Educational Security Scanner)',
      ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    // Capture response headers
    let responseHeaders: Record<string, string> = {};
    page.on('response', async (response) => {
      if (response.url() === targetUrl) {
        const hdrs = await response.allHeaders();
        responseHeaders = hdrs;
      }
    });

    // Navigate to target
    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    headers = responseHeaders;

    // Check security headers
    const headerChecks = checkSecurityHeaders(responseHeaders, targetUrl);
    vulnerabilities.push(...headerChecks);

    // Check cookies
    const cookies = await context.cookies();
    const cookieChecks = checkCookieSecurity(cookies, targetUrl);
    vulnerabilities.push(...cookieChecks);

    // Check for mixed content
    const mixedContentChecks = await checkMixedContent(page, targetUrl);
    vulnerabilities.push(...mixedContentChecks);

    await context.close();

  } catch (error) {
    console.error('Auth checks error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return { vulnerabilities, headers };
}

/**
 * Check for missing or misconfigured security headers
 */
function checkSecurityHeaders(
  headers: Record<string, string>,
  targetUrl: string
): AuthCheckResult['vulnerabilities'] {
  const vulnerabilities: AuthCheckResult['vulnerabilities'] = [];
  const url = new URL(targetUrl);

  // Normalize header keys to lowercase
  const normalizedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalizedHeaders[key.toLowerCase()] = value;
  }

  // Check X-Frame-Options
  if (!normalizedHeaders['x-frame-options']) {
    vulnerabilities.push(
      createVulnerabilityFinding(
        'WSS-SEC-003',
        targetUrl,
        'X-Frame-Options header not found'
      )
    );
  }

  // Check X-Content-Type-Options
  if (!normalizedHeaders['x-content-type-options']) {
    vulnerabilities.push(
      createVulnerabilityFinding(
        'WSS-SEC-004',
        targetUrl,
        'X-Content-Type-Options header not found'
      )
    );
  }

  // Check Strict-Transport-Security (only for HTTPS)
  if (url.protocol === 'https:' && !normalizedHeaders['strict-transport-security']) {
    vulnerabilities.push(
      createVulnerabilityFinding(
        'WSS-SEC-005',
        targetUrl,
        'HSTS header not found on HTTPS site'
      )
    );
  }

  // Note: CSP checking is handled by the dedicated cspAnalyzer module
  // to avoid duplicate findings and provide comprehensive CSP analysis

  // Check X-XSS-Protection (deprecated but still informational)
  const xssProtection = normalizedHeaders['x-xss-protection'];
  if (xssProtection === '0') {
    vulnerabilities.push(
      createVulnerabilityFinding(
        'WSS-SEC-002',
        targetUrl,
        'X-XSS-Protection is disabled',
        'X-XSS-Protection header is set to 0, disabling browser XSS filtering. While deprecated in favor of CSP, this reduces defense-in-depth.'
      )
    );
  }

  return vulnerabilities;
}

/**
 * Check cookie security attributes
 */
function checkCookieSecurity(
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
  }>,
  targetUrl: string
): AuthCheckResult['vulnerabilities'] {
  const vulnerabilities: AuthCheckResult['vulnerabilities'] = [];

  for (const cookie of cookies) {
    const location = `${targetUrl} - Cookie: ${cookie.name}`;

    // Check Secure flag
    if (!cookie.secure) {
      vulnerabilities.push(
        createVulnerabilityFinding(
          'WSS-AUTH-001',
          location,
          `Cookie '${cookie.name}' lacks Secure flag`
        )
      );
    }

    // Check HttpOnly flag (important for session cookies)
    const isSessionCookie = cookie.name.toLowerCase().includes('session') ||
      cookie.name.toLowerCase().includes('token') ||
      cookie.name.toLowerCase().includes('auth');

    if (isSessionCookie && !cookie.httpOnly) {
      vulnerabilities.push(
        createVulnerabilityFinding(
          'WSS-AUTH-002',
          location,
          `Session cookie '${cookie.name}' lacks HttpOnly flag`
        )
      );
    }

    // Check SameSite attribute
    if (!cookie.sameSite || cookie.sameSite === 'None') {
      vulnerabilities.push(
        createVulnerabilityFinding(
          'WSS-AUTH-003',
          location,
          `Cookie '${cookie.name}' lacks proper SameSite attribute (current: ${cookie.sameSite || 'not set'})`
        )
      );
    }
  }

  return vulnerabilities;
}

/**
 * Check for mixed content issues (HTTP resources on HTTPS pages)
 */
async function checkMixedContent(
  page: any,
  targetUrl: string
): Promise<AuthCheckResult['vulnerabilities']> {
  const vulnerabilities: AuthCheckResult['vulnerabilities'] = [];

  try {
    const url = new URL(targetUrl);

    // Only check for HTTPS pages
    if (url.protocol !== 'https:') {
      return vulnerabilities;
    }

    // Get all resource URLs from the page
    const resources = await page.evaluate(() => {
      const urls: string[] = [];

      // Check scripts
      document.querySelectorAll('script[src]').forEach((el: Element) => {
        const src = el.getAttribute('src');
        if (src) urls.push(src);
      });

      // Check stylesheets
      document.querySelectorAll('link[rel="stylesheet"]').forEach((el: Element) => {
        const href = el.getAttribute('href');
        if (href) urls.push(href);
      });

      // Check images
      document.querySelectorAll('img[src]').forEach((el: Element) => {
        const src = el.getAttribute('src');
        if (src) urls.push(src);
      });

      return urls;
    });

    // Check for HTTP resources
    const httpResources = resources.filter((resource: string) => {
      try {
        const resourceUrl = new URL(resource, targetUrl);
        return resourceUrl.protocol === 'http:';
      } catch {
        return false;
      }
    });

    if (httpResources.length > 0) {
      vulnerabilities.push(
        createVulnerabilityFinding(
          'WSS-SEC-005',
          targetUrl,
          `${httpResources.length} HTTP resource(s) loaded on HTTPS page: ${httpResources.slice(0, 3).join(', ')}`,
          'Mixed content detected: HTTP resources loaded on HTTPS page can be intercepted. Use HTTPS for all resources.'
        )
      );
    }

  } catch (error) {
    console.error('Mixed content check error:', error);
  }

  return vulnerabilities;
}

/**
 * Check for common authentication weaknesses
 */
export async function checkAuthWeaknesses(targetUrl: string): Promise<AuthCheckResult['vulnerabilities']> {
  const vulnerabilities: AuthCheckResult['vulnerabilities'] = [];
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

    // Check for login forms
    const loginForms = await page.$$('form').then(async (forms) => {
      const loginRelated = [];
      for (const form of forms) {
        const html = await form.innerHTML();
        if (
          html.toLowerCase().includes('password') ||
          html.toLowerCase().includes('login') ||
          html.toLowerCase().includes('signin')
        ) {
          loginRelated.push(form);
        }
      }
      return loginRelated;
    });

    // Check if login form uses HTTPS
    const currentUrl = page.url();
    if (loginForms.length > 0 && !currentUrl.startsWith('https://')) {
      vulnerabilities.push(
        createVulnerabilityFinding(
          'WSS-FORM-002',
          currentUrl,
          'Login form found on non-HTTPS page',
          'Authentication forms must use HTTPS to protect credentials during transmission.'
        )
      );
    }

    await context.close();

  } catch (error) {
    console.error('Auth weakness check error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return vulnerabilities;
}
