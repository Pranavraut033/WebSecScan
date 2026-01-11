/**
 * Web Crawler
 * 
 * Conservative, safe crawler that discovers endpoints while respecting
 * robots.txt and enforcing rate limits. Non-destructive and ethical.
 * 
 * Design Philosophy:
 * - Safety over exhaustive coverage
 * - Ethical crawling with explicit consent
 * - Prevent DoS through rate limiting and page caps
 * - Respect website policies (robots.txt)
 * 
 * See docs/crawler-design.md for detailed rationale and configuration guide.
 */

import * as cheerio from 'cheerio';

export interface CrawlResult {
  urls: string[];
  endpoints: string[];
  forms: Array<{ url: string; method: string; action: string }>;
  errors: string[];
}

/**
 * Session credentials for authenticated crawling
 */
export interface SessionCredentials {
  /** HTTP headers to include in requests (e.g., Cookie, Authorization) */
  headers?: Record<string, string>;
  
  /** Cookies to send with requests */
  cookies?: Array<{ name: string; value: string }>;
}

/**
 * Configuration options for web crawler
 * 
 * All options are optional with safe defaults prioritizing server safety
 * and ethical crawling over exhaustive coverage.
 */
export interface CrawlerOptions {
  /**
   * Maximum crawl depth (levels from start URL)
   * 
   * Default: 2
   * Recommended Range: 1-5
   * Rationale: Prevents exponential URL explosion; deep routes require explicit override
   * 
   * Trade-off: maxDepth=2 may miss deeply nested admin routes like:
   *   / → /dashboard → /admin → /settings (depth 3, SKIPPED)
   */
  maxDepth?: number;

  /**
   * Maximum pages to crawl before stopping
   * 
   * Default: 50
   * Recommended Range: 1-200
   * Rationale: Caps resource usage and scan duration; prevents accidental DoS
   * 
   * Trade-off: Large applications may have hundreds of routes; 50 provides
   * representative coverage without overwhelming small servers
   */
  maxPages?: number;

  /**
   * Milliseconds to wait between requests (rate limiting)
   * 
   * Default: 1000ms (1 second)
   * Recommended Range: 100-5000ms
   * Rationale: Prevents overwhelming target server; respectful crawling
   * 
   * Performance Impact: 50 pages × 1s = ~50 seconds minimum scan time
   * WARNING: Values < 500ms may trigger WAF/rate limit blocks
   */
  rateLimit?: number;

  /**
   * Whether to respect robots.txt directives
   * 
   * Default: true
   * Rationale: Ethical crawling honors website owner preferences
   * 
   * Trade-off: May skip security-critical admin panels marked as disallowed
   * For authorized testing, set to false with explicit consent
   */
  respectRobotsTxt?: boolean;

  /**
   * Whether to crawl external (cross-origin) links
   * 
   * Default: false
   * Rationale: Prevents pivoting to external domains during scan
   * 
   * Trade-off: Won't test federated auth flows or third-party integrations
   */
  allowExternalLinks?: boolean;

  /**
   * Request timeout in milliseconds
   * 
   * Default: 10000ms (10 seconds)
   * Recommended Range: 5000-30000ms
   * Rationale: Prevents hanging on unresponsive endpoints
   */
  timeout?: number;

  /**
   * Optional session credentials for authenticated crawling
   * 
   * When provided, all requests will include these headers/cookies
   * to access authenticated pages. Use in conjunction with Playwright
   * authentication flow (see authScanner.ts).
   * 
   * Safety: Sessions are isolated per-scan; credentials never persisted
   */
  sessionCredentials?: SessionCredentials;
}

/**
 * Safe default crawler configuration
 * 
 * Prioritizes:
 * 1. Server safety (rate limiting, page caps)
 * 2. Ethical behavior (robots.txt, explicit consent)
 * 3. Predictable resource usage (bounded depth/pages)
 * 4. Fast initial scans (shallow depth)
 * 
 * These defaults are appropriate for quick security checks on small-to-medium
 * applications. For comprehensive coverage, see docs/crawler-design.md for
 * recommended overrides.
 */
const DEFAULT_OPTIONS: Required<Omit<CrawlerOptions, 'sessionCredentials'>> = {
  maxDepth: 2,              // Crawl up to 2 levels deep
  maxPages: 50,             // Stop after 50 pages discovered
  rateLimit: 1000,          // 1 second between requests (respectful pacing)
  respectRobotsTxt: true,   // Honor robots.txt by default (ethical)
  allowExternalLinks: false, // Only crawl same-origin URLs (prevent pivoting)
  timeout: 10000            // 10-second timeout per request
};

/**
 * Crawl a website to discover endpoints and input points
 */
export async function crawlWebsite(
  startUrl: string,
  options: CrawlerOptions = {}
): Promise<CrawlResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const result: CrawlResult = {
    urls: [],
    endpoints: [],
    forms: [],
    errors: []
  };

  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];
  const baseUrl = new URL(startUrl);

  // Check robots.txt if required
  let disallowedPaths: string[] = [];
  if (opts.respectRobotsTxt) {
    disallowedPaths = await fetchRobotsTxt(baseUrl.origin);
  }

  while (queue.length > 0 && visited.size < opts.maxPages) {
    const { url, depth } = queue.shift()!;

    // Skip if already visited
    if (visited.has(url)) continue;

    // Skip if max depth exceeded
    if (depth > opts.maxDepth) continue;

    // Check robots.txt compliance
    if (isDisallowedByRobots(url, baseUrl.origin, disallowedPaths)) {
      result.errors.push(`Skipped ${url} (disallowed by robots.txt)`);
      continue;
    }

    visited.add(url);
    result.urls.push(url);

    try {
      // Rate limiting
      if (visited.size > 1) {
        await sleep(opts.rateLimit);
      }

      // Build request headers (merge session credentials if provided)
      const headers: Record<string, string> = {
        'User-Agent': 'WebSecScan/1.0 (Educational Security Scanner)',
      };

      // Add session headers for authenticated crawling
      if (opts.sessionCredentials?.headers) {
        Object.assign(headers, opts.sessionCredentials.headers);
      }

      // Add cookies if provided (merge with Cookie header if exists)
      if (opts.sessionCredentials?.cookies && opts.sessionCredentials.cookies.length > 0) {
        const cookieString = opts.sessionCredentials.cookies
          .map(c => `${c.name}=${c.value}`)
          .join('; ');
        
        if (headers['Cookie']) {
          headers['Cookie'] = `${headers['Cookie']}; ${cookieString}`;
        } else {
          headers['Cookie'] = cookieString;
        }
      }

      // Fetch page
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(opts.timeout)
      });

      if (!response.ok) {
        result.errors.push(`Failed to fetch ${url}: ${response.status}`);
        continue;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        continue; // Skip non-HTML content
      }

      const html = await response.text();

      // Extract links
      const links = extractLinks(html, url, baseUrl.origin, opts.allowExternalLinks);
      for (const link of links) {
        if (!visited.has(link)) {
          queue.push({ url: link, depth: depth + 1 });
        }
      }

      // Extract API endpoints from scripts
      const apiEndpoints = extractApiEndpoints(html);
      result.endpoints.push(...apiEndpoints);

      // Extract forms
      const forms = extractForms(html, url);
      result.forms.push(...forms);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`Error crawling ${url}: ${message}`);
    }
  }

  // Deduplicate endpoints
  result.endpoints = [...new Set(result.endpoints)];

  return result;
}

/**
 * Fetch and parse robots.txt
 */
async function fetchRobotsTxt(origin: string): Promise<string[]> {
  try {
    const robotsUrl = `${origin}/robots.txt`;
    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'WebSecScan/1.0' },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return []; // No robots.txt or error - allow all
    }

    const text = await response.text();
    const disallowed: string[] = [];

    // Simple robots.txt parser (for User-agent: * only)
    let isRelevantSection = false;
    for (const line of text.split('\n')) {
      const trimmed = line.trim();

      if (trimmed.toLowerCase().startsWith('user-agent:')) {
        isRelevantSection = trimmed.toLowerCase().includes('*');
      } else if (isRelevantSection && trimmed.toLowerCase().startsWith('disallow:')) {
        const path = trimmed.substring(trimmed.indexOf(':') + 1).trim();
        if (path) {
          disallowed.push(path);
        }
      }
    }

    return disallowed;
  } catch {
    return []; // On error, allow all
  }
}

/**
 * Check if URL is disallowed by robots.txt
 */
function isDisallowedByRobots(url: string, origin: string, disallowedPaths: string[]): boolean {
  const urlObj = new URL(url);
  const path = urlObj.pathname;

  for (const disallowed of disallowedPaths) {
    if (path.startsWith(disallowed)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract links from HTML
 */
function extractLinks(html: string, currentUrl: string, baseOrigin: string, allowExternal: boolean): string[] {
  const links: string[] = [];
  const $ = cheerio.load(html);

  $('a[href]').each((_, elem) => {
    const href = $(elem).attr('href');
    if (!href) return;

    try {
      // Resolve relative URLs
      const absoluteUrl = new URL(href, currentUrl);

      // Skip non-HTTP(S) protocols
      if (!absoluteUrl.protocol.startsWith('http')) {
        return;
      }

      // Check if external
      if (!allowExternal && absoluteUrl.origin !== baseOrigin) {
        return;
      }

      // Remove fragment
      absoluteUrl.hash = '';

      links.push(absoluteUrl.toString());
    } catch {
      // Invalid URL, skip
      return;
    }
  });

  return links;
}

/**
 * Extract potential API endpoints from script tags and inline scripts
 */
function extractApiEndpoints(html: string): string[] {
  const endpoints: string[] = [];
  const $ = cheerio.load(html);

  // Extract all script content (inline and external)
  const scriptContents: string[] = [];

  $('script').each((_, elem) => {
    const content = $(elem).html();
    if (content) {
      scriptContents.push(content);
    }
  });

  // Also check for inline event handlers and other attributes
  const allHtml = $.html();
  scriptContents.push(allHtml);

  // Common API endpoint patterns
  const patterns = [
    /['"]\/api\/[^'"]+['"]/g,
    /fetch\s*\(\s*['"]([^'"]+)['"]/g,
    /axios\.[a-z]+\s*\(\s*['"]([^'"]+)['"]/g,
    /\$\.ajax\s*\(\s*{[^}]*url\s*:\s*['"]([^'"]+)['"]/g
  ];

  for (const content of scriptContents) {
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const endpoint = match[1] || match[0].replace(/['"]/g, '');
        if (endpoint.startsWith('/') || endpoint.startsWith('http')) {
          endpoints.push(endpoint);
        }
      }
    }
  }

  // Remove duplicates
  return Array.from(new Set(endpoints));
}

/**
 * Extract forms from HTML
 */
function extractForms(html: string, pageUrl: string): Array<{ url: string; method: string; action: string }> {
  const forms: Array<{ url: string; method: string; action: string }> = [];
  const $ = cheerio.load(html);

  $('form').each((_, elem) => {
    const $form = $(elem);

    // Extract method
    const method = ($form.attr('method') || 'GET').toUpperCase();

    // Extract action
    let action = $form.attr('action') || pageUrl;

    // Resolve relative action URLs
    try {
      action = new URL(action, pageUrl).toString();
    } catch {
      action = pageUrl;
    }

    forms.push({
      url: pageUrl,
      method,
      action
    });
  });

  return forms;
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
