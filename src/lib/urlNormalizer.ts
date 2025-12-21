/**
 * URL Normalization and Security Utilities
 * 
 * Handles URL normalization, HTTPS preference, redirect detection,
 * and HTTP security threat identification.
 */

export interface NormalizeUrlResult {
  normalizedUrl: string;
  originalUrl: string;
  protocol: 'http' | 'https';
  redirected: boolean;
  redirectedTo?: string;
  isWwwRedirect: boolean;
  warnings: string[];
  securityThreats: Array<{
    type: string;
    message: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

export interface NormalizeUrlOptions {
  preferHttps?: boolean;
  checkRedirects?: boolean;
  timeout?: number;
}

const DEFAULT_OPTIONS: Required<NormalizeUrlOptions> = {
  preferHttps: true,
  checkRedirects: true,
  timeout: 10000,
};

/**
 * Normalize URL: add protocol if missing, prefer HTTPS, check redirects
 */
export async function normalizeUrl(
  inputUrl: string,
  options: NormalizeUrlOptions = {}
): Promise<NormalizeUrlResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const result: NormalizeUrlResult = {
    normalizedUrl: '',
    originalUrl: inputUrl,
    protocol: 'https',
    redirected: false,
    isWwwRedirect: false,
    warnings: [],
    securityThreats: [],
  };

  let url = inputUrl.trim();

  // Add protocol if missing
  if (!url.match(/^https?:\/\//i)) {
    url = `https://${url}`;
    result.warnings.push('Protocol not specified, defaulting to HTTPS');
  }

  // Parse URL
  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL format: ${url}`);
  }

  const originalProtocol = urlObj.protocol.replace(':', '') as 'http' | 'https';

  // If HTTPS preference is enabled and URL is HTTP, try HTTPS first
  if (opts.preferHttps && originalProtocol === 'http') {
    const httpsUrl = url.replace(/^http:/, 'https:');
    const httpsTest = await testUrlConnection(httpsUrl, opts.timeout);

    if (httpsTest.accessible) {
      result.normalizedUrl = httpsUrl;
      result.protocol = 'https';
      result.warnings.push('HTTP URL upgraded to HTTPS successfully');

      // Check for redirects
      if (opts.checkRedirects) {
        const redirectInfo = await checkRedirects(httpsUrl, opts.timeout);
        result.redirected = redirectInfo.redirected;
        result.redirectedTo = redirectInfo.finalUrl;
        result.isWwwRedirect = redirectInfo.isWwwRedirect;
      }
    } else {
      // HTTPS failed, fall back to HTTP
      const httpTest = await testUrlConnection(url, opts.timeout);

      if (httpTest.accessible) {
        result.normalizedUrl = url;
        result.protocol = 'http';
        result.warnings.push('HTTPS not available, using HTTP');

        // Flag HTTP as security threat
        result.securityThreats.push({
          type: 'INSECURE_PROTOCOL',
          message: 'Site uses HTTP instead of HTTPS. All traffic is transmitted in cleartext and vulnerable to interception.',
          severity: 'HIGH',
        });

        // Check for redirects
        if (opts.checkRedirects) {
          const redirectInfo = await checkRedirects(url, opts.timeout);
          result.redirected = redirectInfo.redirected;
          result.redirectedTo = redirectInfo.finalUrl;
          result.isWwwRedirect = redirectInfo.isWwwRedirect;
        }
      } else {
        throw new Error('Target URL is not accessible via HTTP or HTTPS');
      }
    }
  } else {
    // Use URL as-is
    result.normalizedUrl = url;
    result.protocol = originalProtocol;

    // Flag HTTP usage
    if (originalProtocol === 'http') {
      result.securityThreats.push({
        type: 'INSECURE_PROTOCOL',
        message: 'Site uses HTTP instead of HTTPS. All traffic is transmitted in cleartext and vulnerable to interception.',
        severity: 'HIGH',
      });
    }

    // Check for redirects
    if (opts.checkRedirects) {
      const redirectInfo = await checkRedirects(url, opts.timeout);
      result.redirected = redirectInfo.redirected;
      result.redirectedTo = redirectInfo.finalUrl;
      result.isWwwRedirect = redirectInfo.isWwwRedirect;
    }
  }

  return result;
}

/**
 * Test if URL is accessible
 */
async function testUrlConnection(
  url: string,
  timeout: number
): Promise<{ accessible: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'manual', // Don't follow redirects for connection test
    });

    clearTimeout(timeoutId);

    // Accept 2xx and 3xx status codes as accessible
    return { accessible: response.status < 400 };
  } catch (error) {
    if (error instanceof Error) {
      return { accessible: false, error: error.message };
    }
    return { accessible: false, error: 'Unknown error' };
  }
}

/**
 * Check for redirects and detect www redirects
 */
async function checkRedirects(
  url: string,
  timeout: number
): Promise<{ redirected: boolean; finalUrl: string; isWwwRedirect: boolean }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow', // Follow redirects
    });

    clearTimeout(timeoutId);

    const finalUrl = response.url;
    const redirected = finalUrl !== url;

    // Check if redirect is to www subdomain
    let isWwwRedirect = false;
    if (redirected) {
      const originalHost = new URL(url).hostname.toLowerCase();
      const finalHost = new URL(finalUrl).hostname.toLowerCase();

      // Check if final host is www.originalHost or originalHost is www.finalHost
      isWwwRedirect =
        finalHost === `www.${originalHost}` ||
        originalHost === `www.${finalHost}`;
    }

    return { redirected, finalUrl, isWwwRedirect };
  } catch (error) {
    // If redirect check fails, assume no redirect
    return { redirected: false, finalUrl: url, isWwwRedirect: false };
  }
}

/**
 * Quick validation for URL format (synchronous, no network calls)
 */
export function validateUrlFormat(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  const trimmed = url.trim();

  // Try to parse with or without protocol
  let urlObj: URL;
  try {
    if (!trimmed.match(/^https?:\/\//i)) {
      urlObj = new URL(`https://${trimmed}`);
    } else {
      urlObj = new URL(trimmed);
    }
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Validate hostname
  if (!urlObj.hostname || urlObj.hostname.length === 0) {
    return { valid: false, error: 'URL must include a hostname' };
  }

  // Check for suspicious patterns
  if (urlObj.username || urlObj.password) {
    return { valid: false, error: 'URLs with embedded credentials are not allowed' };
  }

  return { valid: true };
}
