/**
 * URL Normalizer Tests
 * 
 * Tests URL normalization, HTTPS preference, redirect detection,
 * and HTTP security threat identification.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizeUrl, validateUrlFormat } from '../src/lib/urlNormalizer.ts';

describe('URL Normalizer', () => {
  describe('validateUrlFormat', () => {
    it('should reject empty URLs', () => {
      const result = validateUrlFormat('');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.includes('empty'));
    });

    it('should reject URLs with embedded credentials', () => {
      const result = validateUrlFormat('https://user:pass@example.com');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.includes('credentials'));
    });

    it('should accept valid URLs with protocol', () => {
      const result = validateUrlFormat('https://example.com');
      assert.strictEqual(result.valid, true);
    });

    it('should accept URLs without protocol', () => {
      const result = validateUrlFormat('example.com');
      assert.strictEqual(result.valid, true);
    });

    it('should accept URLs with paths and query params', () => {
      const result = validateUrlFormat('https://example.com/path?query=value');
      assert.strictEqual(result.valid, true);
    });
  });

  describe('normalizeUrl', () => {
    it('should add HTTPS protocol if missing', async () => {
      // Mock fetch globally
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        status: 200,
        url: 'https://example.com',
      } as Response);

      try {
        const result = await normalizeUrl('example.com', { checkRedirects: false });

        assert.strictEqual(result.normalizedUrl, 'https://example.com');
        assert.strictEqual(result.protocol, 'https');
        assert.ok(result.warnings.some(w => w.includes('HTTPS')));
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should upgrade HTTP to HTTPS if available', async () => {
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        status: 200,
        url: 'https://example.com',
      } as Response);

      try {
        const result = await normalizeUrl('http://example.com', { checkRedirects: false });

        assert.strictEqual(result.normalizedUrl, 'https://example.com');
        assert.strictEqual(result.protocol, 'https');
        assert.ok(result.warnings.some(w => w.includes('upgraded')));
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should flag HTTP as security threat when HTTPS unavailable', async () => {
      const originalFetch = global.fetch;
      let callCount = 0;
      global.fetch = async () => {
        callCount++;
        if (callCount === 1) {
          // HTTPS fails
          throw new Error('Connection refused');
        }
        // HTTP succeeds
        return {
          status: 200,
          url: 'http://example.com',
        } as Response;
      };

      try {
        const result = await normalizeUrl('http://example.com', { checkRedirects: false });

        assert.strictEqual(result.normalizedUrl, 'http://example.com');
        assert.strictEqual(result.protocol, 'http');
        assert.strictEqual(result.securityThreats.length, 1);
        assert.strictEqual(result.securityThreats[0].type, 'INSECURE_PROTOCOL');
        assert.strictEqual(result.securityThreats[0].severity, 'HIGH');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should detect www redirect', async () => {
      const originalFetch = global.fetch;
      let callCount = 0;
      global.fetch = async (input: string | URL | Request) => {
        callCount++;
        const url = typeof input === 'string' ? input : input.toString();
        if (callCount === 1) {
          // First call: connection test
          return {
            status: 200,
            url: url,
          } as Response;
        }
        // Second call: redirect check - simulate redirect to www
        return {
          status: 200,
          url: 'https://www.example.com',
        } as Response;
      };

      try {
        const result = await normalizeUrl('example.com', { checkRedirects: true });

        assert.strictEqual(result.redirected, true);
        assert.strictEqual(result.isWwwRedirect, true);
        assert.strictEqual(result.redirectedTo, 'https://www.example.com');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle connection failures gracefully', async () => {
      const originalFetch = global.fetch;
      global.fetch = async () => {
        throw new Error('Network error');
      };

      try {
        let errorThrown = false;
        try {
          await normalizeUrl('https://invalid.test', { checkRedirects: false });
        } catch (error) {
          errorThrown = true;
          assert.ok(error instanceof Error);
          assert.ok(error.message.includes('not accessible'));
        }
        assert.ok(errorThrown, 'Should have thrown an error');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should flag HTTP even when provided explicitly', async () => {
      const originalFetch = global.fetch;
      global.fetch = async () => ({
        status: 200,
        url: 'http://example.com',
      } as Response);

      try {
        const result = await normalizeUrl('http://example.com', {
          preferHttps: false,
          checkRedirects: false
        });

        assert.strictEqual(result.normalizedUrl, 'http://example.com');
        assert.strictEqual(result.securityThreats.length, 1);
        assert.strictEqual(result.securityThreats[0].type, 'INSECURE_PROTOCOL');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle redirects with different paths', async () => {
      const originalFetch = global.fetch;
      let callCount = 0;
      global.fetch = async (input: string | URL | Request) => {
        callCount++;
        const url = typeof input === 'string' ? input : input.toString();
        if (callCount === 1) {
          // First call: connection test
          return {
            status: 200,
            url: url,
          } as Response;
        }
        // Second call: redirect check - different path
        return {
          status: 200,
          url: 'https://example.com/page-new',
        } as Response;
      };

      try {
        const result = await normalizeUrl('example.com/page', { checkRedirects: true });

        assert.strictEqual(result.redirected, true);
        assert.strictEqual(result.isWwwRedirect, false);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
