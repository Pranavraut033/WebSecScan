/**
 * Cookie Analyzer - Analyzes cookie security configurations
 * Checks for Secure, HttpOnly, SameSite attributes
 */

import type { HeaderTestResult } from './headerAnalyzer';

export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None' | string;
  expires?: string;
  maxAge?: number;
}

export function parseCookies(setCookieHeaders: string[]): Cookie[] {
  const cookies: Cookie[] = [];

  for (const header of setCookieHeaders) {
    const parts = header.split(';').map((p) => p.trim());
    if (parts.length === 0) continue;

    const [nameValue] = parts;
    const [name, value] = nameValue.split('=');

    if (!name) continue;

    const cookie: Cookie = {
      name: name.trim(),
      value: value?.trim() || '',
      secure: false,
      httpOnly: false,
    };

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].toLowerCase();

      if (part === 'secure') {
        cookie.secure = true;
      } else if (part === 'httponly') {
        cookie.httpOnly = true;
      } else if (part.startsWith('samesite=')) {
        cookie.sameSite = part.split('=')[1];
      } else if (part.startsWith('domain=')) {
        cookie.domain = part.split('=')[1];
      } else if (part.startsWith('path=')) {
        cookie.path = part.split('=')[1];
      } else if (part.startsWith('expires=')) {
        cookie.expires = part.split('=')[1];
      } else if (part.startsWith('max-age=')) {
        cookie.maxAge = parseInt(part.split('=')[1], 10);
      }
    }

    cookies.push(cookie);
  }

  return cookies;
}

export function analyzeCookies(
  url: string,
  setCookieHeaders: string[]
): HeaderTestResult {
  const cookies = parseCookies(setCookieHeaders);
  const isHttps = url.startsWith('https://');

  if (cookies.length === 0) {
    return {
      testName: 'Cookies',
      passed: true,
      score: 0,
      result: 'Info',
      reason: 'No cookies detected.',
      details: { cookieCount: 0 },
    };
  }

  const issues: string[] = [];
  const insecureCookies: string[] = [];
  const missingHttpOnly: string[] = [];
  let allSecure = true;
  let sessionCookiesHaveHttpOnly = true;

  for (const cookie of cookies) {
    // Check Secure flag
    if (!cookie.secure) {
      allSecure = false;
      insecureCookies.push(cookie.name);
    }

    // Check HttpOnly for session cookies (cookies without explicit expiry)
    const isSessionCookie = !cookie.expires && !cookie.maxAge;
    if (isSessionCookie && !cookie.httpOnly) {
      sessionCookiesHaveHttpOnly = false;
      missingHttpOnly.push(cookie.name);
    }
  }

  if (!allSecure) {
    issues.push(
      `Cookies set without Secure flag: ${insecureCookies.join(', ')}`
    );
  }

  if (!sessionCookiesHaveHttpOnly) {
    issues.push(
      `Session cookies missing HttpOnly flag: ${missingHttpOnly.join(', ')}`
    );
  }

  if (!isHttps && cookies.length > 0) {
    issues.push('Cookies set over HTTP (insecure connection)');
  }

  if (issues.length > 0) {
    return {
      testName: 'Cookies',
      passed: false,
      score: -20,
      result: 'Failed',
      reason: issues.join('. '),
      recommendation: 'Use Secure flag on all cookies and set up HSTS.',
      details: {
        cookieCount: cookies.length,
        insecureCookies,
        missingHttpOnly,
        cookies: cookies.map((c) => ({
          name: c.name,
          secure: c.secure,
          httpOnly: c.httpOnly,
          sameSite: c.sameSite,
        })),
      },
    };
  }

  return {
    testName: 'Cookies',
    passed: true,
    score: 5,
    result: 'Passed',
    reason:
      'All cookies use the Secure flag and all session cookies use the HttpOnly flag.',
    details: {
      cookieCount: cookies.length,
      cookies: cookies.map((c) => ({
        name: c.name,
        secure: c.secure,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite,
      })),
    },
  };
}
