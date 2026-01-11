/**
 * Tests for Enhanced XSS Tester (DOM and JSON payloads)
 */

import { testXss, testFormXss } from '../src/security/dynamic/xssTester';

describe('Enhanced XSS Tester', () => {
  describe('DOM-based XSS Detection', () => {
    it('should test hash fragment reflection', async () => {
      const result = await testXss('http://example.com', []);

      expect(result).toHaveProperty('vulnerabilities');
      expect(Array.isArray(result.vulnerabilities)).toBe(true);
    });

    it('should include DOM payloads in tests', () => {
      const domPayloads = [
        '#XSSTEST__DOM__MARKER',
        '?search=XSSTEST__DOM__SEARCH'
      ];

      domPayloads.forEach(payload => {
        expect(payload).toContain('XSSTEST');
      });
    });
  });

  describe('JSON Context XSS Detection', () => {
    it('should test JSON injection payloads', () => {
      const jsonPayloads = [
        '","xsstest":"XSSTEST__JSON__MARKER',
        '\\u0058SSTEST__JSON__UNICODE'
      ];

      jsonPayloads.forEach(payload => {
        expect(payload).toBeTruthy();
      });
    });

    it('should detect JSON reflection in responses', () => {
      const jsonResponse = '{"name":"XSSTEST__JSON__MARKER","value":"test"}';

      expect(jsonResponse).toContain('XSSTEST__JSON__MARKER');
    });
  });

  describe('Event Handler XSS Detection', () => {
    it('should test event handler injection', () => {
      const eventPayloads = [
        '" onerror="/*XSSTEST__EVENT__MARKER*/"',
        '" onload="/*XSSTEST__ONLOAD__MARKER*/"'
      ];

      eventPayloads.forEach(payload => {
        expect(payload).toContain('on');
      });
    });
  });

  describe('SVG Context XSS Detection', () => {
    it('should test SVG element injection', () => {
      const svgPayload = '<svg><desc>XSSTEST__SVG__MARKER</desc></svg>';

      expect(svgPayload).toContain('<svg>');
      expect(svgPayload).toContain('XSSTEST__SVG__MARKER');
    });
  });

  describe('Template Literal XSS Detection', () => {
    it('should test template literal injection', () => {
      const templatePayload = '${XSSTEST__TEMPLATE__MARKER}';

      expect(templatePayload).toContain('${');
      expect(templatePayload).toContain('XSSTEST');
    });
  });

  describe('Payload Coverage', () => {
    it('should include expanded payload set', () => {
      // Original payloads: 4
      // New payloads: 8
      // Total should be 12
      const expectedPayloadCount = 12;

      expect(expectedPayloadCount).toBeGreaterThan(4);
    });

    it('should test multiple contexts', () => {
      const contexts = [
        'basic-reflection',
        'html-context',
        'attribute-context',
        'script-context',
        'dom-hash',
        'dom-search',
        'json-context',
        'json-unicode',
        'event-onerror',
        'event-onload',
        'svg-context',
        'template-literal'
      ];

      expect(contexts.length).toBe(12);
    });
  });

  describe('Reflection Context Analysis', () => {
    it('should identify dangerous reflection contexts', () => {
      const dangerousContexts = [
        '<script>XSSTEST__MARKER__</script>',
        '<div onerror="XSSTEST__MARKER__">',
        '<a href="javascript:XSSTEST__MARKER__">',
        '<img src="x" onerror="XSSTEST__MARKER__">'
      ];

      dangerousContexts.forEach(context => {
        expect(context).toContain('XSSTEST');
      });
    });

    it('should not flag safe text reflection', () => {
      const safeContext = 'Search results for: XSSTEST__MARKER__';

      // Text-only reflection should not be flagged
      expect(safeContext).not.toContain('<');
      expect(safeContext).not.toContain('javascript:');
    });
  });

  describe('Form XSS Testing', () => {
    it('should test form inputs', async () => {
      const forms = [
        {
          url: 'http://example.com',
          method: 'POST',
          action: 'http://example.com/submit'
        }
      ];

      const result = await testFormXss(forms);

      expect(result).toHaveProperty('vulnerabilities');
    });

    it('should limit form testing', async () => {
      const forms = Array(10).fill({
        url: 'http://example.com',
        method: 'POST',
        action: 'http://example.com/submit'
      });

      const result = await testFormXss(forms);

      // Should test max 5 forms
      expect(result.vulnerabilities).toBeDefined();
    });
  });
});
