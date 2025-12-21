/**
 * Web Crawler
 * 
 * Conservative, safe crawler that discovers endpoints while respecting
 * robots.txt and enforcing rate limits. Non-destructive and ethical.
 */

import * as cheerio from 'cheerio';

export interface CrawlResult {
  urls: string[];
  endpoints: string[];
  forms: Array<{ url: string; method: string; action: string }>;
  errors: string[];
}

export interface CrawlerOptions {
  maxDepth?: number;
  maxPages?: number;
  rateLimit?: number; // milliseconds between requests
  respectRobotsTxt?: boolean;
  allowExternalLinks?: boolean;
  timeout?: number;
}

const DEFAULT_OPTIONS: Required<CrawlerOptions> = {
  maxDepth: 2,
  maxPages: 50,
  rateLimit: 1000, // 1 second between requests
  respectRobotsTxt: true,
  allowExternalLinks: false,
  timeout: 10000
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

      // Fetch page
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WebSecScan/1.0 (Educational Security Scanner)',
        },
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
