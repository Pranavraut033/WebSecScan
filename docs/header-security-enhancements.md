# HTTP Security Header Enhancements

**Date**: January 11, 2026  
**Status**: ✅ Completed  
**OWASP Mapping**: A02:2025 - Security Misconfiguration

## Overview

Enhanced the `headerAnalyzer.ts` module to detect 5 additional critical HTTP security header misconfigurations that were previously missed compared to OWASP ZAP baseline scans.

## New Security Checks

### 1. CORS Configuration Validation

**Risk**: Misconfigured CORS allows unauthorized origins to access sensitive data

**Checks**:
- ❌ **CRITICAL (-25)**: Wildcard origin (`*`) with credentials enabled
- ❌ **HIGH (-10)**: Wildcard origin without credentials
- ✅ **PASS**: Specific origins or no CORS headers (restrictive)

**Example Detection**:
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
```
→ **CRITICAL**: Any origin can access sensitive data with user credentials

### 2. Permissions-Policy

**Risk**: Unrestricted access to sensitive browser features (camera, microphone, geolocation, payment, USB)

**Checks**:
- ❌ **FAIL (-5)**: Missing Permissions-Policy header
- ❌ **FAIL (-10)**: Sensitive features allow all origins (`*`)
- ✅ **PASS (+5)**: Properly restricted features

**Sensitive Features Monitored**:
- `camera`, `microphone`, `geolocation`, `payment`, `usb`

**Example Detection**:
```http
Permissions-Policy: camera=*, microphone=(*)
```
→ **FAIL**: Camera and microphone accessible from any origin

### 3. Spectre Mitigation Headers

**Risk**: Side-channel timing attacks (Spectre/Meltdown variants)

**Checks**:
- ❌ **FAIL (-5)**: Missing both COEP and COOP
- ❌ **FAIL (-5)**: Weak values (e.g., `unsafe-none`)
- ❌ **FAIL (-5)**: Only one header present
- ✅ **PASS (+5)**: Both headers properly configured

**Required Headers**:
- `Cross-Origin-Embedder-Policy: require-corp` or `credentialless`
- `Cross-Origin-Opener-Policy: same-origin` or `same-origin-allow-popups`

### 4. Cross-Origin Script Inclusions

**Risk**: External scripts can execute arbitrary code and exfiltrate data

**Checks**:
- ❌ **FAIL (-10)**: External `<script src>` detected
- ✅ **PASS (+5)**: All scripts from same origin

**Detection**:
- Parses HTML content for `<script src>` tags
- Detects protocol-relative URLs (`//cdn.example.com/lib.js`)
- Differentiates CDN scripts from non-CDN external scripts
- Ignores data URIs and relative paths

**Example Detection**:
```html
<script src="https://untrusted.com/malicious.js"></script>
```
→ **FAIL**: External script from non-CDN origin

### 5. Enhanced X-Frame-Options Validation

**Risk**: Clickjacking attacks

**Status**: Already implemented, validated strictness (DENY/SAMEORIGIN)

## Implementation Details

### Modified Files

1. **`src/security/dynamic/headerAnalyzer.ts`**
   - Enhanced `analyzeHeaders()` signature to accept optional `htmlContent` parameter
   - Added 4 new check functions:
     - `checkCORS()`
     - `checkPermissionsPolicy()`
     - `checkSpectreMitigation()`
     - `checkCrossOriginScripts()`
   - All checks return OWASP A02:2025 mapping in `details` field

2. **`src/security/dynamic/cspAnalyzer.ts`**
   - Added OWASP A02:2025 metadata to CSP failure results
   - Already integrated in dynamic scan flow

3. **`src/app/actions.ts`**
   - Fetch HTML content alongside headers
   - Pass HTML to `analyzeHeaders()` for cross-origin script detection

### API Changes

```typescript
// Before
export async function analyzeHeaders(
  url: string,
  headers: Record<string, string>
): Promise<HeaderTestResult[]>

// After
export async function analyzeHeaders(
  url: string,
  headers: Record<string, string>,
  htmlContent?: string  // Optional: enables cross-origin script detection
): Promise<HeaderTestResult[]>
```

### Result Structure

All new checks return `HeaderTestResult` with:

```typescript
{
  testName: string;
  passed: boolean;
  score: number;
  result: 'Passed' | 'Failed' | 'Info';
  reason: string;
  recommendation?: string;
  details?: {
    owaspId: 'A02:2025',
    category: 'Security Misconfiguration',
    // ... additional check-specific data
  }
}
```

## Test Coverage

**File**: `__tests__/headerAnalyzer.extended.test.ts`

**Total Test Cases**: 18

- **CORS Configuration**: 4 tests
  - No CORS headers (pass)
  - Wildcard + credentials (critical fail)
  - Wildcard alone (fail)
  - Specific origin (pass)

- **Permissions-Policy**: 3 tests
  - Missing header (fail)
  - Properly configured (pass)
  - Unrestricted features (fail)

- **Spectre Mitigation**: 4 tests
  - Both missing (fail)
  - Properly configured (pass)
  - Weak COEP value (fail)
  - Only COEP present (fail)

- **Cross-Origin Scripts**: 6 tests
  - Same-origin scripts (pass)
  - External scripts (fail)
  - CDN scripts (fail but categorized)
  - Protocol-relative URLs (fail)
  - Data URIs (pass/ignored)
  - Missing HTML (no check)

- **Integration**: 1 test
  - All checks run together

## Security Impact

### Before Enhancement
- 5 critical security misconfigurations undetected
- Gap in OWASP A02:2025 coverage
- No CORS validation
- No Spectre mitigation checks
- No cross-origin resource detection

### After Enhancement
- ✅ Comprehensive CORS security validation
- ✅ Permissions-Policy enforcement detection
- ✅ Spectre/Meltdown mitigation verification
- ✅ External script inclusion detection
- ✅ Full OWASP A02:2025 alignment
- ✅ Actionable remediation guidance

## Usage Example

```typescript
import { analyzeHeaders } from '@/security/dynamic/headerAnalyzer';

// Fetch headers and HTML
const response = await fetch(targetUrl);
const headers = Object.fromEntries(response.headers);
const htmlContent = await response.text();

// Run all security checks
const results = await analyzeHeaders(targetUrl, headers, htmlContent);

// Filter for failures
const failures = results.filter(r => !r.passed);
console.log(`Found ${failures.length} header security issues`);

// Find OWASP A02:2025 issues
const a02Issues = results.filter(r => 
  r.details?.owaspId === 'A02:2025'
);
```

## Scoring Impact

- **CORS wildcard + credentials**: -25 points (CRITICAL)
- **CORS wildcard**: -10 points (HIGH)
- **Missing Permissions-Policy**: -5 points (MEDIUM)
- **Unrestricted Permissions-Policy**: -10 points (HIGH)
- **Missing Spectre headers**: -5 points (MEDIUM)
- **External scripts**: -10 points (HIGH)
- **Perfect security headers**: +5 points per check (bonus)

## Comparison with OWASP ZAP

| Check | ZAP Detects | WebSecScan Before | WebSecScan After |
|-------|-------------|-------------------|------------------|
| Missing CSP | ✅ | ✅ | ✅ |
| Missing HSTS | ✅ | ✅ | ✅ |
| CORS Misconfig | ✅ | ❌ | ✅ |
| Missing Permissions-Policy | ✅ | ❌ | ✅ |
| Missing Spectre Headers | ✅ | ❌ | ✅ |
| Cross-Origin Scripts | ✅ | ❌ | ✅ |
| X-Frame-Options | ✅ | ✅ | ✅ |

**Result**: Full parity with ZAP on HTTP security header checks

## Future Enhancements

1. **Subresource Integrity (SRI) Validation**
   - Check if external scripts have `integrity` attribute
   - Validate SRI hash format

2. **Content-Type Sniffing**
   - Detect mismatched Content-Type and file extensions
   - Validate MIME types

3. **Certificate Transparency**
   - Check for Expect-CT header
   - Validate CT log compliance

4. **HTTP/2 Security**
   - Validate HTTP/2 specific headers
   - Check for HTTP/2 push vulnerabilities

## References

- [OWASP A02:2025 - Security Misconfiguration](https://owasp.org/Top10/A02_2025-Security_Misconfiguration/)
- [MDN - CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [MDN - Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy)
- [web.dev - Cross-origin isolation](https://web.dev/coop-coep/)
- [OWASP ZAP Scanning Rules](https://www.zaproxy.org/docs/alerts/)

---

**Maintained by**: WebSecScan Security Team  
**Last Updated**: January 11, 2026
