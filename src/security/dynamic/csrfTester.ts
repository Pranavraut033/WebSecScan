/**
 * CSRF Protection Tester
 * 
 * Tests for Cross-Site Request Forgery protection mechanisms including
 * CSRF tokens, SameSite cookies, and custom headers.
 * 
 * Safety Constraints:
 * - No actual CSRF attacks performed
 * - Only detection of missing protections
 * - Read-only analysis
 */

import { chromium, Browser } from 'playwright';
import { createVulnerabilityFinding } from '../rules/owaspRules';

export interface CsrfTestResult {
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
  formsAnalyzed: number;
  formsWithTokens: number;
  formsWithoutTokens: number;
}

/**
 * Common CSRF token field names
 */
const CSRF_TOKEN_PATTERNS = [
  /csrf[_-]?token/i,
  /xsrf[_-]?token/i,
  /_csrf/i,
  /authenticity[_-]?token/i,
  /anti[_-]?forgery/i,
  /__requestverificationtoken/i,
  /csrfmiddlewaretoken/i,
  /token/i
];

/**
 * Test forms for CSRF protection
 */
export async function testCsrfProtection(
  targetUrl: string,
  forms: Array<{ url: string; method: string; action: string }> = []
): Promise<CsrfTestResult> {
  const vulnerabilities: CsrfTestResult['vulnerabilities'] = [];
  let browser: Browser | null = null;
  let formsAnalyzed = 0;
  let formsWithTokens = 0;
  let formsWithoutTokens = 0;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      userAgent: 'WebSecScan/1.0 (Educational Security Scanner)',
      ignoreHTTPSErrors: true
    });

    // If forms weren't provided, discover them
    if (forms.length === 0) {
      const page = await context.newPage();
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

      const discoveredForms = await discoverForms(page, targetUrl);
      forms = discoveredForms;

      await page.close();
    }

    // Analyze each form
    for (const form of forms) {
      try {
        const result = await analyzeFormForCsrf(context, form);
        formsAnalyzed++;

        if (result.hasToken) {
          formsWithTokens++;
        } else {
          formsWithoutTokens++;

          // Only report vulnerability for state-changing methods
          if (form.method.toUpperCase() === 'POST' ||
            form.method.toUpperCase() === 'PUT' ||
            form.method.toUpperCase() === 'DELETE' ||
            form.method.toUpperCase() === 'PATCH') {

            vulnerabilities.push(
              createVulnerabilityFinding(
                'WSS-CSRF-001',
                form.action,
                `Form missing CSRF token protection: ${result.evidence}`,
                `Form at ${form.url} submits to ${form.action} without CSRF token`
              )
            );
          }
        }
      } catch (error) {
        console.error(`Failed to analyze form at ${form.url}:`, error);
      }
    }

    await context.close();

  } catch (error) {
    console.error('CSRF testing error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return {
    vulnerabilities,
    formsAnalyzed,
    formsWithTokens,
    formsWithoutTokens
  };
}

/**
 * Discover forms on a page
 */
async function discoverForms(
  page: any,
  baseUrl: string
): Promise<Array<{ url: string; method: string; action: string }>> {
  const forms: Array<{ url: string; method: string; action: string }> = [];

  try {
    const formElements = await page.$$('form');

    for (const form of formElements) {
      const method = await form.getAttribute('method') || 'GET';
      const action = await form.getAttribute('action') || '';

      // Resolve relative URLs
      let actionUrl = action;
      if (action.startsWith('/')) {
        const url = new URL(baseUrl);
        actionUrl = `${url.origin}${action}`;
      } else if (!action.startsWith('http')) {
        actionUrl = new URL(action, baseUrl).toString();
      }

      forms.push({
        url: baseUrl,
        method: method.toUpperCase(),
        action: actionUrl || baseUrl
      });
    }
  } catch (error) {
    console.error('Form discovery error:', error);
  }

  return forms;
}

/**
 * Analyze a single form for CSRF protection
 */
async function analyzeFormForCsrf(
  context: any,
  form: { url: string; method: string; action: string }
): Promise<{ hasToken: boolean; evidence: string }> {
  const page = await context.newPage();

  try {
    await page.goto(form.url, { waitUntil: 'domcontentloaded', timeout: 10000 });

    // Look for CSRF token fields
    const inputs = await page.$$('input[type="hidden"], input[type="text"]');

    for (const input of inputs) {
      const name = await input.getAttribute('name') || '';
      const id = await input.getAttribute('id') || '';
      const value = await input.getAttribute('value') || '';

      // Check if field name/id matches CSRF token patterns
      for (const pattern of CSRF_TOKEN_PATTERNS) {
        if (pattern.test(name) || pattern.test(id)) {
          // Verify the token has sufficient entropy
          if (value && value.length >= 16) {
            await page.close();
            return {
              hasToken: true,
              evidence: `CSRF token found: ${name || id}`
            };
          }
        }
      }
    }

    // Check for meta tags with CSRF tokens
    const metaTokens = await page.$$('meta[name*="csrf"], meta[name*="xsrf"]');
    if (metaTokens.length > 0) {
      const metaName = await metaTokens[0].getAttribute('name');
      await page.close();
      return {
        hasToken: true,
        evidence: `CSRF meta tag found: ${metaName}`
      };
    }

    // No token found
    const formHtml = await page.$eval('form', (el: any) => el.outerHTML.substring(0, 200));
    await page.close();
    return {
      hasToken: false,
      evidence: `No CSRF token found in form: ${formHtml}...`
    };

  } catch (error) {
    await page.close();
    throw error;
  }
}

/**
 * Check for SameSite cookie protection
 */
export async function checkSameSiteCookies(
  targetUrl: string
): Promise<Array<{
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
}>> {
  const vulnerabilities: any[] = [];
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

    // Get cookies
    const cookies = await context.cookies();

    for (const cookie of cookies) {
      // Check if session/auth cookie lacks SameSite
      const isSessionCookie =
        cookie.name.toLowerCase().includes('session') ||
        cookie.name.toLowerCase().includes('auth') ||
        cookie.name.toLowerCase().includes('token');

      if (isSessionCookie && (!cookie.sameSite || cookie.sameSite === 'None')) {
        vulnerabilities.push(
          createVulnerabilityFinding(
            'WSS-CSRF-002',
            targetUrl,
            `Session cookie '${cookie.name}' missing SameSite protection`,
            `Cookie: ${cookie.name} (SameSite: ${cookie.sameSite || 'not set'})`
          )
        );
      }
    }

    await page.close();
    await context.close();

  } catch (error) {
    console.error('SameSite check error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return vulnerabilities;
}
