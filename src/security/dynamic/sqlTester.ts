/**
 * SQL Injection Tester
 * 
 * Safe, error-based SQL injection detection that identifies database
 * error messages without exploiting vulnerabilities.
 * 
 * Safety Constraints:
 * - No data extraction attempts
 * - No blind/time-based testing (no DoS risk)
 * - Only safe error-triggering payloads
 * - Rate limited and timeout constrained
 */

import { chromium, Browser } from 'playwright';
import { createVulnerabilityFinding } from '../rules/owaspRules';

export interface SqlTestResult {
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
 * Safe SQL injection test payloads
 * These are designed to trigger errors without exploiting
 */
const SQL_ERROR_PAYLOADS = [
  {
    id: 'single-quote',
    payload: "'",
    description: 'Single quote - basic syntax error'
  },
  {
    id: 'double-quote',
    payload: '"',
    description: 'Double quote - alternative syntax error'
  },
  {
    id: 'comment-sequence',
    payload: "'--",
    description: 'Quote with SQL comment'
  },
  {
    id: 'union-keyword',
    payload: "' UNION SELECT NULL--",
    description: 'UNION keyword test'
  },
  {
    id: 'boolean-or',
    payload: "' OR '1'='1",
    description: 'Boolean OR condition'
  },
  {
    id: 'parenthesis-mismatch',
    payload: "')",
    description: 'Parenthesis mismatch'
  },
  {
    id: 'numeric-error',
    payload: "1' AND '1'='1",
    description: 'Numeric context test'
  }
];

/**
 * Database error patterns to detect in responses
 * These indicate SQL injection vulnerability
 */
const SQL_ERROR_PATTERNS = [
  // MySQL/MariaDB
  /SQL syntax.*?MySQL/i,
  /Warning.*?mysql_/i,
  /valid MySQL result/i,
  /MySqlClient\./i,
  /MySqlException/i,

  // PostgreSQL
  /PostgreSQL.*?ERROR/i,
  /Warning.*?pg_/i,
  /valid PostgreSQL result/i,
  /Npgsql\./i,
  /PG::SyntaxError/i,

  // Microsoft SQL Server
  /Driver.*?SQL[\s-]?Server/i,
  /OLE DB.*?SQL Server/i,
  /(\[SQL Server\]|\[ODBC SQL Server Driver\])/i,
  /SqlException/i,
  /System\.Data\.SqlClient/i,

  // Oracle
  /\bORA-\d{4,5}/i,
  /Oracle error/i,
  /Oracle.*?Driver/i,
  /quoted string not properly terminated/i,

  // SQLite
  /SQLite\/JDBCDriver/i,
  /SQLite\.Exception/i,
  /System\.Data\.SQLite\.SQLiteException/i,
  /unrecognized token/i,

  // Generic SQL errors
  /syntax error.*?near/i,
  /unclosed quotation mark/i,
  /quoted string not terminated/i,
  /unexpected end of SQL command/i,
  /unterminated string literal/i,
  /incorrect syntax near/i,
  /\bSQL\b.*?error/i
];

/**
 * Test URL for SQL injection vulnerabilities
 */
export async function testSqlInjection(
  targetUrl: string,
  endpoints: string[] = []
): Promise<SqlTestResult> {
  const vulnerabilities: SqlTestResult['vulnerabilities'] = [];
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
    const mainUrlVulns = await testUrlForSql(context, targetUrl);
    vulnerabilities.push(...mainUrlVulns);

    // Test discovered endpoints (limit to avoid excessive testing)
    const endpointsToTest = endpoints.slice(0, 10);
    for (const endpoint of endpointsToTest) {
      try {
        const endpointUrl = new URL(endpoint, targetUrl).toString();
        const endpointVulns = await testUrlForSql(context, endpointUrl);
        vulnerabilities.push(...endpointVulns);
      } catch {
        // Skip invalid endpoints
        continue;
      }
    }

    await context.close();

  } catch (error) {
    console.error('SQL injection testing error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return { vulnerabilities };
}

/**
 * Test a single URL for SQL injection
 */
async function testUrlForSql(
  context: any,
  url: string
): Promise<SqlTestResult['vulnerabilities']> {
  const vulnerabilities: SqlTestResult['vulnerabilities'] = [];
  const page = await context.newPage();

  try {
    const urlObj = new URL(url);

    // Only test URLs with query parameters or paths that might be dynamic
    const hasParams = urlObj.searchParams.toString().length > 0;
    const mightBeDynamic = /\d+/.test(urlObj.pathname) || urlObj.pathname.split('/').length > 3;

    if (!hasParams && !mightBeDynamic) {
      await page.close();
      return vulnerabilities;
    }

    // Test each SQL payload
    for (const test of SQL_ERROR_PAYLOADS) {
      try {
        // Add test payload as query parameter
        const testUrl = new URL(url);
        testUrl.searchParams.set('sqli_test', test.payload);

        // If there are existing params, also inject into first param
        const firstParam = Array.from(testUrl.searchParams.keys())[0];
        if (firstParam && firstParam !== 'sqli_test') {
          const originalValue = testUrl.searchParams.get(firstParam) || '';
          testUrl.searchParams.set(firstParam, originalValue + test.payload);
        }

        // Navigate to test URL with timeout
        const response = await page.goto(testUrl.toString(), {
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });

        if (!response) continue;

        // Get page content
        const content = await page.content();
        const statusCode = response.status();

        // Check for SQL error patterns
        const detectedError = detectSqlError(content);

        if (detectedError) {
          const evidence = extractErrorEvidence(content, detectedError);

          // Determine severity based on error detail
          const severity = statusCode === 500 ? 'HIGH' : 'MEDIUM';

          vulnerabilities.push(
            createVulnerabilityFinding(
              'WSS-SQLI-001',
              `${urlObj.origin}${urlObj.pathname}`,
              `SQL error detected with payload '${test.payload}': ${evidence}`,
              `Database error message exposed in response (HTTP ${statusCode})`
            )
          );
          break; // One finding per URL is enough
        }

      } catch (testError) {
        // Continue to next payload
        console.error(`SQL test error for ${url}:`, testError);
      }

      // Rate limiting: wait 500ms between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

  } catch (error) {
    console.error(`Failed to test ${url}:`, error);
  } finally {
    await page.close();
  }

  return vulnerabilities;
}

/**
 * Detect SQL error patterns in response content
 */
function detectSqlError(content: string): string | null {
  for (const pattern of SQL_ERROR_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return null;
}

/**
 * Extract evidence of SQL error from response
 */
function extractErrorEvidence(content: string, errorMatch: string): string {
  // Find context around the error
  const index = content.indexOf(errorMatch);
  if (index === -1) return errorMatch;

  // Extract surrounding context (100 chars before and after)
  const start = Math.max(0, index - 100);
  const end = Math.min(content.length, index + errorMatch.length + 100);
  const context = content.substring(start, end);

  // Clean up for display
  const cleaned = context
    .replace(/\s+/g, ' ')
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .trim();

  return cleaned.length > 200 ? cleaned.substring(0, 200) + '...' : cleaned;
}

/**
 * Test forms for SQL injection vulnerabilities
 */
export async function testFormSql(
  forms: Array<{ url: string; method: string; action: string }>
): Promise<SqlTestResult> {
  const vulnerabilities: SqlTestResult['vulnerabilities'] = [];
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

        // Find all text input fields
        const inputs = await page.$$('input[type="text"], input[type="search"], input[type="email"], textarea');

        if (inputs.length > 0) {
          // Test first input with SQL payload
          const testPayload = SQL_ERROR_PAYLOADS[0].payload; // Use single quote
          await inputs[0].fill(testPayload);

          // Submit form if submit button exists
          const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
          if (submitBtn) {
            await Promise.all([
              page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => { }),
              submitBtn.click()
            ]);

            // Check for SQL errors in response
            const content = await page.content();
            const detectedError = detectSqlError(content);

            if (detectedError) {
              const evidence = extractErrorEvidence(content, detectedError);
              vulnerabilities.push(
                createVulnerabilityFinding(
                  'WSS-SQLI-001',
                  form.action,
                  `SQL error in form submission: ${evidence}`
                )
              );
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
    console.error('Form SQL testing error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return { vulnerabilities };
}
