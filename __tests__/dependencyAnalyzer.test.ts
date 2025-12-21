/**
 * Unit tests for Dependency Analyzer
 * Tests detection of vulnerable and outdated dependencies
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { analyzeDependencies } from '../src/security/static/dependencyAnalyzer.ts';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Dependency Analyzer', () => {
  describe('Known vulnerable dependencies', () => {
    it('should detect vulnerable lodash version', async () => {
      const packageJson = `{
        "dependencies": {
          "lodash": "4.17.15"
        }
      }`;

      const result = await analyzeDependencies(packageJson, 'package.json');

      const lodashVuln = result.vulnerabilities.find(v =>
        v.evidence?.includes('lodash')
      );
      assert.ok(lodashVuln, 'Should detect vulnerable lodash');
      assert.ok(lodashVuln.description?.includes('CVE'), 'Should include CVE');
    });

    it('should detect vulnerable axios version', async () => {
      const packageJson = `{
        "dependencies": {
          "axios": "0.21.0"
        }
      }`;

      const result = await analyzeDependencies(packageJson, 'package.json');

      const axiosVuln = result.vulnerabilities.find(v =>
        v.evidence?.includes('axios')
      );
      assert.ok(axiosVuln, 'Should detect vulnerable axios');
    });

    it('should detect vulnerable express version', async () => {
      const packageJson = `{
        "dependencies": {
          "express": "4.17.0"
        }
      }`;

      const result = await analyzeDependencies(packageJson, 'package.json');

      const expressVuln = result.vulnerabilities.find(v =>
        v.evidence?.includes('express')
      );
      assert.ok(expressVuln, 'Should detect vulnerable express');
    });
  });

  describe('Outdated dependencies', () => {
    it('should detect outdated React version', async () => {
      const packageJson = `{
        "dependencies": {
          "react": "16.14.0"
        }
      }`;

      const result = await analyzeDependencies(packageJson, 'package.json');

      const reactOutdated = result.vulnerabilities.find(v =>
        v.evidence?.includes('react') && v.type.includes('Outdated')
      );
      assert.ok(reactOutdated, 'Should detect outdated React');
      assert.strictEqual(reactOutdated.severity, 'MEDIUM');
    });

    it('should not flag recent versions', async () => {
      const packageJson = `{
        "dependencies": {
          "react": "^18.2.0",
          "lodash": "^4.17.21"
        }
      }`;

      const result = await analyzeDependencies(packageJson, 'package.json');

      assert.strictEqual(result.vulnerabilities.length, 0, 'Should not flag recent versions');
    });
  });

  describe('Test fixture validation', () => {
    it('should detect multiple vulnerabilities in test fixture', async () => {
      const fixtureContent = readFileSync(
        join(process.cwd(), 'test-fixtures', 'insecure-package.json'),
        'utf-8'
      );

      const result = await analyzeDependencies(fixtureContent, 'test-fixtures/insecure-package.json');

      // Test fixture should have multiple vulnerabilities
      assert.ok(result.vulnerabilities.length >= 3, 'Test fixture should have multiple vulnerabilities');

      // Check for specific packages
      const packageNames = ['lodash', 'axios', 'express', 'next', 'react'];
      const foundPackages = packageNames.filter(pkg =>
        result.vulnerabilities.some(v => v.evidence?.includes(pkg))
      );

      assert.ok(foundPackages.length >= 3, 'Should detect vulnerabilities in multiple packages');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty dependencies', async () => {
      const packageJson = `{
        "name": "test",
        "dependencies": {}
      }`;

      const result = await analyzeDependencies(packageJson, 'package.json');

      assert.strictEqual(result.vulnerabilities.length, 0, 'Should handle empty dependencies');
    });

    it('should handle invalid JSON gracefully', async () => {
      const packageJson = `{ invalid json }`;

      const result = await analyzeDependencies(packageJson, 'package.json');

      // Should not throw, should return empty result
      assert.ok(Array.isArray(result.vulnerabilities), 'Should return array');
    });

    it('should handle caret and tilde version prefixes', async () => {
      const packageJson = `{
        "dependencies": {
          "lodash": "^4.17.15",
          "axios": "~0.21.0"
        }
      }`;

      const result = await analyzeDependencies(packageJson, 'package.json');

      assert.ok(result.vulnerabilities.length > 0, 'Should detect vulnerabilities with version prefixes');
    });
  });

  describe('DevDependencies', () => {
    it('should check devDependencies as well', async () => {
      const packageJson = `{
        "dependencies": {},
        "devDependencies": {
          "webpack": "4.44.0",
          "typescript": "3.9.0"
        }
      }`;

      const result = await analyzeDependencies(packageJson, 'package.json');

      const outdatedDev = result.vulnerabilities.find(v =>
        v.evidence?.includes('webpack') || v.evidence?.includes('typescript')
      );
      assert.ok(outdatedDev, 'Should check devDependencies');
    });
  });
});
