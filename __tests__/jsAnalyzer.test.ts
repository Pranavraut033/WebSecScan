/**
 * Unit tests for JavaScript Analyzer
 * Tests deterministic detection of dangerous JavaScript patterns
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { analyzeJavaScript } from '../src/security/static/jsAnalyzer.ts';

describe('JavaScript Analyzer', () => {
  describe('eval() detection', () => {
    it('should detect eval() usage', async () => {
      const code = `
        function test() {
          const result = eval('2 + 2');
          return result;
        }
      `;

      const result = await analyzeJavaScript(code, 'test.js');

      assert.ok(result.vulnerabilities.length > 0, 'Should find vulnerabilities');
      const evalVuln = result.vulnerabilities.find(v => v.type.includes('eval'));
      assert.ok(evalVuln, 'Should find eval vulnerability');
      assert.strictEqual(evalVuln.severity, 'CRITICAL');
    });

    it('should not flag eval in comments', async () => {
      const code = `
        // Use eval() is dangerous
        /* Don't use eval() */
        function safeFunction() {
          return JSON.parse('{}');
        }
      `;

      const result = await analyzeJavaScript(code, 'test.js');
      const evalVuln = result.vulnerabilities.find(v => v.type.includes('eval'));
      assert.strictEqual(evalVuln, undefined, 'Should not flag eval in comments');
    });
  });

  describe('Function() constructor detection', () => {
    it('should detect new Function()', async () => {
      const code = `
        const fn = new Function('a', 'b', 'return a + b');
      `;

      const result = await analyzeJavaScript(code, 'test.js');

      const functionVuln = result.vulnerabilities.find(v =>
        v.description.includes('Function()')
      );
      assert.ok(functionVuln, 'Should find Function constructor vulnerability');
    });
  });

  describe('innerHTML detection', () => {
    it('should detect innerHTML usage', async () => {
      const code = `
        function render(content) {
          document.getElementById('output').innerHTML = content;
        }
      `;

      const result = await analyzeJavaScript(code, 'test.js');

      const innerHTMLVuln = result.vulnerabilities.find(v =>
        v.type.includes('innerHTML')
      );
      assert.ok(innerHTMLVuln, 'Should find innerHTML vulnerability');
      assert.strictEqual(innerHTMLVuln.severity, 'HIGH');
    });

    it('should detect dangerouslySetInnerHTML', async () => {
      const code = `
        <div dangerouslySetInnerHTML={{__html: userContent}} />
      `;

      const result = await analyzeJavaScript(code, 'test.jsx');

      const dangerousVuln = result.vulnerabilities.find(v =>
        v.description.includes('dangerouslySetInnerHTML')
      );
      assert.ok(dangerousVuln, 'Should find dangerouslySetInnerHTML usage');
    });
  });

  describe('Hardcoded secrets detection', () => {
    it('should detect hardcoded API keys', async () => {
      const code = `
        const config = {
          api_key: "sk_live_abc123def456ghi789",
          secret: "my-secret-key-123456"
        };
      `;

      const result = await analyzeJavaScript(code, 'config.js');

      assert.ok(result.vulnerabilities.length > 0, 'Should find secret vulnerabilities');
      const secretVuln = result.vulnerabilities.find(v =>
        v.type.includes('Hardcoded Secret')
      );
      assert.ok(secretVuln, 'Should find hardcoded secret');
      assert.strictEqual(secretVuln.severity, 'CRITICAL');
      assert.ok(secretVuln.evidence?.includes('REDACTED'), 'Should redact actual secret');
    });

    it('should detect hardcoded passwords', async () => {
      const code = `
        const db = {
          password: "admin123",
          dbPassword: "supersecret"
        };
      `;

      const result = await analyzeJavaScript(code, 'config.js');

      const passwordVuln = result.vulnerabilities.find(v =>
        v.evidence?.toLowerCase().includes('password')
      );
      assert.ok(passwordVuln, 'Should find hardcoded password');
    });

    it('should skip placeholder values', async () => {
      const code = `
        const config = {
          password: "your_password_here",
          api_key: "example_key_12345"
        };
      `;

      const result = await analyzeJavaScript(code, 'config.js');

      // Should not flag obvious placeholders
      assert.strictEqual(result.vulnerabilities.length, 0, 'Should skip placeholder values');
    });
  });

  describe('Safe code should pass', () => {
    it('should not flag safe alternatives', async () => {
      const code = `
        function safeFunction() {
          const data = JSON.parse('{"key": "value"}');
          document.getElementById('output').textContent = data.key;
          return data;
        }
      `;

      const result = await analyzeJavaScript(code, 'safe.js');

      assert.strictEqual(result.vulnerabilities.length, 0, 'Should not flag safe code');
    });
  });
});
