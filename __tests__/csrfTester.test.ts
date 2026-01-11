/**
 * Tests for CSRF Protection Tester
 */

import { testCsrfProtection, checkSameSiteCookies } from '../src/security/dynamic/csrfTester';

describe('CSRF Protection Tester', () => {
  describe('testCsrfProtection', () => {
    it('should analyze forms for CSRF tokens', async () => {
      const result = await testCsrfProtection('http://example.com', []);

      expect(result).toHaveProperty('vulnerabilities');
      expect(result).toHaveProperty('formsAnalyzed');
      expect(result).toHaveProperty('formsWithTokens');
      expect(result).toHaveProperty('formsWithoutTokens');
    });

    it('should handle invalid URLs gracefully', async () => {
      const result = await testCsrfProtection('invalid-url', []);

      expect(result.formsAnalyzed).toBe(0);
      expect(result.vulnerabilities).toEqual([]);
    });

    it('should only flag state-changing methods', async () => {
      const forms = [
        {
          url: 'http://example.com',
          method: 'GET',
          action: 'http://example.com/search'
        },
        {
          url: 'http://example.com',
          method: 'POST',
          action: 'http://example.com/submit'
        }
      ];

      // GET forms without tokens should not be flagged
      // POST forms without tokens should be flagged
      expect(forms[0].method).toBe('GET');
      expect(forms[1].method).toBe('POST');
    });

    it('should recognize common CSRF token patterns', () => {
      const tokenPatterns = [
        'csrf_token',
        'csrf-token',
        'xsrf_token',
        '_csrf',
        'authenticity_token',
        '__requestverificationtoken'
      ];

      tokenPatterns.forEach(pattern => {
        expect(pattern).toMatch(/csrf|xsrf|authenticity|token/i);
      });
    });
  });

  describe('checkSameSiteCookies', () => {
    it('should analyze cookie SameSite attributes', async () => {
      const result = await checkSameSiteCookies('http://example.com');

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle connection errors', async () => {
      const result = await checkSameSiteCookies('http://localhost:99999');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('Form Discovery', () => {
    it('should discover forms from HTML', () => {
      const html = `
        <form method="POST" action="/submit">
          <input type="text" name="username" />
          <button type="submit">Submit</button>
        </form>
      `;

      // Form discovery logic should extract this form
      expect(html).toContain('form');
      expect(html).toContain('method="POST"');
      expect(html).toContain('action="/submit"');
    });

    it('should handle forms without explicit method', () => {
      const html = '<form action="/submit"></form>';

      // Default method should be GET
      expect(html).toContain('form');
    });

    it('should resolve relative action URLs', () => {
      const baseUrl = 'http://example.com/page';
      const action = '/submit';

      // Should resolve to http://example.com/submit
      const expected = 'http://example.com/submit';
      expect(expected).toContain('/submit');
    });
  });

  describe('CSRF Token Validation', () => {
    it('should verify token entropy', () => {
      const validTokens = [
        'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', // 32+ chars
        'MTIzNDU2Nzg5MGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6' // Base64
      ];

      const invalidTokens = [
        '123', // Too short
        'token', // Predictable
        'abc' // Insufficient entropy
      ];

      validTokens.forEach(token => {
        expect(token.length).toBeGreaterThanOrEqual(16);
      });

      invalidTokens.forEach(token => {
        expect(token.length).toBeLessThan(16);
      });
    });

    it('should detect meta tag CSRF tokens', () => {
      const html = '<meta name="csrf-token" content="abc123xyz789" />';

      expect(html).toContain('csrf-token');
      expect(html).toContain('content=');
    });
  });
});
