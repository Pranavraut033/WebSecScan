/**
 * Unit tests for CSRF Protection
 * Tests real CSRF validation and same-origin checking functions
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateSameOrigin, validateApiRequest, generateCsrfToken } from '../src/lib/csrf.ts';
import { NextRequest } from 'next/server';

describe('CSRF Protection - Same Origin Validation', () => {
  it('should allow requests from same origin', () => {
    const request = new NextRequest('http://localhost:3000/api/scan/start', {
      method: 'POST',
      headers: {
        'origin': 'http://localhost:3000',
        'host': 'localhost:3000',
      },
    });

    const result = validateSameOrigin(request);
    assert.strictEqual(result, true, 'Should allow same-origin POST');
  });

  it('should reject requests from different origin', () => {
    const request = new NextRequest('http://localhost:3000/api/scan/start', {
      method: 'POST',
      headers: {
        'origin': 'http://evil.com',
        'host': 'localhost:3000',
      },
    });

    const result = validateSameOrigin(request);
    assert.strictEqual(result, false, 'Should reject cross-origin POST');
  });

  it('should allow GET requests without origin header', () => {
    const request = new NextRequest('http://localhost:3000/api/scan/status', {
      method: 'GET',
      headers: {
        'host': 'localhost:3000',
      },
    });

    const result = validateSameOrigin(request);
    assert.strictEqual(result, true, 'Should allow GET without origin (direct navigation)');
  });

  it('should reject POST requests without origin or referer', () => {
    const request = new NextRequest('http://localhost:3000/api/scan/start', {
      method: 'POST',
      headers: {
        'host': 'localhost:3000',
      },
    });

    const result = validateSameOrigin(request);
    assert.strictEqual(result, false, 'Should reject POST without origin/referer');
  });

  it('should validate using referer when origin is not present', () => {
    const request = new NextRequest('http://localhost:3000/api/scan/start', {
      method: 'POST',
      headers: {
        'referer': 'http://localhost:3000/scan',
        'host': 'localhost:3000',
      },
    });

    const result = validateSameOrigin(request);
    assert.strictEqual(result, true, 'Should use referer when origin missing');
  });

  it('should reject when referer is from different origin', () => {
    const request = new NextRequest('http://localhost:3000/api/scan/start', {
      method: 'POST',
      headers: {
        'referer': 'http://evil.com/attack',
        'host': 'localhost:3000',
      },
    });

    const result = validateSameOrigin(request);
    assert.strictEqual(result, false, 'Should reject referer from different origin');
  });

  it('should handle port numbers correctly', () => {
    const request = new NextRequest('http://localhost:3000/api/scan/start', {
      method: 'POST',
      headers: {
        'origin': 'http://localhost:3000',
        'host': 'localhost:3000',
      },
    });

    const result = validateSameOrigin(request);
    assert.strictEqual(result, true, 'Should match with port numbers');
  });

  it('should reject when hostnames differ', () => {
    const request = new NextRequest('http://example.com/api/scan/start', {
      method: 'POST',
      headers: {
        'origin': 'http://example.com',
        'host': 'different.com',
      },
    });

    const result = validateSameOrigin(request);
    assert.strictEqual(result, false, 'Should reject when hostnames differ');
  });
});

describe('CSRF Protection - API Request Validation', () => {
  it('should validate POST requests with same origin', async () => {
    const request = new NextRequest('http://localhost:3000/api/scan/start', {
      method: 'POST',
      headers: {
        'origin': 'http://localhost:3000',
        'host': 'localhost:3000',
        'content-type': 'application/json',
      },
    });

    const result = await validateApiRequest(request);
    assert.strictEqual(result.valid, true, 'Should validate same-origin POST');
  });

  it('should reject POST requests from different origin', async () => {
    const request = new NextRequest('http://localhost:3000/api/scan/start', {
      method: 'POST',
      headers: {
        'origin': 'http://attacker.com',
        'host': 'localhost:3000',
      },
    });

    const result = await validateApiRequest(request);
    assert.strictEqual(result.valid, false, 'Should reject cross-origin POST');
    assert.ok(result.error?.includes('Cross-origin'), 'Should return appropriate error message');
  });

  it('should allow GET requests from same origin', async () => {
    const request = new NextRequest('http://localhost:3000/api/scan/status', {
      method: 'GET',
      headers: {
        'origin': 'http://localhost:3000',
        'host': 'localhost:3000',
      },
    });

    const result = await validateApiRequest(request);
    assert.strictEqual(result.valid, true, 'Should allow same-origin GET');
  });
});

describe('CSRF Protection - Token Generation', () => {
  it('should generate cryptographically secure tokens', () => {
    const token1 = generateCsrfToken();
    const token2 = generateCsrfToken();

    assert.ok(token1.length > 32, 'Token should be sufficiently long');
    assert.ok(token2.length > 32, 'Token should be sufficiently long');
    assert.notStrictEqual(token1, token2, 'Tokens should be unique');
  });

  it('should generate URL-safe tokens', () => {
    const token = generateCsrfToken();

    // base64url encoding uses [-_A-Za-z0-9]
    const urlSafePattern = /^[A-Za-z0-9_-]+$/;
    assert.ok(urlSafePattern.test(token), 'Token should be URL-safe');
  });
});
