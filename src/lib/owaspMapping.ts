/**
 * OWASP Top 10 2021 → 2025 Semantic Migration Mapping
 * 
 * This is the single source of truth for OWASP category mappings.
 * See docs/owasp-mapping.md for complete documentation.
 * 
 * CRITICAL: This is NOT a simple string replacement.
 * The 2025 taxonomy reordered and merged categories.
 * 
 * @see https://owasp.org/Top10/
 */

export type OWASP2021Category =
  | 'A01:2021' | 'A02:2021' | 'A03:2021' | 'A04:2021' | 'A05:2021'
  | 'A06:2021' | 'A07:2021' | 'A08:2021' | 'A09:2021' | 'A10:2021';

export type OWASP2025Category =
  | 'A01:2025' | 'A02:2025' | 'A03:2025' | 'A04:2025' | 'A05:2025'
  | 'A06:2025' | 'A07:2025' | 'A08:2025' | 'A09:2025' | 'A10:2025';

export interface OWASPMapping {
  id2021: OWASP2021Category;
  name2021: string;
  id2025: OWASP2025Category;
  name2025: string;
  notes: string;
}

/**
 * Canonical mapping table between OWASP 2021 and 2025 taxonomies.
 * 
 * CRITICAL CHANGES:
 * - A05:2021 (Security Misconfiguration) → A02:2025 (NOT A05:2025!)
 * - A10:2021 (SSRF) → A01:2025 (merged into Broken Access Control)
 * - A10:2025 is NEW (Mishandling of Exceptional Conditions)
 */
export const OWASP_MAPPING: OWASPMapping[] = [
  {
    id2021: 'A01:2021',
    name2021: 'Broken Access Control',
    id2025: 'A01:2025',
    name2025: 'Broken Access Control',
    notes: 'No semantic change'
  },
  {
    id2021: 'A02:2021',
    name2021: 'Cryptographic Failures',
    id2025: 'A04:2025',
    name2025: 'Cryptographic Failures',
    notes: 'Moved from #2 to #4'
  },
  {
    id2021: 'A03:2021',
    name2021: 'Injection',
    id2025: 'A05:2025',
    name2025: 'Injection',
    notes: 'Moved from #3 to #5'
  },
  {
    id2021: 'A04:2021',
    name2021: 'Insecure Design',
    id2025: 'A06:2025',
    name2025: 'Insecure Design',
    notes: 'Moved from #4 to #6'
  },
  {
    id2021: 'A05:2021',
    name2021: 'Security Misconfiguration',
    id2025: 'A02:2025',
    name2025: 'Security Misconfiguration',
    notes: 'CRITICAL: Moved from #5 to #2'
  },
  {
    id2021: 'A06:2021',
    name2021: 'Vulnerable and Outdated Components',
    id2025: 'A03:2025',
    name2025: 'Software Supply Chain Failures',
    notes: 'Renamed and expanded scope'
  },
  {
    id2021: 'A07:2021',
    name2021: 'Identification and Authentication Failures',
    id2025: 'A07:2025',
    name2025: 'Authentication Failures',
    notes: 'Name simplified'
  },
  {
    id2021: 'A08:2021',
    name2021: 'Software and Data Integrity Failures',
    id2025: 'A08:2025',
    name2025: 'Software or Data Integrity Failures',
    notes: 'Minor grammar change'
  },
  {
    id2021: 'A09:2021',
    name2021: 'Security Logging and Monitoring Failures',
    id2025: 'A09:2025',
    name2025: 'Security Logging and Alerting Failures',
    notes: 'Expanded to include alerting'
  },
  {
    id2021: 'A10:2021',
    name2021: 'Server-Side Request Forgery (SSRF)',
    id2025: 'A01:2025',
    name2025: 'Broken Access Control',
    notes: 'MERGED into A01 (subtype preserved)'
  }
];

/**
 * Quick lookup: 2021 ID → 2025 ID
 */
export const OWASP_2021_TO_2025: Record<OWASP2021Category, OWASP2025Category> = {
  'A01:2021': 'A01:2025',
  'A02:2021': 'A04:2025',
  'A03:2021': 'A05:2025',
  'A04:2021': 'A06:2025',
  'A05:2021': 'A02:2025', // ⚠️ CRITICAL: NOT A05:2025
  'A06:2021': 'A03:2025',
  'A07:2021': 'A07:2025',
  'A08:2021': 'A08:2025',
  'A09:2021': 'A09:2025',
  'A10:2021': 'A01:2025'  // ⚠️ SSRF merged into Broken Access Control
};

/**
 * Quick lookup: 2025 ID → 2025 Name
 */
export const OWASP_2025_NAMES: Record<OWASP2025Category, string> = {
  'A01:2025': 'Broken Access Control',
  'A02:2025': 'Security Misconfiguration',
  'A03:2025': 'Software Supply Chain Failures',
  'A04:2025': 'Cryptographic Failures',
  'A05:2025': 'Injection',
  'A06:2025': 'Insecure Design',
  'A07:2025': 'Authentication Failures',
  'A08:2025': 'Software or Data Integrity Failures',
  'A09:2025': 'Security Logging and Alerting Failures',
  'A10:2025': 'Mishandling of Exceptional Conditions'
};

/**
 * Migrate a 2021 category to 2025 taxonomy.
 * 
 * @param category2021 - OWASP 2021 category ID
 * @returns Corresponding OWASP 2025 category ID
 * 
 * @example
 * migrateCategory('A05:2021') // Returns 'A02:2025' (NOT A05:2025!)
 * migrateCategory('A10:2021') // Returns 'A01:2025' (SSRF merged)
 */
export function migrateCategory(category2021: OWASP2021Category): OWASP2025Category {
  return OWASP_2021_TO_2025[category2021];
}

/**
 * Get the full name for a 2025 category.
 * 
 * @param category2025 - OWASP 2025 category ID
 * @returns Human-readable category name
 * 
 * @example
 * getCategoryName('A02:2025') // Returns 'Security Misconfiguration'
 */
export function getCategoryName(category2025: OWASP2025Category): string {
  return OWASP_2025_NAMES[category2025];
}

/**
 * Check if a category is valid in the 2025 taxonomy.
 * 
 * @param category - Category ID to validate
 * @returns true if valid 2025 category
 */
export function isValid2025Category(category: string): category is OWASP2025Category {
  return category in OWASP_2025_NAMES;
}

/**
 * Special handling for SSRF: It's now a subtype of A01:2025.
 * Use this when you need to preserve SSRF-specific information.
 * 
 * @example
 * {
 *   owaspCategory: 'A01:2025',
 *   subtype: 'SSRF',
 *   title: 'Server-Side Request Forgery (SSRF)'
 * }
 */
export const SSRF_SUBTYPE = 'SSRF';

/**
 * Categories that should be mapped to A10:2025 (NEW in 2025).
 * 
 * Detects mishandling of errors and exceptional states:
 * - Stack traces in production
 * - Debug mode enabled
 * - Fail-open logic
 * - Uncaught exceptions exposing internal state
 */
export const A10_2025_KEYWORDS = [
  'stack trace',
  'debug mode',
  'fail-open',
  'fail open',
  'exception',
  'error handler',
  'error handling',
  'uncaught exception',
  'unhandled exception',
  'verbose error'
];
