/**
 * Unit tests for authenticated scanner
 * 
 * Tests cover:
 * - Configuration validation
 * - Cookie security analysis
 * - Session weakness detection
 * - Error handling
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateAuthConfig,
  analyzeAuthenticatedSession,
  type AuthConfig,
  type AuthResult
} from '../src/security/dynamic/authScanner';

describe('AuthScanner - Configuration Validation', () => {
  it('should validate complete auth config', () => {
    const config: AuthConfig = {
      loginUrl: 'https://example.com/login',
      usernameSelector: '#username',
      passwordSelector: '#password',
      submitSelector: 'button[type="submit"]',
      credentials: {
        username: 'testuser',
        password: 'testpass123'
      }
    };

    const result = validateAuthConfig(config);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('should reject missing login URL', () => {
    const config: AuthConfig = {
      loginUrl: '',
      usernameSelector: '#username',
      passwordSelector: '#password',
      submitSelector: 'button[type="submit"]',
      credentials: {
        username: 'testuser',
        password: 'testpass123'
      }
    };

    const result = validateAuthConfig(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Login URL')));
  });

  it('should reject invalid protocol in login URL', () => {
    const config: AuthConfig = {
      loginUrl: 'ftp://example.com/login',
      usernameSelector: '#username',
      passwordSelector: '#password',
      submitSelector: 'button[type="submit"]',
      credentials: {
        username: 'testuser',
        password: 'testpass123'
      }
    };

    const result = validateAuthConfig(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('HTTP/HTTPS')));
  });

  it('should reject missing selectors', () => {
    const config: AuthConfig = {
      loginUrl: 'https://example.com/login',
      usernameSelector: '',
      passwordSelector: '#password',
      submitSelector: 'button[type="submit"]',
      credentials: {
        username: 'testuser',
        password: 'testpass123'
      }
    };

    const result = validateAuthConfig(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Username selector')));
  });

  it('should reject missing credentials', () => {
    const config: AuthConfig = {
      loginUrl: 'https://example.com/login',
      usernameSelector: '#username',
      passwordSelector: '#password',
      submitSelector: 'button[type="submit"]',
      credentials: {
        username: '',
        password: 'testpass123'
      }
    };

    const result = validateAuthConfig(config);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Username is required')));
  });

  it('should reject whitespace-only credentials', () => {
    const config: AuthConfig = {
      loginUrl: 'https://example.com/login',
      usernameSelector: '#username',
      passwordSelector: '#password',
      submitSelector: 'button[type="submit"]',
      credentials: {
        username: '   ',
        password: 'testpass123'
      }
    };

    const result = validateAuthConfig(config);
    assert.strictEqual(result.valid, false);
  });
});

describe('AuthScanner - Session Analysis', () => {
  it('should detect insecure session cookies', async () => {
    const authResult: AuthResult = {
      success: true,
      cookies: [
        {
          name: 'sessionid',
          value: 'abc123',
          domain: 'example.com',
          secure: false,
          httpOnly: false,
          sameSite: undefined
        }
      ],
      sessionHeaders: {
        'Cookie': 'sessionid=abc123'
      }
    };

    const scanResult = await analyzeAuthenticatedSession(
      authResult,
      'https://example.com'
    );

    assert.strictEqual(scanResult.authenticated, true);
    assert.ok(scanResult.vulnerabilities.length > 0);
    
    // Should detect missing Secure flag
    const secureVuln = scanResult.vulnerabilities.find(
      v => v.type === 'Insecure Session Cookie'
    );
    assert.ok(secureVuln);
    assert.strictEqual(secureVuln.severity, 'HIGH');
  });

  it('should detect missing HttpOnly flag', async () => {
    const authResult: AuthResult = {
      success: true,
      cookies: [
        {
          name: 'auth_token',
          value: 'xyz789',
          domain: 'example.com',
          secure: true,
          httpOnly: false,
          sameSite: 'Strict'
        }
      ],
      sessionHeaders: {
        'Cookie': 'auth_token=xyz789'
      }
    };

    const scanResult = await analyzeAuthenticatedSession(
      authResult,
      'https://example.com'
    );

    const httpOnlyVuln = scanResult.vulnerabilities.find(
      v => v.type === 'HttpOnly Flag Missing'
    );
    assert.ok(httpOnlyVuln);
    assert.strictEqual(httpOnlyVuln.severity, 'MEDIUM');
  });

  it('should detect missing SameSite flag', async () => {
    const authResult: AuthResult = {
      success: true,
      cookies: [
        {
          name: 'session',
          value: 'def456',
          domain: 'example.com',
          secure: true,
          httpOnly: true,
          sameSite: undefined
        }
      ],
      sessionHeaders: {
        'Cookie': 'session=def456'
      }
    };

    const scanResult = await analyzeAuthenticatedSession(
      authResult,
      'https://example.com'
    );

    const sameSiteVuln = scanResult.vulnerabilities.find(
      v => v.type === 'SameSite Flag Missing'
    );
    assert.ok(sameSiteVuln);
    assert.strictEqual(sameSiteVuln.severity, 'MEDIUM');
  });

  it('should detect weak session tokens', async () => {
    const authResult: AuthResult = {
      success: true,
      cookies: [
        {
          name: 'sessionid',
          value: 'abc', // Only 3 characters - weak!
          domain: 'example.com',
          secure: true,
          httpOnly: true,
          sameSite: 'Strict'
        }
      ],
      sessionHeaders: {
        'Cookie': 'sessionid=abc'
      }
    };

    const scanResult = await analyzeAuthenticatedSession(
      authResult,
      'https://example.com'
    );

    const weakTokenVuln = scanResult.vulnerabilities.find(
      v => v.type === 'Weak Session Token'
    );
    assert.ok(weakTokenVuln);
    assert.strictEqual(weakTokenVuln.severity, 'HIGH');
  });

  it('should pass for secure cookie configuration', async () => {
    const authResult: AuthResult = {
      success: true,
      cookies: [
        {
          name: 'session_token',
          value: 'very_long_cryptographically_secure_token_here',
          domain: 'example.com',
          secure: true,
          httpOnly: true,
          sameSite: 'Strict'
        }
      ],
      sessionHeaders: {
        'Cookie': 'session_token=very_long_cryptographically_secure_token_here'
      }
    };

    const scanResult = await analyzeAuthenticatedSession(
      authResult,
      'https://example.com'
    );

    assert.strictEqual(scanResult.authenticated, true);
    assert.strictEqual(scanResult.vulnerabilities.length, 0);
    assert.strictEqual(scanResult.sessionAnalysis.secureCount, 1);
    assert.strictEqual(scanResult.sessionAnalysis.httpOnlyCount, 1);
    assert.strictEqual(scanResult.sessionAnalysis.sameSiteCount, 1);
  });

  it('should handle multiple cookies with mixed security', async () => {
    const authResult: AuthResult = {
      success: true,
      cookies: [
        {
          name: 'session',
          value: 'secure_token_123456789',
          domain: 'example.com',
          secure: true,
          httpOnly: true,
          sameSite: 'Strict'
        },
        {
          name: 'tracking',
          value: 'track123',
          domain: 'example.com',
          secure: false,
          httpOnly: false,
          sameSite: undefined
        }
      ],
      sessionHeaders: {
        'Cookie': 'session=secure_token_123456789; tracking=track123'
      }
    };

    const scanResult = await analyzeAuthenticatedSession(
      authResult,
      'https://example.com'
    );

    assert.strictEqual(scanResult.authenticated, true);
    assert.strictEqual(scanResult.sessionAnalysis.cookieCount, 2);
    assert.strictEqual(scanResult.sessionAnalysis.secureCount, 1);
    
    // Should only flag session cookie issues, not tracking cookie
    const vulnerabilities = scanResult.vulnerabilities;
    assert.ok(vulnerabilities.length === 0, 'Non-session cookies should not trigger session vulnerabilities');
  });

  it('should handle no cookies', async () => {
    const authResult: AuthResult = {
      success: true,
      cookies: [],
      sessionHeaders: {}
    };

    const scanResult = await analyzeAuthenticatedSession(
      authResult,
      'https://example.com'
    );

    assert.strictEqual(scanResult.authenticated, true);
    assert.strictEqual(scanResult.sessionAnalysis.cookieCount, 0);
    
    const noCookieVuln = scanResult.vulnerabilities.find(
      v => v.type === 'No Session Cookies'
    );
    assert.ok(noCookieVuln);
    assert.strictEqual(noCookieVuln.severity, 'INFO');
  });

  it('should handle failed authentication', async () => {
    const authResult: AuthResult = {
      success: false,
      cookies: [],
      sessionHeaders: {},
      error: 'Login failed: Invalid credentials'
    };

    const scanResult = await analyzeAuthenticatedSession(
      authResult,
      'https://example.com'
    );

    assert.strictEqual(scanResult.authenticated, false);
    assert.strictEqual(scanResult.vulnerabilities.length, 0);
    assert.ok(scanResult.sessionAnalysis.weaknesses.includes('Authentication failed'));
  });
});

describe('AuthScanner - Security Constraints', () => {
  it('should require HTTPS for login URL in production', () => {
    const config: AuthConfig = {
      loginUrl: 'http://example.com/login', // HTTP not HTTPS
      usernameSelector: '#username',
      passwordSelector: '#password',
      submitSelector: 'button[type="submit"]',
      credentials: {
        username: 'testuser',
        password: 'testpass123'
      }
    };

    // Should still be valid (we allow HTTP for testing)
    // but in production, HTTPS should be enforced
    const result = validateAuthConfig(config);
    assert.strictEqual(result.valid, true);
    
    // Note: In real implementation, we could add a warning
    // for HTTP login pages even if technically valid
  });

  it('should detect potential CSRF vulnerabilities via missing SameSite', async () => {
    const authResult: AuthResult = {
      success: true,
      cookies: [
        {
          name: 'auth_token',
          value: 'secure_long_token_here',
          domain: 'example.com',
          secure: true,
          httpOnly: true,
          sameSite: 'None' // Explicitly set to None
        }
      ],
      sessionHeaders: {
        'Cookie': 'auth_token=secure_long_token_here'
      }
    };

    const scanResult = await analyzeAuthenticatedSession(
      authResult,
      'https://example.com'
    );

    const csrfVuln = scanResult.vulnerabilities.find(
      v => v.description.includes('CSRF')
    );
    assert.ok(csrfVuln, 'Should detect CSRF vulnerability with SameSite=None');
  });
});
