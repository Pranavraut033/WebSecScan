/**
 * HTML Static Analyzer
 * 
 * Analyzes HTML content for security misconfigurations, missing security headers,
 * unsafe script usage, and form security issues.
 */

import * as cheerio from 'cheerio';
import { createVulnerabilityFinding } from '../rules/owaspRules';

export interface HtmlAnalysisResult {
  vulnerabilities: Array<{
    type: string;
    severity: string;
    confidence: string;
    description: string;
    location: string;
    remediation: string;
    owaspCategory?: string;
    ruleId?: string;
    evidence?: string;
  }>;
}

/**
 * Analyze HTML content for security vulnerabilities
 */
export async function analyzeHTML(
  html: string,
  sourceUrl: string
): Promise<HtmlAnalysisResult> {
  const vulnerabilities: HtmlAnalysisResult['vulnerabilities'] = [];
  const $ = cheerio.load(html);

  // Check for Content Security Policy
  const cspCheck = checkContentSecurityPolicy($);
  if (cspCheck.missing) {
    vulnerabilities.push(
      createVulnerabilityFinding(
        'WSS-SEC-001',
        sourceUrl,
        'No CSP meta tag or header detected'
      )
    );

    // Only check for inline scripts if CSP is missing
    // (if CSP exists but is weak, we report the weak CSP instead)
    const inlineScripts = findUnsafeInlineScripts($);
    for (const script of inlineScripts) {
      vulnerabilities.push(
        createVulnerabilityFinding(
          'WSS-SEC-002',
          `${sourceUrl} - Inline script`,
          script.context,
          'Inline script found without nonce or hash. This weakens CSP protection against XSS.'
        )
      );
    }
  } else if (cspCheck.weak) {
    vulnerabilities.push(
      createVulnerabilityFinding(
        'WSS-SEC-002',
        sourceUrl,
        cspCheck.evidence || ''
      )
    );
  }

  // Check form security
  const formIssues = analyzeFormSecurity($);
  vulnerabilities.push(...formIssues.map(issue => ({
    ...createVulnerabilityFinding(
      issue.ruleId,
      `${sourceUrl} - ${issue.location}`,
      issue.evidence
    )
  })));

  return { vulnerabilities };
}

/**
 * Check for Content Security Policy presence and strength
 */
function checkContentSecurityPolicy($: ReturnType<typeof cheerio.load>): {
  missing: boolean;
  weak: boolean;
  evidence?: string;
} {
  // Check for CSP meta tag with http-equiv attribute (case-insensitive)
  let cspMeta = $('meta[http-equiv]').filter((_, el) => {
    const httpEquiv = $(el).attr('http-equiv');
    return httpEquiv?.toLowerCase() === 'content-security-policy';
  });

  if (cspMeta.length === 0) {
    return { missing: true, weak: false };
  }

  const cspContent = cspMeta.attr('content');

  if (!cspContent) {
    return { missing: true, weak: false };
  }

  // Check for unsafe directives
  if (cspContent.includes("'unsafe-inline'") || cspContent.includes("'unsafe-eval'")) {
    return {
      missing: false,
      weak: true,
      evidence: `CSP contains unsafe directives: ${cspContent}`
    };
  }

  return { missing: false, weak: false };
}

/**
 * Find inline scripts that lack proper CSP protection
 */
function findUnsafeInlineScripts($: ReturnType<typeof cheerio.load>): Array<{ context: string }> {
  const scripts: Array<{ context: string }> = [];

  // Find inline script tags (without src attribute and without nonce)
  $('script').each((_, elem) => {
    const $script = $(elem);
    const hasSrc = $script.attr('src');
    const hasNonce = $script.attr('nonce');

    // Skip scripts with src or nonce attributes
    if (hasSrc || hasNonce) {
      return;
    }

    const scriptContent = $script.html()?.trim() || '';

    // Skip empty scripts or Next.js hydration scripts (they're framework-generated)
    if (scriptContent.length > 0 && !scriptContent.includes('__NEXT_DATA__')) {
      const preview = scriptContent.length > 100
        ? scriptContent.substring(0, 100) + '...'
        : scriptContent;
      scripts.push({
        context: `Inline script without nonce: ${preview}`
      });
    }
  });

  return scripts;
}

/**
 * Analyze form elements for security issues
 */
function analyzeFormSecurity($: ReturnType<typeof cheerio.load>): Array<{
  ruleId: string;
  location: string;
  evidence: string;
}> {
  const issues: Array<{ ruleId: string; location: string; evidence: string }> = [];

  // Analyze all form elements
  $('form').each((index, elem) => {
    const $form = $(elem);
    const formIndex = index + 1;
    const location = `Form #${formIndex}`;
    const action = $form.attr('action');

    // Check for missing action attribute
    if (!action) {
      const formHtml = $.html($form);
      issues.push({
        ruleId: 'WSS-FORM-001',
        location,
        evidence: formHtml.substring(0, Math.min(formHtml.length, 200))
      });
    } else {
      // Check for HTTP (insecure) action
      if (action.startsWith('http://')) {
        issues.push({
          ruleId: 'WSS-FORM-002',
          location,
          evidence: `Form submits to insecure HTTP: ${action}`
        });
      }

      // Check for action pointing to external domains (potential open redirect)
      if (action.startsWith('http://') || action.startsWith('https://')) {
        // Extract domain from action URL
        if (!action.includes('localhost') && !action.includes('127.0.0.1')) {
          // This is a heuristic - external form actions can be legitimate
          // but should be reviewed
          issues.push({
            ruleId: 'WSS-FORM-001',
            location,
            evidence: `Form submits to external URL: ${action} - verify this is intentional`
          });
        }
      }
    }
  });

  return issues;
}

/**
 * Check for meta tag security configurations
 */
export function checkMetaTags(html: string): {
  hasViewport: boolean;
  hasCharset: boolean;
  hasCSP: boolean;
} {
  const $ = cheerio.load(html);

  // Case-insensitive checks
  const hasViewport = $('meta[name]').filter((_, el) => {
    return $(el).attr('name')?.toLowerCase() === 'viewport';
  }).length > 0;

  const hasCSP = $('meta[http-equiv]').filter((_, el) => {
    return $(el).attr('http-equiv')?.toLowerCase() === 'content-security-policy';
  }).length > 0;

  return {
    hasViewport,
    hasCharset: $('meta[charset]').length > 0,
    hasCSP
  };
}
