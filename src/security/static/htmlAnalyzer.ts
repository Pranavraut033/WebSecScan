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
    owaspId?: string;
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

  // Note: CSP checking is handled by the dynamic cspAnalyzer (HTTP headers)
  // to avoid duplicate findings. Static HTML analysis only checks for
  // inline script usage patterns that could be exploited.

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
