/**
 * OWASP Rules Configuration
 * 
 * Defines canonical vulnerability IDs, OWASP Top 10 mappings, severity rules,
 * and standardized remediation guidance for all security findings.
 */

import { Severity, Confidence } from '@prisma/client';

export interface VulnerabilityRule {
  id: string;
  name: string;
  owaspCategory: string;
  owaspId: string;
  description: string;
  severity: Severity;
  confidence: Confidence;
  remediation: string;
  references: string[];
}

/**
 * OWASP Top 10 2025 Category Mapping
 */
export const OWASP_CATEGORIES = {
  A01_BROKEN_ACCESS_CONTROL: 'A01:2025 - Broken Access Control',
  A02_SECURITY_MISCONFIGURATION: 'A02:2025 - Security Misconfiguration',
  A03_SUPPLY_CHAIN_FAILURES: 'A03:2025 - Software Supply Chain Failures',
  A04_CRYPTOGRAPHIC_FAILURES: 'A04:2025 - Cryptographic Failures',
  A05_INJECTION: 'A05:2025 - Injection',
  A06_INSECURE_DESIGN: 'A06:2025 - Insecure Design',
  A07_AUTH_FAILURES: 'A07:2025 - Authentication Failures',
  A08_DATA_INTEGRITY: 'A08:2025 - Software or Data Integrity Failures',
  A09_LOGGING_FAILURES: 'A09:2025 - Security Logging & Alerting Failures',
  A10_EXCEPTIONAL_CONDITIONS: 'A10:2025 - Mishandling of Exceptional Conditions'
} as const;

/**
 * Vulnerability Rule Definitions
 */
export const VULNERABILITY_RULES: Record<string, VulnerabilityRule> = {
  // XSS Vulnerabilities (A05: Injection)
  'WSS-XSS-001': {
    id: 'WSS-XSS-001',
    name: 'Reflected Cross-Site Scripting (XSS)',
    owaspCategory: OWASP_CATEGORIES.A05_INJECTION,
    owaspId: 'A05:2025',
    description: 'User input is reflected in the page without proper sanitization, allowing script injection.',
    severity: 'HIGH',
    confidence: 'HIGH',
    remediation: 'Sanitize all user input before rendering. Use Content Security Policy (CSP) headers. Escape HTML entities. Use frameworks that auto-escape by default.',
    references: [
      'https://owasp.org/www-community/attacks/xss/',
      'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html'
    ]
  },

  'WSS-XSS-002': {
    id: 'WSS-XSS-002',
    name: 'Dangerous innerHTML Usage',
    owaspCategory: OWASP_CATEGORIES.A05_INJECTION,
    owaspId: 'A05:2025',
    description: 'Direct use of innerHTML or dangerouslySetInnerHTML with unsanitized data can lead to XSS.',
    severity: 'HIGH',
    confidence: 'MEDIUM',
    remediation: 'Use textContent or innerText for plain text. Sanitize HTML with DOMPurify before using innerHTML. Prefer framework-safe methods.',
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML#security_considerations'
    ]
  },

  'WSS-XSS-003': {
    id: 'WSS-XSS-003',
    name: 'Unsafe eval() Usage',
    owaspCategory: OWASP_CATEGORIES.A05_INJECTION,
    owaspId: 'A05:2025',
    description: 'Use of eval() or Function() constructor with user input enables arbitrary code execution.',
    severity: 'CRITICAL',
    confidence: 'HIGH',
    remediation: 'Never use eval() with user input. Use JSON.parse() for data. Replace Function() with safer alternatives. Enable strict CSP that blocks eval.',
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#never_use_eval!'
    ]
  },

  // Security Misconfiguration (A02)
  'WSS-SEC-001': {
    id: 'WSS-SEC-001',
    name: 'Missing Content Security Policy',
    owaspCategory: OWASP_CATEGORIES.A02_SECURITY_MISCONFIGURATION,
    owaspId: 'A02:2025',
    description: 'Content-Security-Policy header is missing, allowing execution of inline scripts and reducing XSS protection.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    remediation: "Add Content-Security-Policy header with strict directives. Example: \"default-src 'self'; script-src 'self'; object-src 'none'\"",
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
      'https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html'
    ]
  },

  'WSS-SEC-002': {
    id: 'WSS-SEC-002',
    name: 'Weak Content Security Policy',
    owaspCategory: OWASP_CATEGORIES.A02_SECURITY_MISCONFIGURATION,
    owaspId: 'A02:2025',
    description: "CSP allows 'unsafe-inline' or 'unsafe-eval', which weakens XSS protection.",
    severity: 'MEDIUM',
    confidence: 'HIGH',
    remediation: "Remove 'unsafe-inline' and 'unsafe-eval' from CSP. Use nonces or hashes for inline scripts. Refactor to external script files.",
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html'
    ]
  },

  'WSS-SEC-003': {
    id: 'WSS-SEC-003',
    name: 'Missing X-Frame-Options Header',
    owaspCategory: OWASP_CATEGORIES.A02_SECURITY_MISCONFIGURATION,
    owaspId: 'A02:2025',
    description: 'X-Frame-Options header is missing, making the site vulnerable to clickjacking attacks.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    remediation: "Add X-Frame-Options header with value 'DENY' or 'SAMEORIGIN' to prevent clickjacking.",
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options',
      'https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html'
    ]
  },

  'WSS-SEC-004': {
    id: 'WSS-SEC-004',
    name: 'Missing X-Content-Type-Options Header',
    owaspCategory: OWASP_CATEGORIES.A02_SECURITY_MISCONFIGURATION,
    owaspId: 'A02:2025',
    description: 'X-Content-Type-Options header is missing, allowing MIME type sniffing attacks.',
    severity: 'LOW',
    confidence: 'HIGH',
    remediation: "Add X-Content-Type-Options: nosniff header to prevent MIME type sniffing.",
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options'
    ]
  },

  'WSS-SEC-005': {
    id: 'WSS-SEC-005',
    name: 'Missing Strict-Transport-Security Header',
    owaspCategory: OWASP_CATEGORIES.A04_CRYPTOGRAPHIC_FAILURES,
    owaspId: 'A04:2025',
    description: 'HSTS header is missing, allowing potential downgrade attacks from HTTPS to HTTP.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    remediation: 'Add Strict-Transport-Security header with max-age of at least 31536000 (1 year). Include includeSubDomains directive.',
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security',
      'https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html'
    ]
  },

  // Authentication Failures (A07)
  'WSS-AUTH-001': {
    id: 'WSS-AUTH-001',
    name: 'Insecure Cookie - Missing Secure Flag',
    owaspCategory: OWASP_CATEGORIES.A07_AUTH_FAILURES,
    owaspId: 'A07:2025',
    description: 'Cookie is set without the Secure flag, allowing transmission over unencrypted HTTP connections.',
    severity: 'HIGH',
    confidence: 'HIGH',
    remediation: 'Set the Secure flag on all cookies to ensure they are only transmitted over HTTPS.',
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies',
      'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html'
    ]
  },

  'WSS-AUTH-002': {
    id: 'WSS-AUTH-002',
    name: 'Insecure Cookie - Missing HttpOnly Flag',
    owaspCategory: OWASP_CATEGORIES.A07_AUTH_FAILURES,
    owaspId: 'A07:2025',
    description: 'Cookie is set without HttpOnly flag, making it accessible to JavaScript and vulnerable to XSS-based theft.',
    severity: 'HIGH',
    confidence: 'HIGH',
    remediation: 'Set the HttpOnly flag on all session cookies to prevent JavaScript access and reduce XSS impact.',
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies'
    ]
  },

  'WSS-AUTH-003': {
    id: 'WSS-AUTH-003',
    name: 'Insecure Cookie - Missing SameSite Attribute',
    owaspCategory: OWASP_CATEGORIES.A07_AUTH_FAILURES,
    owaspId: 'A07:2025',
    description: 'Cookie lacks SameSite attribute, making it vulnerable to CSRF attacks.',
    severity: 'MEDIUM',
    confidence: 'HIGH',
    remediation: "Set SameSite=Strict or SameSite=Lax on cookies to prevent CSRF. Use Strict for sensitive operations.",
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite',
      'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html'
    ]
  },

  // Software Supply Chain Failures (A03)
  'WSS-DEP-001': {
    id: 'WSS-DEP-001',
    name: 'Vulnerable Dependency Detected',
    owaspCategory: OWASP_CATEGORIES.A03_SUPPLY_CHAIN_FAILURES,
    owaspId: 'A03:2025',
    description: 'A package dependency has known security vulnerabilities (CVE).',
    severity: 'HIGH',
    confidence: 'HIGH',
    remediation: 'Update the vulnerable package to the latest patched version. Review changelogs for breaking changes. Run npm audit fix or yarn upgrade.',
    references: [
      'https://owasp.org/www-community/vulnerabilities/Using_Components_with_Known_Vulnerabilities'
    ]
  },

  'WSS-DEP-002': {
    id: 'WSS-DEP-002',
    name: 'Outdated Package Detected',
    owaspCategory: OWASP_CATEGORIES.A03_SUPPLY_CHAIN_FAILURES,
    owaspId: 'A03:2025',
    description: 'Package is significantly outdated and may contain unpatched vulnerabilities.',
    severity: 'MEDIUM',
    confidence: 'MEDIUM',
    remediation: 'Update package to latest stable version. Check release notes for security fixes and breaking changes.',
    references: [
      'https://owasp.org/www-community/vulnerabilities/Using_Components_with_Known_Vulnerabilities'
    ]
  },

  // Secrets & Credentials (A04 - Cryptographic Failures)
  'WSS-SEC-006': {
    id: 'WSS-SEC-006',
    name: 'Hardcoded Secret Detected',
    owaspCategory: OWASP_CATEGORIES.A04_CRYPTOGRAPHIC_FAILURES,
    owaspId: 'A04:2025',
    description: 'Hardcoded credentials, API keys, or secrets found in source code.',
    severity: 'CRITICAL',
    confidence: 'MEDIUM',
    remediation: 'Remove hardcoded secrets immediately. Use environment variables or secure secret management systems. Rotate compromised credentials. Add secrets to .gitignore.',
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html'
    ]
  },

  // Form Security (A02/A04)
  'WSS-FORM-001': {
    id: 'WSS-FORM-001',
    name: 'Form Missing Action Attribute',
    owaspCategory: OWASP_CATEGORIES.A02_SECURITY_MISCONFIGURATION,
    owaspId: 'A02:2025',
    description: 'HTML form lacks an action attribute, which may lead to unintended behavior or open redirects.',
    severity: 'LOW',
    confidence: 'MEDIUM',
    remediation: 'Always specify an explicit action attribute on forms. Validate and whitelist form submission targets.',
    references: [
      'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-action'
    ]
  },

  'WSS-FORM-002': {
    id: 'WSS-FORM-002',
    name: 'Form Uses Insecure HTTP Action',
    owaspCategory: OWASP_CATEGORIES.A04_CRYPTOGRAPHIC_FAILURES,
    owaspId: 'A04:2025',
    description: 'Form submits data over unencrypted HTTP, exposing sensitive information.',
    severity: 'HIGH',
    confidence: 'HIGH',
    remediation: 'Change form action to use HTTPS. Ensure entire site uses HTTPS with HSTS enabled.',
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html'
    ]
  }
};

/**
 * Helper function to get vulnerability rule by ID
 */
export function getVulnerabilityRule(id: string): VulnerabilityRule | undefined {
  return VULNERABILITY_RULES[id];
}

/**
 * Helper function to create a standardized vulnerability finding
 */
export function createVulnerabilityFinding(
  ruleId: string,
  location: string,
  evidence?: string,
  customDescription?: string
): {
  type: string;
  severity: Severity;
  confidence: Confidence;
  description: string;
  location: string;
  remediation: string;
  owaspCategory?: string;
  owaspId?: string;
  ruleId?: string;
  evidence?: string;
} {
  const rule = VULNERABILITY_RULES[ruleId];

  if (!rule) {
    throw new Error(`Unknown vulnerability rule ID: ${ruleId}`);
  }

  return {
    ruleId: rule.id,
    type: rule.name,
    severity: rule.severity,
    confidence: rule.confidence,
    description: customDescription || rule.description,
    location,
    remediation: rule.remediation,
    owaspCategory: rule.owaspCategory,
    owaspId: rule.owaspId,
    evidence: evidence || ''
  };
}

/**
 * Severity comparison for sorting (highest to lowest)
 */
export function compareSeverity(a: Severity, b: Severity): number {
  const order: Record<Severity, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
  };
  return order[b] - order[a];
}
