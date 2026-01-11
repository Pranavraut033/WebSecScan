/**
 * Extended tests for headerAnalyzer with new security checks
 * Tests CORS, Permissions-Policy, Spectre mitigation, and cross-origin scripts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { analyzeHeaders } from '../src/security/dynamic/headerAnalyzer.js';

describe('Header Analyzer - Extended Security Checks', () => {
  describe('CORS Configuration', () => {
    it('should pass when no CORS headers are present (restrictive)', async () => {
      const headers = { 'content-type': 'text/html' };
      const results = await analyzeHeaders('https://example.com', headers);
      const corsResult = results.find(r => r.testName === 'CORS Configuration');

      assert.ok(corsResult);
      assert.strictEqual(corsResult?.passed, true);
      assert.strictEqual(corsResult?.result, 'Info');
      assert.ok(corsResult?.reason.includes('same-origin only'));
    });

    it('should FAIL critically with wildcard + credentials', async () => {
      const headers = {
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true'
      };
      const results = await analyzeHeaders('https://example.com', headers);
      const corsResult = results.find(r => r.testName === 'CORS Configuration');

      assert.ok(corsResult);
      assert.strictEqual(corsResult?.passed, false);
      assert.strictEqual(corsResult?.score, -25);
      assert.strictEqual(corsResult?.result, 'Failed');
      assert.ok(corsResult?.reason.includes('CRITICAL'));
      assert.ok(corsResult?.reason.includes('wildcard'));
      assert.strictEqual(corsResult?.details?.owaspId, 'A02:2025');
      assert.strictEqual(corsResult?.details?.category, 'Security Misconfiguration');
    });

    it('should FAIL with wildcard origin (no credentials)', async () => {
      const headers = { 'access-control-allow-origin': '*' };
      const results = await analyzeHeaders('https://example.com', headers);
      const corsResult = results.find(r => r.testName === 'CORS Configuration');

      assert.ok(corsResult);
      assert.strictEqual(corsResult?.passed, false);
      assert.strictEqual(corsResult?.score, -10);
      assert.ok(corsResult?.reason.includes('wildcard'));
      assert.strictEqual(corsResult?.details?.owaspId, 'A02:2025');
    });

    it('should pass with specific origin', async () => {
      const headers = { 'access-control-allow-origin': 'https://trusted.example.com' };
      const results = await analyzeHeaders('https://example.com', headers);
      const corsResult = results.find(r => r.testName === 'CORS Configuration');

      assert.ok(corsResult);
      assert.strictEqual(corsResult?.passed, true);
      assert.ok(corsResult?.reason.includes('specific origin'));
    });
  });

  describe('Permissions-Policy', () => {
    it('should FAIL when Permissions-Policy is missing', async () => {
      const headers = { 'content-type': 'text/html' };
      const results = await analyzeHeaders('https://example.com', headers);
      const ppResult = results.find(r => r.testName === 'Permissions-Policy');

      assert.ok(ppResult);
      assert.strictEqual(ppResult?.passed, false);
      assert.strictEqual(ppResult?.score, -5);
      assert.ok(ppResult?.reason.includes('not implemented'));
      assert.ok(ppResult?.recommendation?.includes('camera'));
      assert.strictEqual(ppResult?.details?.owaspId, 'A02:2025');
    });

    it('should pass with properly configured Permissions-Policy', async () => {
      const headers = { 'permissions-policy': 'camera=(), microphone=(), geolocation=(self)' };
      const results = await analyzeHeaders('https://example.com', headers);
      const ppResult = results.find(r => r.testName === 'Permissions-Policy');

      assert.ok(ppResult);
      assert.strictEqual(ppResult?.passed, true);
      assert.strictEqual(ppResult?.score, 5);
      assert.ok(ppResult?.details?.configuredFeatures?.includes('camera'));
      assert.ok(ppResult?.details?.configuredFeatures?.includes('microphone'));
    });

    it('should FAIL with unrestricted sensitive features', async () => {
      const headers = { 'permissions-policy': 'camera=*, microphone=(*), geolocation=(self)' };
      const results = await analyzeHeaders('https://example.com', headers);
      const ppResult = results.find(r => r.testName === 'Permissions-Policy');

      assert.ok(ppResult);
      assert.strictEqual(ppResult?.passed, false);
      assert.strictEqual(ppResult?.score, -10);
      assert.ok(ppResult?.details?.unrestrictedFeatures?.includes('camera'));
      assert.ok(ppResult?.details?.unrestrictedFeatures?.includes('microphone'));
    });
  });

  describe('Spectre Mitigation Headers', () => {
    it('should FAIL when both COEP and COOP are missing', async () => {
      const headers = { 'content-type': 'text/html' };
      const results = await analyzeHeaders('https://example.com', headers);
      const spectreResult = results.find(r => r.testName === 'Spectre Mitigation Headers');

      assert.ok(spectreResult);
      assert.strictEqual(spectreResult?.passed, false);
      assert.strictEqual(spectreResult?.score, -5);
      assert.ok(spectreResult?.reason.includes('Missing Spectre mitigation headers'));
      assert.strictEqual(spectreResult?.details?.owaspId, 'A02:2025');
      assert.ok(spectreResult?.details?.vulnerability?.includes('Spectre'));
    });

    it('should pass with properly configured COEP and COOP', async () => {
      const headers = {
        'cross-origin-embedder-policy': 'require-corp',
        'cross-origin-opener-policy': 'same-origin'
      };
      const results = await analyzeHeaders('https://example.com', headers);
      const spectreResult = results.find(r => r.testName === 'Spectre Mitigation Headers');

      assert.ok(spectreResult);
      assert.strictEqual(spectreResult?.passed, true);
      assert.strictEqual(spectreResult?.score, 5);
      assert.ok(spectreResult?.reason.includes('properly configured'));
    });

    it('should FAIL with weak COEP value', async () => {
      const headers = {
        'cross-origin-embedder-policy': 'unsafe-none',
        'cross-origin-opener-policy': 'same-origin'
      };
      const results = await analyzeHeaders('https://example.com', headers);
      const spectreResult = results.find(r => r.testName === 'Spectre Mitigation Headers');

      assert.ok(spectreResult);
      assert.strictEqual(spectreResult?.passed, false);
      assert.ok(spectreResult?.reason.includes('weak value'));
    });

    it('should FAIL with only COEP', async () => {
      const headers = { 'cross-origin-embedder-policy': 'require-corp' };
      const results = await analyzeHeaders('https://example.com', headers);
      const spectreResult = results.find(r => r.testName === 'Spectre Mitigation Headers');

      assert.ok(spectreResult);
      assert.strictEqual(spectreResult?.passed, false);
      assert.ok(spectreResult?.reason.includes('Missing Cross-Origin-Opener-Policy'));
    });
  });

  describe('Cross-Origin Script Inclusions', () => {
    it('should pass when all scripts are same-origin', async () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="/js/app.js"></script>
            <script src="./utils.js"></script>
          </head>
          <body>
            <script src="/vendor/lib.js"></script>
          </body>
        </html>
      `;
      const results = await analyzeHeaders('https://example.com', {}, htmlContent);
      const scriptResult = results.find(r => r.testName === 'Cross-Origin Script Inclusions');

      assert.ok(scriptResult);
      assert.strictEqual(scriptResult?.passed, true);
      assert.strictEqual(scriptResult?.score, 5);
      assert.ok(scriptResult?.reason.includes('same origin'));
    });

    it('should FAIL when external scripts are present', async () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://external.com/malicious.js"></script>
            <script src="/js/app.js"></script>
          </head>
        </html>
      `;
      const results = await analyzeHeaders('https://example.com', {}, htmlContent);
      const scriptResult = results.find(r => r.testName === 'Cross-Origin Script Inclusions');

      assert.ok(scriptResult);
      assert.strictEqual(scriptResult?.passed, false);
      assert.strictEqual(scriptResult?.score, -10);
      assert.strictEqual(scriptResult?.details?.externalScriptCount, 1);
      assert.strictEqual(scriptResult?.details?.owaspId, 'A02:2025');
      assert.ok(scriptResult?.recommendation?.includes('SRI'));
    });

    it('should detect CDN scripts', async () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://cdn.jsdelivr.net/npm/vue@3.0.0/dist/vue.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
          </head>
        </html>
      `;
      const results = await analyzeHeaders('https://example.com', {}, htmlContent);
      const scriptResult = results.find(r => r.testName === 'Cross-Origin Script Inclusions');

      assert.ok(scriptResult);
      assert.strictEqual(scriptResult?.passed, false);
      assert.strictEqual(scriptResult?.details?.cdnScriptCount, 2);
      assert.strictEqual(scriptResult?.details?.externalScriptCount, 2);
    });

    it('should detect protocol-relative URLs', async () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="//external.com/script.js"></script>
          </head>
        </html>
      `;
      const results = await analyzeHeaders('https://example.com', {}, htmlContent);
      const scriptResult = results.find(r => r.testName === 'Cross-Origin Script Inclusions');

      assert.ok(scriptResult);
      assert.strictEqual(scriptResult?.passed, false);
      assert.strictEqual(scriptResult?.details?.externalScriptCount, 1);
    });

    it('should ignore data URIs', async () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="data:text/javascript,console.log('test')"></script>
            <script src="/local.js"></script>
          </head>
        </html>
      `;
      const results = await analyzeHeaders('https://example.com', {}, htmlContent);
      const scriptResult = results.find(r => r.testName === 'Cross-Origin Script Inclusions');

      assert.ok(scriptResult);
      assert.strictEqual(scriptResult?.passed, true);
    });

    it('should not run when HTML content is missing', async () => {
      const results = await analyzeHeaders('https://example.com', {});
      const scriptResult = results.find(r => r.testName === 'Cross-Origin Script Inclusions');

      // Should not be present when HTML content is not provided
      assert.strictEqual(scriptResult, undefined);
    });
  });

  describe('Integration - All Checks', () => {
    it('should run all security header checks', async () => {
      const headers = {
        'strict-transport-security': 'max-age=31536000; includeSubDomains',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'content-security-policy': "default-src 'self'",
        'access-control-allow-origin': 'https://trusted.com',
        'permissions-policy': 'camera=(), microphone=()',
        'cross-origin-embedder-policy': 'require-corp',
        'cross-origin-opener-policy': 'same-origin'
      };

      const htmlContent = '<script src="/app.js"></script>';

      const results = await analyzeHeaders('https://example.com', headers, htmlContent);

      // Should have all checks
      assert.ok(results.length >= 9);

      // Verify all key checks are present
      assert.ok(results.find(r => r.testName === 'Strict Transport Security (HSTS)'));
      assert.ok(results.find(r => r.testName === 'CORS Configuration'));
      assert.ok(results.find(r => r.testName === 'Permissions-Policy'));
      assert.ok(results.find(r => r.testName === 'Spectre Mitigation Headers'));
      assert.ok(results.find(r => r.testName === 'Cross-Origin Script Inclusions'));
    });
  });
});
