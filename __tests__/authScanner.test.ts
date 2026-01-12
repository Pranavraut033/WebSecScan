/**
 * Unit tests for Authentication Scanner
 * 
 * Tests real authentication configuration validation and session analysis logic
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateAuthConfig,
  analyzeAuthenticatedSession,
  type AuthConfig,
  type AuthResult
} from '../src/security/dynamic/authScanner.ts';

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
    assert.strictEqual(result.valid, true, 'Valid config should pass');
    assert.strictEqual(result.errors.length, 0, 'Should have no errors');
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
    assert.strictEqual(result.valid, false, 'Empty login URL should fail');
    assert.ok(result.errors.some(e => e.includes('Login URL')), 'Should report login URL error');
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
    assert.strictEqual(result.valid, false, 'Non-HTTP(S) protocol should fail');
    assert.ok(result.errors.some(e => e.includes('HTTP/HTTPS')), 'Should report protocol error');
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
    assert.strictEqual(result.valid, false, 'Missing selector should fail');
    assert.ok(result.errors.some(e => e.includes('Username selector')), 'Should report selector error');
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
    assert.strictEqual(result.valid, false, 'Missing username should fail');
    assert.ok(result.errors.some(e => e.includes('Username is required')), 'Should report credential error');
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
    assert.strictEqual(result.valid, false, 'Whitespace-only username should fail');
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

    assert.strictEqual(scanResult.authenticated, true, 'Should recognize authenticated session');
    assert.ok(scanResult.vulnerabilities.length > 0, 'Should detect vulnerabilities');
    
    // Should detect missing Secure flag
    const secureVuln = scanResult.vulnerabilities.find(
      v => v.type === 'Insecure Session Cookie'
    );
    assert.ok(secureVuln, 'Should detect missing Secure flag');
    assert.strictEqual(secureVuln.severity, 'HIGH', 'Insecure cookie should be HIGH severity');
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
    assert.ok(httpOnlyVuln, 'Should detect missing HttpOnly flag');
    assert.strictEqual(httpOnlyVuln.severity, 'MEDIUM', 'HttpOnly missing should be MEDIUM severity');
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
    assert.ok(sameSiteVuln, 'Should detect missing SameSite flag');
    assert.strictEqual(sameSiteVuln.severity, 'MEDIUM', 'SameSite missing should be MEDIUM severity');
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
    assert.ok(weakTokenVuln, 'Should detect weak session token');
    assert.strictEqual(weakTokenVuln.severity, 'HIGH', 'Weak token should be HIGH severity');
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

    assert.strictEqual(scanResult.authenticated, true, 'Should recognize authenticated session');
    assert.strictEqual(scanResult.vulnerabilities.length, 0, 'Should not flag secure cookies');
    assert.strictEqual(scanResult.sessionAnalysis.secureCount, 1, 'Should count secure cookie');
    assert.strictEqual(scanResult.sessionAnalysis.httpOnlyCount, 1, 'Should count httpOnly cookie');
    assert.strictEqual(scanResult.sessionAnalysis.sameSiteCount, 1, 'Should count sameSite cookie');
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

    assert.strictEqual(scanResult.authenticated, true, 'Should recognize authenticated session');
    assert.strictEqual(scanResult.sessionAnalysis.cookieCount, 2, 'Should count both cookies');
    assert.strictEqual(scanResult.sessionAnalysis.secureCount, 1, 'Should count one secure cookie');
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

    assert.strictEqual(scanResult.authenticated, true, 'Should still be authenticated');
    assert.strictEqual(scanResult.sessionAnalysis.cookieCount, 0, 'Should have zero cookies');
    
    const noCookieVuln = scanResult.vulnerabilities.find(
      v => v.type === 'No Session Cookies'
    );
    assert.ok(noCookieVuln, 'Should detect absence of session cookies');
    assert.strictEqual(noCookieVuln.severity, 'INFO', 'No cookies should be INFO severity');
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

    assert.strictEqual(scanResult.authenticated, false, 'Should not be authenticated');
    assert.strictEqual(scanResult.vulnerabilities.length, 0, 'Should not report vulnerabilities for failed auth');
    assert.ok(scanResult.sessionAnalysis.weaknesses.includes('Authentication failed'), 'Should note auth failure');
  });

  it('should detect CSRF vulnerability with SameSite=None', async () => {
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
