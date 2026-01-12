/**
 * Unit tests for HTML Analyzer
 * Tests deterministic detection of HTML security issues
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { analyzeHTML } from '../src/security/static/htmlAnalyzer.ts';

describe('HTML Analyzer - Form Security', () => {
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

describe('HTML Analyzer - Edge Cases', () => {
  it('should handle empty HTML', async () => {
    const result = await analyzeHTML('', 'http://example.com/empty.html');
    assert.ok(Array.isArray(result.vulnerabilities), 'Should return array for empty HTML');
  });

  it('should handle malformed HTML', async () => {
    const html = `<div><script>alert(1)</div></script>`;
    const result = await analyzeHTML(html, 'http://example.com/malformed.html');
    assert.ok(Array.isArray(result.vulnerabilities), 'Should handle malformed HTML gracefully');
  });

  it('should handle very large HTML documents', async () => {
    const largeHtml = '<div>' + 'x'.repeat(100000) + '</div>';
    const result = await analyzeHTML(largeHtml, 'http://example.com/large.html');
    assert.ok(Array.isArray(result.vulnerabilities), 'Should handle large HTML documents');
  });
});

describe('HTML Analyzer - Safe HTML', () => {
  it('should not flag well-secured forms', async () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Secure Page</title>
        </head>
        <body>
          <h1>Hello World</h1>
          <form action="https://example.com/submit" method="POST">
            <input type="text" name="data">
            <button type="submit">Submit</button>
          </form>
        </body>
      </html>
    `;

    const result = await analyzeHTML(html, 'https://example.com');

    // Should not have critical or high severity issues
    const criticalIssues = result.vulnerabilities.filter(v =>
      v.severity === 'CRITICAL' || v.severity === 'HIGH'
    );
    assert.strictEqual(criticalIssues.length, 0, 'Should not flag secure HTML with critical/high issues');
  });
});
