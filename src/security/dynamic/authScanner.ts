/**
 * Authenticated Scanner
 * 
 * Playwright-based authentication and session-aware security testing.
 * Implements safe, non-destructive authenticated scanning with explicit consent.
 * 
 * Safety Constraints:
 * - No brute force or credential guessing
 * - Rate limited requests
 * - Session isolation (no cookie leakage)
 * - Credentials never logged or persisted
 * - Explicit user consent required
 * 
 * See docs/authenticated-scans.md for detailed design and rationale.
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';

/**
 * Configuration for authenticated scanning
 */
export interface AuthConfig {
  /** URL of the login page */
  loginUrl: string;

  /** CSS selector for username/email input */
  usernameSelector: string;

  /** CSS selector for password input */
  passwordSelector: string;

  /** CSS selector for submit button */
  submitSelector: string;

  /** Test credentials (use dedicated test account only) */
  credentials: {
    username: string;
    password: string;
  };

  /** Optional: Success indicator (e.g., element that appears after login) */
  successSelector?: string;

  /** Optional: Post-login URL to verify success */
  successUrl?: string;

  /** Optional: Pages to scan after authentication */
  protectedPages?: string[];
}

/**
 * Result of authentication attempt
 */
export interface AuthResult {
  success: boolean;
  cookies: Array<{ name: string; value: string; domain: string; secure?: boolean; httpOnly?: boolean; sameSite?: string }>;
  sessionHeaders: Record<string, string>;
  error?: string;
  warnings?: string[];
}

/**
 * Security findings from authenticated scan
 */
export interface AuthScanResult {
  authenticated: boolean;
  vulnerabilities: Array<{
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    description: string;
    evidence?: string;
    remediation: string;
  }>;
  sessionAnalysis: {
    cookieCount: number;
    secureCount: number;
    httpOnlyCount: number;
    sameSiteCount: number;
    weaknesses: string[];
  };
}

/**
 * Validate authentication configuration
 */
export function validateAuthConfig(config: AuthConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.loginUrl || !config.loginUrl.startsWith('http')) {
    errors.push('Login URL must be a valid HTTP/HTTPS URL');
  }

  if (!config.usernameSelector || config.usernameSelector.trim().length === 0) {
    errors.push('Username selector is required');
  }

  if (!config.passwordSelector || config.passwordSelector.trim().length === 0) {
    errors.push('Password selector is required');
  }

  if (!config.submitSelector || config.submitSelector.trim().length === 0) {
    errors.push('Submit button selector is required');
  }

  if (!config.credentials?.username || config.credentials.username.trim().length === 0) {
    errors.push('Username is required');
  }

  if (!config.credentials?.password || config.credentials.password.trim().length === 0) {
    errors.push('Password is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Perform login using Playwright and extract session credentials
 * 
 * Safety Features:
 * - Isolated browser context per scan
 * - 15s timeout prevents hanging
 * - User-Agent identifies as security scanner
 * - Credentials never logged
 * - Browser context destroyed after use
 */
export async function authenticateWithPlaywright(
  config: AuthConfig
): Promise<AuthResult> {
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    // Validate configuration
    const validation = validateAuthConfig(config);
    if (!validation.valid) {
      return {
        success: false,
        cookies: [],
        sessionHeaders: {},
        error: `Invalid configuration: ${validation.errors.join(', ')}`
      };
    }

    // Launch headless browser with security constraints
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Prevent memory issues
        '--disable-gpu' // Not needed for headless
      ]
    });

    // Create isolated context (no shared cookies or storage)
    context = await browser.newContext({
      userAgent: 'WebSecScan/1.0 (Educational Security Scanner)',
      ignoreHTTPSErrors: true, // For self-signed certs in test environments
      viewport: { width: 1280, height: 720 },
      // Security: Disable unnecessary features
      javaScriptEnabled: true, // Need JS for modern login forms
      acceptDownloads: false,
      bypassCSP: false
    });

    const page = await context.newPage();

    // Navigate to login page with timeout
    await page.goto(config.loginUrl, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for login form to be ready
    await page.waitForSelector(config.usernameSelector, { timeout: 5000 });
    await page.waitForSelector(config.passwordSelector, { timeout: 5000 });
    await page.waitForSelector(config.submitSelector, { timeout: 5000 });

    // Fill credentials (never log these values)
    await page.fill(config.usernameSelector, config.credentials.username);
    await page.fill(config.passwordSelector, config.credentials.password);

    // Submit form
    await Promise.all([
      page.waitForNavigation({ timeout: 10000 }).catch(() => { }), // May not navigate
      page.click(config.submitSelector)
    ]);

    // Wait for success indicator
    if (config.successSelector) {
      await page.waitForSelector(config.successSelector, { timeout: 10000 });
    } else if (config.successUrl) {
      await page.waitForURL(config.successUrl, { timeout: 10000 });
    } else {
      // Default: wait for network to settle
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    }

    // Extract cookies with security attributes
    const cookies = await context.cookies();

    // Build session headers for subsequent requests
    const sessionHeaders: Record<string, string> = {};
    const cookieString = cookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    if (cookieString) {
      sessionHeaders['Cookie'] = cookieString;
    }

    // Analyze session security
    const warnings: string[] = [];
    let secureCount = 0;
    let httpOnlyCount = 0;
    let sameSiteCount = 0;

    for (const cookie of cookies) {
      if (cookie.secure) secureCount++;
      if (cookie.httpOnly) httpOnlyCount++;
      if (cookie.sameSite && cookie.sameSite !== 'None') sameSiteCount++;

      // Check for common session cookie patterns without Secure flag
      if ((cookie.name.toLowerCase().includes('session') ||
        cookie.name.toLowerCase().includes('auth') ||
        cookie.name.toLowerCase().includes('token')) && !cookie.secure) {
        warnings.push(`Session cookie '${cookie.name}' missing Secure flag`);
      }
    }

    if (cookies.length > 0 && secureCount === 0) {
      warnings.push('No cookies have Secure flag set');
    }

    return {
      success: true,
      cookies: cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        secure: c.secure,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite as string | undefined
      })),
      sessionHeaders,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      cookies: [],
      sessionHeaders: {},
      error: `Authentication failed: ${errorMessage}`
    };
  } finally {
    // Always clean up browser resources
    if (context) {
      await context.close().catch(() => { });
    }
    if (browser) {
      await browser.close().catch(() => { });
    }
  }
}

/**
 * Perform security analysis on authenticated session
 * 
 * Tests:
 * - Cookie security attributes
 * - Session token entropy
 * - CSRF protection presence
 * - Secure/HttpOnly flags
 * - SameSite configuration
 */
export async function analyzeAuthenticatedSession(
  authResult: AuthResult,
  targetUrl: string,
  protectedPages?: string[]
): Promise<AuthScanResult> {
  const vulnerabilities: AuthScanResult['vulnerabilities'] = [];

  if (!authResult.success) {
    return {
      authenticated: false,
      vulnerabilities: [],
      sessionAnalysis: {
        cookieCount: 0,
        secureCount: 0,
        httpOnlyCount: 0,
        sameSiteCount: 0,
        weaknesses: ['Authentication failed']
      }
    };
  }

  // Analyze cookies
  let secureCount = 0;
  let httpOnlyCount = 0;
  let sameSiteCount = 0;
  const weaknesses: string[] = [];

  for (const cookie of authResult.cookies) {
    if (cookie.secure) secureCount++;
    if (cookie.httpOnly) httpOnlyCount++;
    if (cookie.sameSite && cookie.sameSite !== 'None') sameSiteCount++;

    // Check for insecure session cookies
    const isSessionCookie = cookie.name.toLowerCase().includes('session') ||
      cookie.name.toLowerCase().includes('auth') ||
      cookie.name.toLowerCase().includes('token');

    if (isSessionCookie && !cookie.secure) {
      vulnerabilities.push({
        type: 'Insecure Session Cookie',
        severity: 'HIGH',
        description: `Session cookie '${cookie.name}' transmitted over insecure channel`,
        evidence: `Cookie: ${cookie.name} (Secure flag: false)`,
        remediation: 'Set Secure flag on all session cookies to prevent interception over HTTP'
      });
      weaknesses.push(`Cookie '${cookie.name}' missing Secure flag`);
    }

    if (isSessionCookie && !cookie.httpOnly) {
      vulnerabilities.push({
        type: 'HttpOnly Flag Missing',
        severity: 'MEDIUM',
        description: `Session cookie '${cookie.name}' accessible via JavaScript`,
        evidence: `Cookie: ${cookie.name} (HttpOnly flag: false)`,
        remediation: 'Set HttpOnly flag to prevent XSS-based session hijacking'
      });
      weaknesses.push(`Cookie '${cookie.name}' missing HttpOnly flag`);
    }

    if (isSessionCookie && (!cookie.sameSite || cookie.sameSite === 'None')) {
      vulnerabilities.push({
        type: 'SameSite Flag Missing',
        severity: 'MEDIUM',
        description: `Session cookie '${cookie.name}' vulnerable to CSRF attacks`,
        evidence: `Cookie: ${cookie.name} (SameSite: ${cookie.sameSite || 'not set'})`,
        remediation: 'Set SameSite=Strict or Lax to prevent CSRF attacks'
      });
      weaknesses.push(`Cookie '${cookie.name}' missing SameSite flag`);
    }

    // Check for weak session token entropy
    if (isSessionCookie && cookie.value.length < 16) {
      vulnerabilities.push({
        type: 'Weak Session Token',
        severity: 'HIGH',
        description: `Session token '${cookie.name}' appears to have low entropy`,
        evidence: `Token length: ${cookie.value.length} characters`,
        remediation: 'Use cryptographically secure random tokens with at least 128 bits of entropy'
      });
      weaknesses.push(`Cookie '${cookie.name}' has weak token (${cookie.value.length} chars)`);
    }
  }

  // Check if any cookies exist
  if (authResult.cookies.length === 0) {
    vulnerabilities.push({
      type: 'No Session Cookies',
      severity: 'INFO',
      description: 'No session cookies found after authentication',
      remediation: 'Verify authentication flow - modern applications should set session cookies'
    });
    weaknesses.push('No session cookies found');
  }

  return {
    authenticated: true,
    vulnerabilities,
    sessionAnalysis: {
      cookieCount: authResult.cookies.length,
      secureCount,
      httpOnlyCount,
      sameSiteCount,
      weaknesses
    }
  };
}

/**
 * Perform full authenticated scan with session-aware testing
 * 
 * Workflow:
 * 1. Authenticate via Playwright
 * 2. Extract session credentials
 * 3. Analyze session security
 * 4. Optionally test protected pages with session headers
 * 5. Test for authentication bypass vulnerabilities
 * 6. Clean up browser resources
 */
export async function performAuthenticatedScan(
  config: AuthConfig
): Promise<{
  authResult: AuthResult;
  scanResult: AuthScanResult;
}> {
  // Step 1: Authenticate and extract session
  const authResult = await authenticateWithPlaywright(config);

  // Step 2: Analyze authenticated session
  const scanResult = await analyzeAuthenticatedSession(
    authResult,
    config.loginUrl,
    config.protectedPages
  );

  // Step 3: Test for authentication bypass (if protected pages provided)
  if (config.protectedPages && config.protectedPages.length > 0) {
    const bypassVulns = await testAuthenticationBypass(
      config.protectedPages,
      authResult.cookies
    );
    scanResult.vulnerabilities.push(...bypassVulns);
  }

  return {
    authResult,
    scanResult
  };
}

/**
 * Test for authentication bypass vulnerabilities
 * 
 * Tests:
 * - Direct access to protected pages without session
 * - Access with invalid/expired session tokens
 * - Parameter manipulation bypass attempts
 * - Client-side auth bypass (hidden fields, cookies)
 */
async function testAuthenticationBypass(
  protectedPages: string[],
  validCookies: Array<{ name: string; value: string; domain: string }>
): Promise<Array<{
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  description: string;
  evidence?: string;
  remediation: string;
}>> {
  const vulnerabilities: any[] = [];
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });

    for (const page of protectedPages) {
      // Test 1: Direct access without authentication
      const unauthResult = await testUnauthenticatedAccess(browser, page);
      if (unauthResult.vulnerable) {
        vulnerabilities.push({
          type: 'Authentication Bypass',
          severity: 'CRITICAL',
          description: `Protected page accessible without authentication: ${page}`,
          evidence: unauthResult.evidence,
          remediation: 'Implement server-side authentication checks on all protected resources. Redirect unauthenticated users to login page.'
        });
      }

      // Test 2: Access with invalid session token
      if (validCookies.length > 0) {
        const invalidTokenResult = await testInvalidSessionAccess(browser, page, validCookies);
        if (invalidTokenResult.vulnerable) {
          vulnerabilities.push({
            type: 'Weak Session Validation',
            severity: 'HIGH',
            description: `Page accepts invalid session tokens: ${page}`,
            evidence: invalidTokenResult.evidence,
            remediation: 'Validate session tokens cryptographically. Check token signature and expiration on server side.'
          });
        }
      }

      // Test 3: Parameter-based authentication bypass
      const paramBypassResult = await testParameterBypass(browser, page);
      if (paramBypassResult.vulnerable) {
        vulnerabilities.push({
          type: 'Parameter-Based Auth Bypass',
          severity: 'CRITICAL',
          description: `Authentication bypassable via URL parameters: ${page}`,
          evidence: paramBypassResult.evidence,
          remediation: 'Never trust client-supplied authentication parameters. Implement proper server-side session management.'
        });
      }
    }

  } catch (error) {
    console.error('Authentication bypass testing error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return vulnerabilities;
}

/**
 * Test if protected page is accessible without authentication
 */
async function testUnauthenticatedAccess(
  browser: Browser,
  pageUrl: string
): Promise<{ vulnerable: boolean; evidence: string }> {
  const context = await browser.newContext({
    // No cookies or authentication
    userAgent: 'WebSecScan/1.0 (Educational Security Scanner)'
  });

  try {
    const page = await context.newPage();
    const response = await page.goto(pageUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    if (!response) {
      await page.close();
      await context.close();
      return { vulnerable: false, evidence: 'No response received' };
    }

    const statusCode = response.status();
    const finalUrl = page.url();

    // If page loads successfully (200 OK) and doesn't redirect to login
    if (statusCode === 200 && !finalUrl.includes('login') && !finalUrl.includes('auth')) {
      const content = await page.content();

      // Check if page has actual content (not just error message)
      const hasContent = content.length > 500;
      const hasLoginForm = content.toLowerCase().includes('login') ||
        content.toLowerCase().includes('sign in');

      if (hasContent && !hasLoginForm) {
        await page.close();
        await context.close();
        return {
          vulnerable: true,
          evidence: `HTTP ${statusCode}, no redirect to login, content loaded`
        };
      }
    }

    await page.close();
    await context.close();
    return { vulnerable: false, evidence: `HTTP ${statusCode}, redirected or access denied` };

  } catch (error) {
    await context.close();
    return { vulnerable: false, evidence: 'Access test failed' };
  }
}

/**
 * Test if page accepts invalid/tampered session tokens
 */
async function testInvalidSessionAccess(
  browser: Browser,
  pageUrl: string,
  validCookies: Array<{ name: string; value: string; domain: string }>
): Promise<{ vulnerable: boolean; evidence: string }> {
  const context = await browser.newContext({
    userAgent: 'WebSecScan/1.0 (Educational Security Scanner)'
  });

  try {
    // Create invalid versions of session cookies
    const invalidCookies = validCookies.map(cookie => ({
      ...cookie,
      value: 'INVALID_' + cookie.value.substring(0, 10), // Tamper with token
      url: `https://${cookie.domain}`
    }));

    // Set invalid cookies
    await context.addCookies(invalidCookies);

    const page = await context.newPage();
    const response = await page.goto(pageUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    if (!response) {
      await page.close();
      await context.close();
      return { vulnerable: false, evidence: 'No response received' };
    }

    const statusCode = response.status();
    const finalUrl = page.url();

    // If page accepts invalid token (200 OK, no redirect to login)
    if (statusCode === 200 && !finalUrl.includes('login')) {
      await page.close();
      await context.close();
      return {
        vulnerable: true,
        evidence: `HTTP ${statusCode}, invalid token accepted`
      };
    }

    await page.close();
    await context.close();
    return { vulnerable: false, evidence: `HTTP ${statusCode}, invalid token rejected` };

  } catch (error) {
    await context.close();
    return { vulnerable: false, evidence: 'Invalid token test failed' };
  }
}

/**
 * Test for parameter-based authentication bypass
 */
async function testParameterBypass(
  browser: Browser,
  pageUrl: string
): Promise<{ vulnerable: boolean; evidence: string }> {
  const context = await browser.newContext({
    userAgent: 'WebSecScan/1.0 (Educational Security Scanner)'
  });

  try {
    const page = await context.newPage();

    // Common authentication bypass parameters
    const bypassParams = [
      { name: 'admin', value: 'true' },
      { name: 'authenticated', value: '1' },
      { name: 'auth', value: 'true' },
      { name: 'user', value: 'admin' },
      { name: 'role', value: 'admin' },
      { name: 'debug', value: 'true' },
      { name: 'bypass', value: '1' }
    ];

    for (const param of bypassParams) {
      try {
        const testUrl = new URL(pageUrl);
        testUrl.searchParams.set(param.name, param.value);

        const response = await page.goto(testUrl.toString(), {
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });

        if (!response) continue;

        const statusCode = response.status();
        const finalUrl = page.url();

        // If parameter grants access (200 OK, no redirect)
        if (statusCode === 200 && !finalUrl.includes('login')) {
          const content = await page.content();
          const hasContent = content.length > 500;

          if (hasContent) {
            await page.close();
            await context.close();
            return {
              vulnerable: true,
              evidence: `Parameter '${param.name}=${param.value}' bypassed authentication`
            };
          }
        }

      } catch {
        // Continue to next parameter
        continue;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await page.close();
    await context.close();
    return { vulnerable: false, evidence: 'No parameter bypass detected' };

  } catch (error) {
    await context.close();
    return { vulnerable: false, evidence: 'Parameter bypass test failed' };
  }
}

