/**
 * Crawler Configuration Validation
 * 
 * Validates and sanitizes crawler options to enforce safety constraints
 * and prevent misconfiguration that could lead to DoS or ethical violations.
 */

import { CrawlerOptions } from '@/security/dynamic/crawler';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized: Required<CrawlerOptions>;
}

/**
 * Validation constraints for crawler options
 * 
 * These limits prevent:
 * - Resource exhaustion (excessive depth/pages)
 * - DoS attacks (too-fast rate limiting)
 * - Unethical behavior (ignoring robots.txt without consent)
 */
const VALIDATION_CONSTRAINTS = {
  maxDepth: {
    min: 1,
    max: 5,
    default: 2,
    message: 'maxDepth must be between 1 and 5'
  },
  maxPages: {
    min: 1,
    max: 200,
    default: 50,
    message: 'maxPages must be between 1 and 200'
  },
  rateLimit: {
    min: 100,
    max: 5000,
    default: 1000,
    warning: 500, // Warn if below this threshold
    message: 'rateLimit must be between 100ms and 5000ms'
  },
  timeout: {
    min: 5000,
    max: 30000,
    default: 10000,
    message: 'timeout must be between 5000ms and 30000ms'
  }
};

/**
 * Validate and sanitize crawler options
 * 
 * @param options - User-provided crawler options (may be partial or invalid)
 * @param requiresConsent - Whether robots.txt override requires explicit consent
 * @returns ValidationResult with sanitized options or error messages
 */
export function validateCrawlerOptions(
  options: Partial<CrawlerOptions> = {},
  requiresConsent: boolean = true
): ValidationResult {
  const errors: string[] = [];

  // Validate maxDepth
  let maxDepth = options.maxDepth ?? VALIDATION_CONSTRAINTS.maxDepth.default;
  if (maxDepth < VALIDATION_CONSTRAINTS.maxDepth.min || maxDepth > VALIDATION_CONSTRAINTS.maxDepth.max) {
    errors.push(VALIDATION_CONSTRAINTS.maxDepth.message);
    maxDepth = VALIDATION_CONSTRAINTS.maxDepth.default;
  }

  // Validate maxPages
  let maxPages = options.maxPages ?? VALIDATION_CONSTRAINTS.maxPages.default;
  if (maxPages < VALIDATION_CONSTRAINTS.maxPages.min || maxPages > VALIDATION_CONSTRAINTS.maxPages.max) {
    errors.push(VALIDATION_CONSTRAINTS.maxPages.message);
    maxPages = VALIDATION_CONSTRAINTS.maxPages.default;
  }

  // Validate rateLimit
  let rateLimit = options.rateLimit ?? VALIDATION_CONSTRAINTS.rateLimit.default;
  if (rateLimit < VALIDATION_CONSTRAINTS.rateLimit.min || rateLimit > VALIDATION_CONSTRAINTS.rateLimit.max) {
    errors.push(VALIDATION_CONSTRAINTS.rateLimit.message);
    rateLimit = VALIDATION_CONSTRAINTS.rateLimit.default;
  } else if (rateLimit < VALIDATION_CONSTRAINTS.rateLimit.warning) {
    errors.push(`Warning: rateLimit below ${VALIDATION_CONSTRAINTS.rateLimit.warning}ms may trigger WAF/rate limit blocks`);
  }

  // Validate timeout
  let timeout = options.timeout ?? VALIDATION_CONSTRAINTS.timeout.default;
  if (timeout < VALIDATION_CONSTRAINTS.timeout.min || timeout > VALIDATION_CONSTRAINTS.timeout.max) {
    errors.push(VALIDATION_CONSTRAINTS.timeout.message);
    timeout = VALIDATION_CONSTRAINTS.timeout.default;
  }

  // Validate respectRobotsTxt
  let respectRobotsTxt = options.respectRobotsTxt ?? true;
  if (respectRobotsTxt === false && requiresConsent) {
    errors.push('Disabling robots.txt compliance requires explicit consent for authorized testing');
    respectRobotsTxt = true; // Force to true if consent not provided
  }

  // Validate allowExternalLinks
  const allowExternalLinks = options.allowExternalLinks ?? false;

  const sanitized: Required<Omit<CrawlerOptions, 'sessionCredentials'>> = {
    maxDepth,
    maxPages,
    rateLimit,
    respectRobotsTxt,
    allowExternalLinks,
    timeout
  };

  return {
    valid: errors.length === 0,
    errors,
    sanitized: sanitized as Required<CrawlerOptions> // Type assertion since sessionCredentials will be added later
  };
}

/**
 * Get safe crawler options with validation
 * 
 * Wrapper that validates options and throws on critical errors
 * 
 * @param options - User-provided crawler options
 * @param allowRobotsTxtOverride - Whether to allow robots.txt to be disabled
 * @returns Validated and sanitized crawler options
 * @throws Error if validation fails with critical errors
 */
export function getSafeCrawlerOptions(
  options: Partial<CrawlerOptions> = {},
  allowRobotsTxtOverride: boolean = false
): Required<CrawlerOptions> {
  const validation = validateCrawlerOptions(options, !allowRobotsTxtOverride);

  // Critical errors (invalid ranges) should throw
  const criticalErrors = validation.errors.filter(err => !err.startsWith('Warning:'));
  if (criticalErrors.length > 0) {
    throw new Error(`Invalid crawler configuration: ${criticalErrors.join(', ')}`);
  }

  // Log warnings but continue
  const warnings = validation.errors.filter(err => err.startsWith('Warning:'));
  if (warnings.length > 0) {
    console.warn('Crawler configuration warnings:', warnings);
  }

  return validation.sanitized;
}

/**
 * Get documentation for crawler options
 * 
 * Returns human-readable descriptions and constraints for UI display
 */
export function getCrawlerOptionsDocumentation(): Record<keyof Omit<CrawlerOptions, 'sessionCredentials'>, { description: string; constraint: string }> {
  return {
    maxDepth: {
      description: 'Maximum crawl depth (levels from start URL)',
      constraint: `${VALIDATION_CONSTRAINTS.maxDepth.min}-${VALIDATION_CONSTRAINTS.maxDepth.max} (default: ${VALIDATION_CONSTRAINTS.maxDepth.default})`
    },
    maxPages: {
      description: 'Maximum pages to crawl before stopping',
      constraint: `${VALIDATION_CONSTRAINTS.maxPages.min}-${VALIDATION_CONSTRAINTS.maxPages.max} (default: ${VALIDATION_CONSTRAINTS.maxPages.default})`
    },
    rateLimit: {
      description: 'Milliseconds to wait between requests',
      constraint: `${VALIDATION_CONSTRAINTS.rateLimit.min}-${VALIDATION_CONSTRAINTS.rateLimit.max}ms (default: ${VALIDATION_CONSTRAINTS.rateLimit.default}ms)`
    },
    respectRobotsTxt: {
      description: 'Honor robots.txt directives (ethical crawling)',
      constraint: 'true/false (default: true)'
    },
    allowExternalLinks: {
      description: 'Crawl external (cross-origin) links',
      constraint: 'true/false (default: false)'
    },
    timeout: {
      description: 'Request timeout in milliseconds',
      constraint: `${VALIDATION_CONSTRAINTS.timeout.min}-${VALIDATION_CONSTRAINTS.timeout.max}ms (default: ${VALIDATION_CONSTRAINTS.timeout.default}ms)`
    }
  };
}
