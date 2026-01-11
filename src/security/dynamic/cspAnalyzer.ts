/**
 * CSP Analyzer - Comprehensive Content Security Policy analysis
 * Based on Mozilla Observatory checks
 */

import type { HeaderTestResult } from './headerAnalyzer';

export interface CSPDirectives {
  [directive: string]: string[];
}

export interface CSPAnalysis {
  hasCSP: boolean;
  directives: CSPDirectives;
  checks: CSPCheck[];
}

export interface CSPCheck {
  name: string;
  passed: boolean;
  description: string;
  severity: 'high' | 'medium' | 'low' | 'info';
}

export function parseCSP(cspHeader: string): CSPDirectives {
  const directives: CSPDirectives = {};

  if (!cspHeader) return directives;

  const parts = cspHeader.split(';').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const tokens = part.split(/\s+/);
    const directive = tokens[0];
    const values = tokens.slice(1);

    if (directive) {
      directives[directive] = values;
    }
  }

  return directives;
}

export function analyzeCSP(
  cspHeader: string | undefined
): HeaderTestResult & { cspAnalysis?: CSPAnalysis } {
  if (!cspHeader) {
    return {
      testName: 'Content Security Policy (CSP)',
      passed: false,
      score: -25,
      result: 'Failed',
      reason: 'Content Security Policy (CSP) header not implemented',
      recommendation:
        "Implement one, see MDN's Content Security Policy (CSP) documentation.",
      details: {
        owaspId: 'A02:2025',
        category: 'Security Misconfiguration'
      }
    };
  }

  const directives = parseCSP(cspHeader);
  const checks = performCSPChecks(directives);
  const failedChecks = checks.filter((c) => !c.passed && c.severity !== 'info');

  // Determine overall score based on failed checks
  let score = 0;
  if (failedChecks.length === 0) {
    score = 5; // Bonus for perfect CSP
  } else if (failedChecks.some((c) => c.severity === 'high')) {
    score = -25; // Severely misconfigured CSP
  } else if (failedChecks.length >= 5) {
    score = -20;
  } else if (failedChecks.length >= 3) {
    score = -10;
  } else {
    score = -5;
  }

  const passed = failedChecks.length === 0;

  return {
    testName: 'Content Security Policy (CSP)',
    passed,
    score,
    result: passed ? 'Passed' : 'Failed',
    reason: passed
      ? 'Content Security Policy implemented with secure configuration.'
      : 'Content Security Policy implemented unsafely or incompletely.',
    recommendation: passed
      ? undefined
      : 'Review and fix the failed CSP checks listed in details.',
    details: {
      owaspId: 'A02:2025',
      category: 'Security Misconfiguration',
      directives,
      checks,
      failedCount: failedChecks.length,
    },
    cspAnalysis: {
      hasCSP: true,
      directives,
      checks,
    },
  };
}

function performCSPChecks(directives: CSPDirectives): CSPCheck[] {
  const checks: CSPCheck[] = [];

  // Check 1: No unsafe-inline in script-src
  checks.push(checkNoUnsafeInlineScript(directives));

  // Check 2: No unsafe-eval in script-src
  checks.push(checkNoUnsafeEval(directives));

  // Check 3: object-src restrictions
  checks.push(checkObjectSrc(directives));

  // Check 4: No unsafe-inline in style-src
  checks.push(checkNoUnsafeInlineStyle(directives));

  // Check 5: Only HTTPS resources
  checks.push(checkHTTPSOnly(directives));

  // Check 6: frame-ancestors for clickjacking protection
  checks.push(checkFrameAncestors(directives));

  // Check 7: Deny by default with default-src
  checks.push(checkDefaultSrc(directives));

  // Check 8: base-uri restriction
  checks.push(checkBaseUri(directives));

  // Check 9: form-action restriction
  checks.push(checkFormAction(directives));

  // Check 10: strict-dynamic (optional but good)
  checks.push(checkStrictDynamic(directives));

  return checks;
}

function checkNoUnsafeInlineScript(directives: CSPDirectives): CSPCheck {
  const scriptSrc = directives['script-src'] || directives['default-src'] || [];
  const hasUnsafeInline = scriptSrc.includes("'unsafe-inline'");

  return {
    name: 'No unsafe-inline in script-src',
    passed: !hasUnsafeInline,
    description:
      "Blocking the execution of inline JavaScript provides CSP's strongest protection against cross-site scripting attacks. Moving JavaScript to external files can also help make your site more maintainable.",
    severity: 'high',
  };
}

function checkNoUnsafeEval(directives: CSPDirectives): CSPCheck {
  const scriptSrc = directives['script-src'] || directives['default-src'] || [];
  const hasUnsafeEval = scriptSrc.includes("'unsafe-eval'");

  return {
    name: 'No unsafe-eval in script-src',
    passed: !hasUnsafeEval,
    description:
      "Blocking the use of JavaScript's eval() function can help prevent the execution of untrusted code.",
    severity: 'high',
  };
}

function checkObjectSrc(directives: CSPDirectives): CSPCheck {
  const objectSrc = directives['object-src'];
  const defaultSrc = directives['default-src'];

  const isRestricted =
    objectSrc?.includes("'none'") ||
    (!objectSrc && defaultSrc?.includes("'none'"));

  return {
    name: 'object-src restrictions',
    passed: isRestricted,
    description:
      "Blocking the execution of plug-ins via object-src 'none' or as inherited from default-src can prevent attackers from loading Flash or Java in the context of your page.",
    severity: 'medium',
  };
}

function checkNoUnsafeInlineStyle(directives: CSPDirectives): CSPCheck {
  const styleSrc = directives['style-src'] || directives['default-src'] || [];
  const hasUnsafeInline = styleSrc.includes("'unsafe-inline'");

  return {
    name: 'No unsafe-inline in style-src',
    passed: !hasUnsafeInline,
    description:
      'Blocking inline styles can help prevent attackers from modifying the contents or appearance of your page. Moving styles to external stylesheets can also help make your site more maintainable.',
    severity: 'medium',
  };
}

function checkHTTPSOnly(directives: CSPDirectives): CSPCheck {
  const allDirectives = Object.values(directives).flat();

  // Check for insecure protocols
  const hasHTTP = allDirectives.some(
    (val) =>
      val.startsWith('http://') ||
      val === 'http:' ||
      val.startsWith('ftp://') ||
      val === 'ftp:'
  );

  // Check for overly broad HTTPS
  const hasBroadHTTPS = allDirectives.some((val) => val === 'https:');

  const passed = !hasHTTP && !hasBroadHTTPS;

  return {
    name: 'HTTPS-only resources',
    passed,
    description: passed
      ? 'All resources are loaded over secure protocols.'
      : 'Loading JavaScript or plugins over insecure protocols can allow a man-in-the-middle to execute arbitrary code on your website. Restricting your policy and changing links to HTTPS can help prevent this.',
    severity: 'high',
  };
}

function checkFrameAncestors(directives: CSPDirectives): CSPCheck {
  const frameAncestors = directives['frame-ancestors'];

  const isProtected =
    frameAncestors &&
    (frameAncestors.includes("'none'") ||
      frameAncestors.includes("'self'") ||
      frameAncestors.length > 0);

  return {
    name: 'frame-ancestors for clickjacking protection',
    passed: !!isProtected,
    description:
      "The use of CSP's frame-ancestors directive offers fine-grained control over who can frame your site.",
    severity: 'medium',
  };
}

function checkDefaultSrc(directives: CSPDirectives): CSPCheck {
  const defaultSrc = directives['default-src'];
  const isDenyByDefault = defaultSrc?.includes("'none'");

  return {
    name: "Deny by default with default-src 'none'",
    passed: isDenyByDefault,
    description:
      "Denying by default using default-src 'none' can ensure that your Content Security Policy doesn't allow the loading of resources you didn't intend to allow.",
    severity: 'low',
  };
}

function checkBaseUri(directives: CSPDirectives): CSPCheck {
  const baseUri = directives['base-uri'];

  const isRestricted =
    baseUri &&
    (baseUri.includes("'none'") ||
      baseUri.includes("'self'") ||
      baseUri.length > 0);

  return {
    name: 'base-uri restriction',
    passed: !!isRestricted,
    description:
      "Restricts use of the <base> tag by using base-uri 'none', base-uri 'self', or specific origins. The <base> tag can be used to trick your site into loading scripts from untrusted origins.",
    severity: 'medium',
  };
}

function checkFormAction(directives: CSPDirectives): CSPCheck {
  const formAction = directives['form-action'];

  const isRestricted =
    formAction &&
    (formAction.includes("'none'") ||
      formAction.includes("'self'") ||
      formAction.length > 0);

  return {
    name: 'form-action restriction',
    passed: !!isRestricted,
    description:
      "Restricts where <form> contents may be submitted by using form-action 'none', form-action 'self', or specific URIs. Malicious JavaScript or content injection could modify where sensitive form data is submitted to or create additional forms for data exfiltration.",
    severity: 'medium',
  };
}

function checkStrictDynamic(directives: CSPDirectives): CSPCheck {
  const scriptSrc = directives['script-src'] || [];
  const hasStrictDynamic = scriptSrc.includes("'strict-dynamic'");

  return {
    name: "strict-dynamic for dynamic script loading",
    passed: hasStrictDynamic,
    description:
      "'strict-dynamic' lets you use a JavaScript shim loader to load all your site's JavaScript dynamically, without having to track script-src origins. This is an advanced feature and optional.",
    severity: 'info',
  };
}
