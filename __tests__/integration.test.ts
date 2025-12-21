/**
 * Integration Test - Test Fixture Scanning
 * Validates that the scanner can detect all vulnerabilities in test fixtures
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyzeJavaScript } from '../src/security/static/jsAnalyzer.ts';
import { analyzeHTML } from '../src/security/static/htmlAnalyzer.ts';
import { analyzeDependencies } from '../src/security/static/dependencyAnalyzer.ts';

describe('Integration Tests - Test Fixtures', () => {
  describe('Vulnerable HTML fixture', () => {
    it('should detect multiple vulnerabilities in vulnerable-app.html', async () => {
      const htmlPath = join(process.cwd(), 'test-fixtures', 'vulnerable-app.html');
      const html = readFileSync(htmlPath, 'utf-8');

      const result = await analyzeHTML(html, 'test-fixtures/vulnerable-app.html');

      // Should detect:
      // - Missing CSP
      // - Inline scripts without nonce
      // - Forms without action or with HTTP action
      assert.ok(result.vulnerabilities.length >= 3,
        `Should find at least 3 vulnerabilities, found ${result.vulnerabilities.length}`);

      // Check for specific vulnerabilities
      const hasMissingCSP = result.vulnerabilities.some(v =>
        v.type.includes('Missing') && v.type.includes('CSP')
      );
      assert.ok(hasMissingCSP, 'Should detect missing CSP');

      const hasInlineScript = result.vulnerabilities.some(v =>
        v.description.includes('inline script')
      );
      assert.ok(hasInlineScript, 'Should detect inline scripts');

      const hasFormIssue = result.vulnerabilities.some(v =>
        v.type.includes('Form')
      );
      assert.ok(hasFormIssue, 'Should detect form issues');
    });
  });

  describe('Vulnerable JavaScript fixture', () => {
    it('should detect multiple vulnerabilities in vulnerable-script.js', async () => {
      const jsPath = join(process.cwd(), 'test-fixtures', 'vulnerable-script.js');
      const jsCode = readFileSync(jsPath, 'utf-8');

      const result = await analyzeJavaScript(jsCode, 'test-fixtures/vulnerable-script.js');

      // Should detect:
      // - Multiple eval() usages
      // - Function() constructor usages
      // - innerHTML usages
      // - Hardcoded secrets (API keys, passwords)
      assert.ok(result.vulnerabilities.length >= 10,
        `Should find at least 10 vulnerabilities, found ${result.vulnerabilities.length}`);

      // Check for eval
      const evalVulns = result.vulnerabilities.filter(v =>
        v.type.includes('eval') || v.evidence?.includes('eval(')
      );
      assert.ok(evalVulns.length >= 2, 'Should detect multiple eval usages');

      // Check for innerHTML
      const innerHTMLVulns = result.vulnerabilities.filter(v =>
        v.type.includes('innerHTML')
      );
      assert.ok(innerHTMLVulns.length >= 2, 'Should detect multiple innerHTML usages');

      // Check for secrets
      const secretVulns = result.vulnerabilities.filter(v =>
        v.type.includes('Hardcoded Secret')
      );
      assert.ok(secretVulns.length >= 3, 'Should detect multiple hardcoded secrets');
    });
  });

  describe('Vulnerable dependencies fixture', () => {
    it('should detect multiple vulnerable dependencies', async () => {
      const pkgPath = join(process.cwd(), 'test-fixtures', 'insecure-package.json');
      const pkgContent = readFileSync(pkgPath, 'utf-8');

      const result = await analyzeDependencies(pkgContent, 'test-fixtures/insecure-package.json');

      // Should detect vulnerable versions of lodash, axios, express, next, react
      assert.ok(result.vulnerabilities.length >= 3,
        `Should find at least 3 dependency vulnerabilities, found ${result.vulnerabilities.length}`);

      // Check severity distribution
      const critical = result.vulnerabilities.filter(v => v.severity === 'CRITICAL');
      const high = result.vulnerabilities.filter(v => v.severity === 'HIGH');
      const medium = result.vulnerabilities.filter(v => v.severity === 'MEDIUM');

      assert.ok(high.length > 0 || critical.length > 0, 'Should have high/critical severity findings');
      assert.ok(medium.length > 0, 'Should have medium severity findings');
    });
  });

  describe('OWASP Top 10 coverage', () => {
    it('should detect vulnerabilities across multiple OWASP categories', async () => {
      const htmlPath = join(process.cwd(), 'test-fixtures', 'vulnerable-app.html');
      const jsPath = join(process.cwd(), 'test-fixtures', 'vulnerable-script.js');
      const pkgPath = join(process.cwd(), 'test-fixtures', 'insecure-package.json');

      const html = readFileSync(htmlPath, 'utf-8');
      const jsCode = readFileSync(jsPath, 'utf-8');
      const pkgContent = readFileSync(pkgPath, 'utf-8');

      const htmlResults = await analyzeHTML(html, 'test.html');
      const jsResults = await analyzeJavaScript(jsCode, 'test.js');
      const depResults = await analyzeDependencies(pkgContent, 'package.json');

      const allVulns = [
        ...htmlResults.vulnerabilities,
        ...jsResults.vulnerabilities,
        ...depResults.vulnerabilities
      ];

      // Should cover multiple OWASP categories
      const categories = new Set(allVulns.map(v => v.owaspCategory).filter(Boolean));

      assert.ok(categories.size >= 3,
        `Should cover at least 3 OWASP categories, found ${categories.size}: ${[...categories].join(', ')}`);

      // Check for specific categories
      const hasInjection = [...categories].some(c => c?.includes('A03:2021'));
      const hasMisconfig = [...categories].some(c => c?.includes('A05:2021'));
      const hasVulnComponents = [...categories].some(c => c?.includes('A06:2021'));

      assert.ok(hasInjection || hasMisconfig || hasVulnComponents,
        'Should cover key OWASP categories');
    });
  });

  describe('Severity distribution', () => {
    it('should properly classify vulnerability severities', async () => {
      const jsPath = join(process.cwd(), 'test-fixtures', 'vulnerable-script.js');
      const jsCode = readFileSync(jsPath, 'utf-8');

      const result = await analyzeJavaScript(jsCode, 'test.js');

      const critical = result.vulnerabilities.filter(v => v.severity === 'CRITICAL');
      const high = result.vulnerabilities.filter(v => v.severity === 'HIGH');

      // eval() and hardcoded secrets should be CRITICAL
      assert.ok(critical.length > 0, 'Should have CRITICAL findings');

      // innerHTML should be HIGH
      assert.ok(high.length > 0, 'Should have HIGH findings');

      // All vulnerabilities should have valid severity
      const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
      const allValid = result.vulnerabilities.every(v =>
        validSeverities.includes(v.severity as string)
      );
      assert.ok(allValid, 'All vulnerabilities should have valid severity');
    });
  });
});
