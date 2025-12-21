/**
 * XSS Tester
 * 
 * Safe, non-destructive XSS testing that detects reflected input without
 * exploiting vulnerabilities. Uses unique markers to verify reflection.
 */

import { chromium, Browser, Page } from 'playwright';
import { createVulnerabilityFinding } from '../rules/owaspRules';

export interface XssTestResult {
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
 * Safe XSS test payloads with unique markers
 * These are designed to be detectable without being exploitable
 */
const XSS_TEST_PAYLOADS = [
  {
    id: 'basic-reflection',
    payload: 'XSSTEST__MARKER__12345',
    description: 'Basic reflection test'
  },
  {
    id: 'html-context',
    payload: '<span>XSSTEST__MARKER__67890</span>',
    description: 'HTML context reflection'
  },
  {
    id: 'attribute-context',
    payload: '" XSSTEST__MARKER__ATTR',
    description: 'Attribute context reflection'
  },
  {
    id: 'script-context',
    payload: "'; XSSTEST__MARKER__SCRIPT; '",
    description: 'Script context reflection'
  }
];

/**
 * Test URL for XSS vulnerabilities
 */
export async function testXss(
  targetUrl: string,
  endpoints: string[] = []
): Promise<XssTestResult> {
  const vulnerabilities: XssTestResult['vulnerabilities'] = [];
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

    // Test main URL
    const mainUrlVulns = await testUrlForXss(context, targetUrl);
    vulnerabilities.push(...mainUrlVulns);

    // Test discovered endpoints (limit to avoid excessive testing)
    const endpointsToTest = endpoints.slice(0, 10);
    for (const endpoint of endpointsToTest) {
      try {
        const endpointUrl = new URL(endpoint, targetUrl).toString();
        const endpointVulns = await testUrlForXss(context, endpointUrl);
        vulnerabilities.push(...endpointVulns);
      } catch {
        // Skip invalid endpoints
        continue;
      }
    }

    await context.close();

  } catch (error) {
    console.error('XSS testing error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return { vulnerabilities };
}

/**
 * Test a single URL for XSS reflection
 */
async function testUrlForXss(
  context: any,
  url: string
): Promise<XssTestResult['vulnerabilities']> {
  const vulnerabilities: XssTestResult['vulnerabilities'] = [];
  const page = await context.newPage();

  try {
    // Parse URL to inject test payloads
    const urlObj = new URL(url);

    // Test each payload
    for (const test of XSS_TEST_PAYLOADS) {
      try {
        // Add test payload as query parameter
        const testUrl = new URL(url);
        testUrl.searchParams.set('xss_test', test.payload);

        // Navigate to test URL with timeout
        await page.goto(testUrl.toString(), {
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });

        // Get page content
        const content = await page.content();

        // Check if payload is reflected
        const marker = test.payload.includes('MARKER') ? 'MARKER' : test.payload;
        if (content.includes(marker)) {
          // Verify it's actually reflected in dangerous context
          const isDangerous = await checkReflectionContext(page, test.payload);

          if (isDangerous) {
            const evidence = await extractReflectionEvidence(page, test.payload);
            vulnerabilities.push(
              createVulnerabilityFinding(
                'WSS-XSS-001',
                `${urlObj.origin}${urlObj.pathname}`,
                `Payload reflected in ${test.description}: ${evidence}`,
                `User input from query parameter 'xss_test' is reflected without sanitization.`
              )
            );
            break; // One finding per URL is enough
          }
        }

      } catch (testError) {
        // Continue to next payload
        console.error(`XSS test error for ${url}:`, testError);
      }
    }

  } catch (error) {
    console.error(`Failed to test ${url}:`, error);
  } finally {
    await page.close();
  }

  return vulnerabilities;
}

/**
 * Check if reflection occurs in a dangerous context (not just as text)
 */
async function checkReflectionContext(page: Page, payload: string): Promise<boolean> {
  try {
    // Check if payload appears in HTML source (not just displayed text)
    const html = await page.content();

    // Check for reflection in various dangerous contexts
    const dangerousPatterns = [
      // In HTML tags
      /<[^>]*XSSTEST__MARKER__[^>]*>/,
      /<[^>]*MARKER[^>]*>/,
      // In script tags
      /<script[^>]*>[\s\S]*XSSTEST__MARKER__[\s\S]*<\/script>/,
      // In event handlers
      /on\w+\s*=\s*["'][^"']*XSSTEST__MARKER__/,
      // In href/src attributes
      /(?:href|src)\s*=\s*["'][^"']*XSSTEST__MARKER__/
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(html)) {
        return true;
      }
    }

    // Additional check: if payload contains HTML tags and they're rendered
    if (payload.includes('<') && payload.includes('>')) {
      const selector = await page.$('span:has-text("XSSTEST__MARKER__")');
      if (selector) {
        return true; // HTML was interpreted
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Extract evidence of where reflection occurred
 */
async function extractReflectionEvidence(page: Page, payload: string): Promise<string> {
  try {
    const html = await page.content();

    // Find the context around the reflection
    const marker = 'MARKER';
    const index = html.indexOf(marker);

    if (index === -1) return 'Reflection detected in page';

    // Extract surrounding context (50 chars before and after)
    const start = Math.max(0, index - 50);
    const end = Math.min(html.length, index + marker.length + 50);
    const context = html.substring(start, end);

    // Clean up for display
    const cleaned = context
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned.length > 100 ? cleaned.substring(0, 100) + '...' : cleaned;
  } catch {
    return 'Reflection detected in page';
  }
}

/**
 * Test forms for XSS vulnerabilities
 */
export async function testFormXss(
  forms: Array<{ url: string; method: string; action: string }>
): Promise<XssTestResult> {
  const vulnerabilities: XssTestResult['vulnerabilities'] = [];
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    // Limit form testing to avoid excessive requests
    const formsToTest = forms.slice(0, 5);

    for (const form of formsToTest) {
      const page = await context.newPage();

      try {
        await page.goto(form.url, { waitUntil: 'domcontentloaded', timeout: 10000 });

        // Find all input fields
        const inputs = await page.$$('input[type="text"], input[type="search"], textarea');

        if (inputs.length > 0) {
          // Fill first input with test payload
          const testPayload = 'XSSTEST__FORM__MARKER';
          await inputs[0].fill(testPayload);

          // Submit form if submit button exists
          const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
          if (submitBtn) {
            await submitBtn.click();
            await page.waitForLoadState('domcontentloaded', { timeout: 5000 });

            // Check if payload is reflected
            const content = await page.content();
            if (content.includes('XSSTEST__FORM__MARKER')) {
              const isDangerous = await checkReflectionContext(page, testPayload);
              if (isDangerous) {
                vulnerabilities.push(
                  createVulnerabilityFinding(
                    'WSS-XSS-001',
                    form.action,
                    'Form input reflected without sanitization'
                  )
                );
              }
            }
          }
        }

      } catch {
        // Continue to next form
      } finally {
        await page.close();
      }
    }

    await context.close();

  } catch (error) {
    console.error('Form XSS testing error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return { vulnerabilities };
}
