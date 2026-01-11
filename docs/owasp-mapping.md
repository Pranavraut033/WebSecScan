# OWASP Top 10 2021 → 2025 Migration Mapping

This document defines the canonical mapping between OWASP Top 10 2021 and 2025 taxonomies for WebSecScan.

**Migration Date:** January 11, 2026  
**Effective Version:** WebSecScan v2.0

---

## Complete Mapping Table

| 2021 ID   | 2021 Name                                  | 2025 ID   | 2025 Name                                   | Notes                                    |
|-----------|-------------------------------------------|-----------|---------------------------------------------|------------------------------------------|
| A01:2021  | Broken Access Control                     | A01:2025  | Broken Access Control                       | No semantic change                       |
| A02:2021  | Cryptographic Failures                    | A04:2025  | Cryptographic Failures                      | Moved from #2 to #4                      |
| A03:2021  | Injection                                 | A05:2025  | Injection                                   | Moved from #3 to #5                      |
| A04:2021  | Insecure Design                           | A06:2025  | Insecure Design                             | Moved from #4 to #6                      |
| A05:2021  | Security Misconfiguration                 | A02:2025  | Security Misconfiguration                   | **CRITICAL: Moved from #5 to #2**        |
| A06:2021  | Vulnerable and Outdated Components        | A03:2025  | Software Supply Chain Failures              | Renamed + expanded scope                 |
| A07:2021  | Identification and Authentication Failures| A07:2025  | Authentication Failures                     | Name simplified                          |
| A08:2021  | Software and Data Integrity Failures      | A08:2025  | Software or Data Integrity Failures         | Minor grammar change                     |
| A09:2021  | Security Logging and Monitoring Failures  | A09:2025  | Security Logging and Alerting Failures      | Expanded to include alerting             |
| A10:2021  | Server-Side Request Forgery (SSRF)        | A01:2025  | Broken Access Control                       | **MERGED into A01 (subtype preserved)**  |
| —         | —                                         | A10:2025  | Mishandling of Exceptional Conditions       | **NEW in 2025**                          |

---

## Critical Changes

### 1. Security Misconfiguration (A05 → A02)
**Most common misclassification risk.**

All findings previously categorized as `A05:2021` must now be `A02:2025`:
- Missing security headers (CSP, HSTS, X-Frame-Options, etc.)
- Misconfigured CORS
- Verbose error messages
- Default credentials enabled
- Directory listing enabled
- Unnecessary services running

**Example:**
```typescript
// ❌ WRONG (would falsely classify as Injection)
owaspCategory: 'A05:2025'

// ✅ CORRECT
owaspCategory: 'A02:2025'
```

### 2. SSRF No Longer Standalone (A10:2021 → A01:2025)
SSRF is now a **subtype** of Broken Access Control.

Detection logic must:
- Classify as `A01:2025`
- Retain "SSRF" in title/description for precision
- Map historical A10:2021 findings to A01:2025 in benchmarks

**Example:**
```typescript
{
  owaspCategory: 'A01:2025',  // Not A10
  title: 'Server-Side Request Forgery (SSRF)',
  subtype: 'SSRF'
}
```

### 3. New Category: Exception Handling (A10:2025)
Detects mishandling of errors and exceptional states:
- Stack traces in production
- Debug mode enabled in production
- Fail-open authentication/authorization
- Uncaught exceptions exposing internal state
- Error messages revealing system information

---

## Implementation Guidelines

### For Analyzers
When emitting a vulnerability:
1. Check the mapping table above
2. Use the **2025 ID** that corresponds to the semantic meaning
3. Preserve subtypes (e.g., "SSRF", "XSS", "SQLi") in metadata

### For Tests
All test assertions must verify **2025 categories**:
```typescript
// ❌ WRONG
expect(finding.owaspCategory).toBe('A05:2021')

// ✅ CORRECT
expect(finding.owaspCategory).toBe('A02:2025')
```

### For Benchmarks
Historical data aggregation must apply this mapping:
- Group by 2025 categories when comparing across time
- Preserve 2021 labels in historical result files
- Document the migration date in reports

---

## What NOT to Change

- **CVE identifiers**: `CVE-2021-12345` remains unchanged
- **Publication dates**: Keep original dates in references
- **Historical scan results**: Archive as-is; apply mapping in reporting layer

---

## Verification Checklist

Before deploying:
- [ ] All analyzers emit 2025 categories
- [ ] All tests assert 2025 categories
- [ ] Benchmark scripts apply the mapping
- [ ] Documentation reflects 2025 taxonomy
- [ ] No false classifications (e.g., headers as Injection)
- [ ] SSRF correctly mapped to A01:2025
- [ ] A10:2025 detection implemented

---

## References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Top 10 2025 (Draft)](https://owasp.org/Top10/)
- WebSecScan Internal Specification: `project-specifications.md`

---

**Document Maintainer:** WebSecScan Team  
**Last Updated:** January 11, 2026
