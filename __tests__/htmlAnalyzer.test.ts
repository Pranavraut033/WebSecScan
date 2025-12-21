/**
 * Unit tests for HTML Analyzer
 * Tests deterministic detection of HTML security issues
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { analyzeHTML } from '../src/security/static/htmlAnalyzer.ts';

describe('HTML Analyzer', () => {
  describe('Content Security Policy detection', () => {
    it('should detect missing CSP', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Test</title></head>
          <body><h1>Hello</h1></body>
        </html>
      `;

      const result = await analyzeHTML(html, 'https://example.com');

      const cspVuln = result.vulnerabilities.find(v =>
        v.type.includes('Content Security Policy')
      );
      assert.ok(cspVuln, 'Should detect missing CSP');
      assert.strictEqual(cspVuln.severity, 'MEDIUM');
    });

    it('should detect weak CSP with unsafe-inline', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'">
            <title>Test</title>
          </head>
          <body><h1>Hello</h1></body>
        </html>
      `;

      const result = await analyzeHTML(html, 'https://example.com');

      const weakCSP = result.vulnerabilities.find(v =>
        v.type.includes('Weak') && v.type.includes('CSP')
      );
      assert.ok(weakCSP, 'Should detect weak CSP');
      assert.ok(weakCSP.evidence?.includes('unsafe-inline'), 'Should mention unsafe-inline');
    });

    it('should detect weak CSP with unsafe-eval', async () => {
      const html = `
        <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-eval'">
      `;

      const result = await analyzeHTML(html, 'https://example.com');

      const weakCSP = result.vulnerabilities.find(v =>
        v.evidence?.includes('unsafe-eval')
      );
      assert.ok(weakCSP, 'Should detect unsafe-eval in CSP');
    });
  });

  describe('Inline script detection', () => {
    it('should detect inline scripts without nonce', async () => {
      const html = `
        <script>
          console.log('Inline script without nonce');
          const data = { key: 'value' };
        </script>
      `;

      const result = await analyzeHTML(html, 'https://example.com');

      const inlineScript = result.vulnerabilities.find(v =>
        v.description.includes('inline script')
      );
      assert.ok(inlineScript, 'Should detect inline script without nonce');
    });

    it('should not flag external scripts', async () => {
      const html = `
        <script src="https://cdn.example.com/app.js"></script>
      `;

      const result = await analyzeHTML(html, 'https://example.com');

      const inlineScript = result.vulnerabilities.find(v =>
        v.description.includes('inline script')
      );
      assert.strictEqual(inlineScript, undefined, 'Should not flag external scripts');
    });
  });

  describe('Form security checks', () => {
    it('should detect form without action attribute', async () => {
      const html = `
        <form method="POST">
          <input type="text" name="username">
          <button type="submit">Submit</button>
        </form>
      `;

      const result = await analyzeHTML(html, 'https://example.com');

      const formVuln = result.vulnerabilities.find(v =>
        v.type.includes('Missing Action')
      );
      assert.ok(formVuln, 'Should detect form without action');
      assert.strictEqual(formVuln.severity, 'LOW');
    });

    it('should detect form with HTTP action', async () => {
      const html = `
        <form action="http://example.com/submit" method="POST">
          <input type="password" name="password">
          <button type="submit">Login</button>
        </form>
      `;

      const result = await analyzeHTML(html, 'https://example.com');

      const httpFormVuln = result.vulnerabilities.find(v =>
        v.evidence?.includes('http://')
      );
      assert.ok(httpFormVuln, 'Should detect HTTP form action');
      assert.strictEqual(httpFormVuln.severity, 'HIGH');
    });

    it('should allow HTTPS form actions', async () => {
      const html = `
        <form action="https://example.com/submit" method="POST">
          <input type="text" name="data">
        </form>
      `;

      const result = await analyzeHTML(html, 'https://example.com');

      // Should not flag HTTPS as insecure protocol issue
      const httpVuln = result.vulnerabilities.find(v =>
        v.ruleId === 'WSS-FORM-002'
      );
      assert.strictEqual(httpVuln, undefined, 'Should not flag HTTPS forms');
    });
  });

  describe('Safe HTML should pass', () => {
    it('should not flag well-secured HTML', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'">
            <title>Secure Page</title>
          </head>
          <body>
            <h1>Hello World</h1>
            <script src="/app.js"></script>
            <form action="https://example.com/submit" method="POST">
              <input type="text" name="data">
              <button type="submit">Submit</button>
            </form>
          </body>
        </html>
      `;

      const result = await analyzeHTML(html, 'https://example.com');

      assert.strictEqual(result.vulnerabilities.length, 0, 'Should not flag secure HTML');
    });
  });
});
