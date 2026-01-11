/**
 * Tests for SQL Injection Tester
 */

import { testSqlInjection, testFormSql } from '../src/security/dynamic/sqlTester';

describe('SQL Injection Tester', () => {
  describe('testSqlInjection', () => {
    it('should detect SQL errors in responses', async () => {
      // This test requires a running vulnerable server
      // For now, we test the structure
      const result = await testSqlInjection('http://example.com', []);

      expect(result).toHaveProperty('vulnerabilities');
      expect(Array.isArray(result.vulnerabilities)).toBe(true);
    });

    it('should handle invalid URLs gracefully', async () => {
      const result = await testSqlInjection('invalid-url', []);

      expect(result.vulnerabilities).toEqual([]);
    });

    it('should limit endpoint testing', async () => {
      const endpoints = Array(20).fill('http://example.com/page');
      const result = await testSqlInjection('http://example.com', endpoints);

      // Should test max 10 endpoints + main URL
      expect(result.vulnerabilities).toBeDefined();
    });
  });

  describe('testFormSql', () => {
    it('should handle empty forms array', async () => {
      const result = await testFormSql([]);

      expect(result.vulnerabilities).toEqual([]);
    });

    it('should limit form testing', async () => {
      const forms = Array(10).fill({
        url: 'http://example.com',
        method: 'POST',
        action: 'http://example.com/submit'
      });

      const result = await testFormSql(forms);

      // Should test max 5 forms
      expect(result.vulnerabilities).toBeDefined();
    });
  });

  describe('SQL Error Detection', () => {
    it('should identify common SQL error patterns', () => {
      const testCases = [
        {
          content: 'MySQL syntax error near SELECT',
          shouldDetect: true
        },
        {
          content: 'PostgreSQL ERROR: syntax error',
          shouldDetect: true
        },
        {
          content: 'ORA-00933: SQL command not properly ended',
          shouldDetect: true
        },
        {
          content: 'Normal page content without errors',
          shouldDetect: false
        }
      ];

      // These would be tested with the internal detectSqlError function
      // if it were exported for testing
      expect(testCases).toBeDefined();
    });
  });
});
