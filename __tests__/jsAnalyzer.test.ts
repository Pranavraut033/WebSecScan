/**
 * Unit tests for JavaScript Analyzer
 * Tests deterministic detection of dangerous JavaScript patterns
 * and context-aware confidence scoring
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  analyzeJavaScript,
  detectFramework,
  detectMinifiedCode
} from '../src/security/static/jsAnalyzer.ts';

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

  describe('Context-aware confidence scoring', () => {
    describe('Framework detection', () => {
      it('should detect Angular framework code', () => {
        const angularCode = `
          import { Component } from '@angular/core';
          @Component({ selector: 'app-root' })
          export class AppComponent {
            ngOnInit() {
              eval('console.log("test")');
            }
          }
        `;

        const result = detectFramework(angularCode);
        assert.strictEqual(result.isFramework, true, 'Should detect Angular');
        assert.strictEqual(result.frameworkName, 'Angular', 'Should identify Angular framework');
      });

      it('should detect React framework code', () => {
        const reactCode = `
          import React from 'react';
          class MyComponent extends React.Component {
            render() {
              return React.createElement('div', null, 'Hello');
            }
          }
        `;

        const result = detectFramework(reactCode);
        assert.strictEqual(result.isFramework, true, 'Should detect React');
        assert.strictEqual(result.frameworkName, 'React', 'Should identify React framework');
      });

      it('should detect Vue framework code', () => {
        const vueCode = `
          import { defineComponent } from 'vue';
          export default defineComponent({
            name: 'MyComponent'
          });
        `;

        const result = detectFramework(vueCode);
        assert.strictEqual(result.isFramework, true, 'Should detect Vue');
        assert.strictEqual(result.frameworkName, 'Vue', 'Should identify Vue framework');
      });

      it('should detect jQuery library code', () => {
        const jQueryCode = `
          $(document).ready(function() {
            $('.btn').click(function() {
              eval(userInput);
            });
          });
        `;

        const result = detectFramework(jQueryCode);
        assert.strictEqual(result.isFramework, true, 'Should detect jQuery');
        assert.strictEqual(result.frameworkName, 'jQuery', 'Should identify jQuery');
      });

      it('should not detect framework in plain JavaScript', () => {
        const plainCode = `
          function myFunction() {
            const data = { key: 'value' };
            return data;
          }
        `;

        const result = detectFramework(plainCode);
        assert.strictEqual(result.isFramework, false, 'Should not detect framework');
      });
    });

    describe('Minified code detection', () => {
      it('should detect minified code with long lines', () => {
        const minifiedCode = 'function a(){var b=1,c=2,d=3,e=4,f=5,g=6;return eval(b+c+d+e+f+g)}' + 'x'.repeat(500);

        const result = detectMinifiedCode(minifiedCode);
        assert.strictEqual(result, true, 'Should detect minified code by line length');
      });

      it('should detect webpack bundled code', () => {
        const webpackCode = `
          (function(modules) {
            var installedModules = {};
            function __webpack_require__(moduleId) {
              if(installedModules[moduleId]) {
                return installedModules[moduleId].exports;
              }
            }
          })([]);
        `;

        const result = detectMinifiedCode(webpackCode);
        assert.strictEqual(result, true, 'Should detect webpack bundle');
      });

      it('should detect UMD pattern', () => {
        const umdCode = `
          (function (root, factory) {
            if (typeof exports === 'object' && typeof module === 'object')
              module.exports = factory();
            else if (typeof define === 'function')
              define([], factory);
          }(this, function() { return eval('test'); }));
        `;

        const result = detectMinifiedCode(umdCode);
        assert.strictEqual(result, true, 'Should detect UMD pattern');
      });

      it('should not detect normal formatted code as minified', () => {
        const normalCode = `
          function calculateTotal(items) {
            let total = 0;
            for (const item of items) {
              total += item.price;
            }
            return total;
          }
        `;

        const result = detectMinifiedCode(normalCode);
        assert.strictEqual(result, false, 'Should not flag normal code as minified');
      });
    });

    describe('Confidence adjustment', () => {
      it('should downgrade confidence for eval in framework code', async () => {
        const angularCode = `
          import { Component } from '@angular/core';
          @Component({ selector: 'app-test' })
          export class TestComponent {
            test() {
              eval('2 + 2');
            }
          }
        `;

        const result = await analyzeJavaScript(angularCode, 'angular.ts', false);

        const evalVuln = result.vulnerabilities.find(v => v.ruleId === 'WSS-XSS-003');
        assert.ok(evalVuln, 'Should find eval vulnerability');
        assert.strictEqual(evalVuln.confidence, 'MEDIUM', 'Should downgrade confidence for framework code');
        assert.ok(
          evalVuln.description.includes('Angular'),
          'Should mention framework in description'
        );
      });

      it('should downgrade confidence for eval in minified code', async () => {
        const minifiedCode = 'function a(){var b=1;return eval(b)}' + 'x'.repeat(500);

        const result = await analyzeJavaScript(minifiedCode, 'bundle.min.js', false);

        const evalVuln = result.vulnerabilities.find(v => v.ruleId === 'WSS-XSS-003');
        assert.ok(evalVuln, 'Should find eval vulnerability');
        assert.strictEqual(evalVuln.confidence, 'MEDIUM', 'Should downgrade confidence for minified code');
        assert.ok(
          evalVuln.description.includes('minified'),
          'Should mention minified code in description'
        );
      });

      it('should downgrade confidence further when CSP is present', async () => {
        const code = `
          function test() {
            eval('2 + 2');
          }
        `;

        const result = await analyzeJavaScript(code, 'test.js', true);

        const evalVuln = result.vulnerabilities.find(v => v.ruleId === 'WSS-XSS-003');
        assert.ok(evalVuln, 'Should find eval vulnerability');
        assert.strictEqual(evalVuln.confidence, 'LOW', 'Should downgrade to LOW when CSP blocks eval');
      });

      it('should maintain HIGH confidence for eval in application code without CSP', async () => {
        const appCode = `
          function processUserInput(input) {
            // Direct eval of user input - dangerous
            return eval(input);
          }
        `;

        const result = await analyzeJavaScript(appCode, 'app.js', false);

        const evalVuln = result.vulnerabilities.find(v => v.ruleId === 'WSS-XSS-003');
        assert.ok(evalVuln, 'Should find eval vulnerability');
        assert.strictEqual(evalVuln.confidence, 'HIGH', 'Should maintain HIGH confidence for app code');
      });

      it('should downgrade Function constructor in React code', async () => {
        const reactCode = `
          import React from 'react';
          function MyComponent() {
            const fn = new Function('a', 'b', 'return a + b');
            return <div>{fn(1, 2)}</div>;
          }
        `;

        const result = await analyzeJavaScript(reactCode, 'component.jsx', false);

        const functionVuln = result.vulnerabilities.find(v =>
          v.description.includes('Function()')
        );
        assert.ok(functionVuln, 'Should find Function constructor vulnerability');
        assert.strictEqual(functionVuln.confidence, 'MEDIUM', 'Should downgrade confidence for React code');
      });

      it('should handle multiple context indicators', async () => {
        // Minified Angular code with CSP
        const complexCode = `import{Component}from'@angular/core';eval('test');` + 'x'.repeat(500);

        const result = await analyzeJavaScript(complexCode, 'bundle.min.js', true);

        const evalVuln = result.vulnerabilities.find(v => v.ruleId === 'WSS-XSS-003');
        assert.ok(evalVuln, 'Should find eval vulnerability');
        assert.strictEqual(evalVuln.confidence, 'LOW', 'Should apply strongest downgrade (CSP + framework/minified)');
        assert.ok(
          evalVuln.description.includes('Angular') || evalVuln.description.includes('minified'),
          'Should mention context in description'
        );
      });
    });
  });
});