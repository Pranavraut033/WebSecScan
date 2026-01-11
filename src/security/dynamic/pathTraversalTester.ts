/**
 * Path Traversal Tester
 * 
 * Safe detection of path traversal vulnerabilities by testing for
 * information disclosure and directory access issues.
 * 
 * Safety Constraints:
 * - No destructive operations
 * - Only tests for common readable files
 * - Rate limited and timeout constrained
 * - No arbitrary file reads or writes
 */

import { chromium, Browser } from 'playwright';
import { createVulnerabilityFinding } from '../rules/owaspRules';

export interface PathTraversalTestResult {
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
 * Safe path traversal test payloads
 * These test for common accessible files without causing harm
 */
const PATH_TRAVERSAL_PAYLOADS = [
  {
    id: 'basic-dotdot',
    payload: '../../../etc/passwd',
    description: 'Unix password file traversal'
  },
  {
    id: 'windows-dotdot',
    payload: '..\\..\\..\\windows\\win.ini',
    description: 'Windows INI file traversal'
  },
  {
    id: 'encoded-dotdot',
    payload: '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    description: 'URL-encoded path traversal'
  },
  {
    id: 'double-encoded',
    payload: '%252e%252e%252f%252e%252e%252f%252e%252e%252fetc%252fpasswd',
    description: 'Double URL-encoded traversal'
  },
  {
    id: 'null-byte',
    payload: '../../../etc/passwd%00',
    description: 'Null byte path traversal'
  },
  {
    id: 'absolute-unix',
    payload: '/etc/passwd',
    description: 'Absolute Unix path'
  },
  {
    id: 'absolute-windows',
    payload: 'C:\\windows\\win.ini',
    description: 'Absolute Windows path'
  },
  {
    id: 'proc-self',
    payload: '../../../proc/self/environ',
    description: 'Linux process environment'
  }
];

/**
 * Patterns indicating successful path traversal
 */
const PATH_TRAVERSAL_INDICATORS = [
  // Unix /etc/passwd patterns
  /root:.*?:0:0:/i,
  /daemon:.*?:1:1:/i,
  /bin:.*?:2:2:/i,
  /\w+:x:\d+:\d+:/,
  /^[a-z_][a-z0-9_-]*:[^:]*:\d+:\d+:[^:]*:[^:]*:[^\r\n]*$/m,

  // Windows win.ini patterns
  /\[fonts\]/i,
  /\[extensions\]/i,
  /\[mci extensions\]/i,
  /\[files\]/i,
  /; for 16-bit app support/i,

  // Process environment patterns
  /PATH=.*?:/,
  /HOME=.*?\//,
  /USER=/,
  /SHELL=/,

  // Generic file disclosure indicators
  /\[boot loader\]/i,
  /\[operating systems\]/i,
  /version=\d+\.\d+/i
];

/**
 * Test URL for path traversal vulnerabilities
 */
export async function testPathTraversal(
  targetUrl: string,
  endpoints: string[] = []
): Promise<PathTraversalTestResult> {
  const vulnerabilities: PathTraversalTestResult['vulnerabilities'] = [];
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
    const mainUrlVulns = await testUrlForPathTraversal(context, targetUrl);
    vulnerabilities.push(...mainUrlVulns);

    // Test discovered endpoints (limit to avoid excessive testing)
    const endpointsToTest = endpoints.slice(0, 10);
    for (const endpoint of endpointsToTest) {
      try {
        // Focus on endpoints that might accept file parameters
        if (!isFileEndpoint(endpoint)) {
          continue;
        }

        const endpointUrl = new URL(endpoint, targetUrl).toString();
        const endpointVulns = await testUrlForPathTraversal(context, endpointUrl);
        vulnerabilities.push(...endpointVulns);
      } catch {
        // Skip invalid endpoints
        continue;
      }
    }

    await context.close();

  } catch (error) {
    console.error('Path traversal testing error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return { vulnerabilities };
}

/**
 * Check if endpoint is likely to accept file parameters
 */
function isFileEndpoint(url: string): boolean {
  const fileKeywords = ['file', 'path', 'doc', 'download', 'image', 'img', 'page', 'template', 'load'];
  const urlLower = url.toLowerCase();
  return fileKeywords.some(keyword => urlLower.includes(keyword));
}

/**
 * Test a single URL for path traversal
 */
async function testUrlForPathTraversal(
  context: any,
  url: string
): Promise<PathTraversalTestResult['vulnerabilities']> {
  const vulnerabilities: PathTraversalTestResult['vulnerabilities'] = [];
  const page = await context.newPage();

  try {
    const urlObj = new URL(url);

    // Generate common parameter names that might be vulnerable
    const paramNames = ['file', 'path', 'page', 'document', 'load', 'template', 'src'];

    // Test each payload with different parameter names
    for (const test of PATH_TRAVERSAL_PAYLOADS) {
      for (const paramName of paramNames) {
        try {
          // Create test URL with payload
          const testUrl = new URL(url);
          testUrl.searchParams.set(paramName, test.payload);

          // Navigate to test URL with timeout
          const response = await page.goto(testUrl.toString(), {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });

          if (!response) continue;

          // Get page content
          const content = await page.content();
          const statusCode = response.status();

          // Check for path traversal indicators
          const indicator = detectPathTraversal(content);

          if (indicator) {
            const evidence = extractTraversalEvidence(content, indicator);

            vulnerabilities.push(
              createVulnerabilityFinding(
                'WSS-PATH-001',
                `${urlObj.origin}${urlObj.pathname}`,
                `Path traversal detected via '${paramName}' parameter: ${evidence}`,
                `File system access via parameter '${paramName}' with payload '${test.payload}'`
              )
            );

            // Found vulnerability, stop testing this URL
            await page.close();
            return vulnerabilities;
          }

        } catch (testError) {
          // Continue to next test
          console.error(`Path traversal test error for ${url}:`, testError);
        }

        // Rate limiting: wait 300ms between tests
        await new Promise(resolve => setTimeout(resolve, 300));
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
 * Detect path traversal indicators in response content
 */
function detectPathTraversal(content: string): string | null {
  for (const pattern of PATH_TRAVERSAL_INDICATORS) {
    const match = content.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return null;
}

/**
 * Extract evidence of path traversal from response
 */
function extractTraversalEvidence(content: string, indicator: string): string {
  // Find context around the indicator
  const index = content.indexOf(indicator);
  if (index === -1) return indicator;

  // Extract surrounding context (80 chars before and after)
  const start = Math.max(0, index - 80);
  const end = Math.min(content.length, index + indicator.length + 80);
  const context = content.substring(start, end);

  // Clean up for display
  const cleaned = context
    .replace(/\s+/g, ' ')
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .trim();

  return cleaned.length > 150 ? cleaned.substring(0, 150) + '...' : cleaned;
}

/**
 * Test forms for path traversal vulnerabilities
 */
export async function testFormPathTraversal(
  forms: Array<{ url: string; method: string; action: string }>
): Promise<PathTraversalTestResult> {
  const vulnerabilities: PathTraversalTestResult['vulnerabilities'] = [];
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    // Limit form testing
    const formsToTest = forms.slice(0, 3);

    for (const form of formsToTest) {
      const page = await context.newPage();

      try {
        await page.goto(form.url, { waitUntil: 'domcontentloaded', timeout: 10000 });

        // Find file-related input fields
        const fileInputs = await page.$$('input[type="file"], input[name*="file"], input[name*="path"]');
        const textInputs = await page.$$('input[type="text"]');

        const inputs = [...fileInputs, ...textInputs.slice(0, 2)];

        if (inputs.length > 0) {
          // Test with basic path traversal payload
          const testPayload = PATH_TRAVERSAL_PAYLOADS[0].payload;

          // For file inputs, we can't actually upload, so skip
          // For text inputs, fill with payload
          for (const input of inputs) {
            const inputType = await input.getAttribute('type');
            if (inputType === 'file') continue;

            await input.fill(testPayload);

            // Submit form
            const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
            if (submitBtn) {
              await Promise.all([
                page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => { }),
                submitBtn.click()
              ]);

              // Check for path traversal indicators
              const content = await page.content();
              const indicator = detectPathTraversal(content);

              if (indicator) {
                const evidence = extractTraversalEvidence(content, indicator);
                vulnerabilities.push(
                  createVulnerabilityFinding(
                    'WSS-PATH-001',
                    form.action,
                    `Path traversal in form submission: ${evidence}`
                  )
                );
                break;
              }
            }
          }
        }

      } catch {
        // Continue to next form
      } finally {
        await page.close();
      }

      // Rate limiting between forms
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await context.close();

  } catch (error) {
    console.error('Form path traversal testing error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return { vulnerabilities };
}
