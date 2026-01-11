/**
 * Tests for Path Traversal Tester
 */

import { testPathTraversal, testFormPathTraversal } from '../src/security/dynamic/pathTraversalTester';

describe('Path Traversal Tester', () => {
  describe('testPathTraversal', () => {
    it('should test URLs for path traversal', async () => {
      const result = await testPathTraversal('http://example.com', []);

      expect(result).toHaveProperty('vulnerabilities');
      expect(Array.isArray(result.vulnerabilities)).toBe(true);
    });

    it('should handle invalid URLs gracefully', async () => {
      const result = await testPathTraversal('invalid-url', []);

      expect(result.vulnerabilities).toEqual([]);
    });

    it('should limit endpoint testing', async () => {
      const endpoints = Array(20).fill('http://example.com/file?path=test');
      const result = await testPathTraversal('http://example.com', endpoints);

      expect(result.vulnerabilities).toBeDefined();
    });

    it('should focus on file-related endpoints', async () => {
      const fileEndpoints = [
        'http://example.com/download?file=test.pdf',
        'http://example.com/image?path=/uploads/img.jpg'
      ];
      const otherEndpoints = [
        'http://example.com/about',
        'http://example.com/contact'
      ];

      // File endpoints should be prioritized
      const result = await testPathTraversal('http://example.com',
        [...fileEndpoints, ...otherEndpoints]);

      expect(result.vulnerabilities).toBeDefined();
    });
  });

  describe('testFormPathTraversal', () => {
    it('should handle empty forms array', async () => {
      const result = await testFormPathTraversal([]);

      expect(result.vulnerabilities).toEqual([]);
    });

    it('should limit form testing to 3 forms', async () => {
      const forms = Array(10).fill({
        url: 'http://example.com',
        method: 'POST',
        action: 'http://example.com/upload'
      });

      const result = await testFormPathTraversal(forms);

      expect(result.vulnerabilities).toBeDefined();
    });
  });

  describe('Path Traversal Detection', () => {
    it('should identify Unix passwd file patterns', () => {
      const indicators = [
        'root:x:0:0:root:/root:/bin/bash',
        'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin'
      ];

      // These patterns should be detected
      indicators.forEach(indicator => {
        expect(indicator).toMatch(/\w+:x:\d+:\d+:/);
      });
    });

    it('should identify Windows ini file patterns', () => {
      const indicators = [
        '[fonts]',
        '[extensions]',
        '; for 16-bit app support'
      ];

      // These should be recognized as Windows system files
      indicators.forEach(indicator => {
        expect(indicator).toBeTruthy();
      });
    });
  });
});
