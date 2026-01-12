# Detection Details & Security Scoring

Technical reference for security header analysis, CSRF protection, URL validation, and vulnerability scoring.

---

## Security Header Detection

### Content-Security-Policy (CSP)

**Checks**:
- ✅ Header present
- ✅ Directives valid
- ✅ Script sources restricted
- ✅ Style sources restricted

**Examples**:
```
CSP: default-src 'self'; script-src 'self' trusted.com
  ✅ Restricts scripts to same-origin or trusted domain
  ✅ Provides XSS mitigation

CSP: default-src *
  ⚠️ Too permissive; allows any source
  ⚠️ Severity: MEDIUM
```

### HSTS (Strict-Transport-Security)

**Checks**:
- ✅ Header present on HTTPS
- ✅ max-age set appropriately (≥31536000 = 1 year)
- ✅ includeSubDomains directive
- ✅ preload directive (optional but recommended)

### X-Frame-Options

**Checks**:
- ✅ DENY (best) — No embedding
- ✅ SAMEORIGIN — Only same-origin embedding
- ❌ ALLOWALL or missing — Vulnerable to clickjacking

---

## CSRF Protection Analysis

### Token Validation

WebSecScan checks for CSRF tokens using 8+ patterns:

```
_csrf
_token
__RequestVerificationToken
authenticity_token
csrf_token
csrftoken
csrfmiddlewaretoken
verify-token
```

### Token Quality Checks

| Check | Good | Bad |
|-------|------|-----|
| **Entropy** | >128 bits | Predictable/short |
| **Uniqueness** | Different per request | Same across requests |
| **Format** | Random hex/base64 | Sequential or guessable |

### SameSite Cookies

```
Set-Cookie: session=abc123; SameSite=Strict
  ✅ Best: CSRF impossible

Set-Cookie: session=abc123; SameSite=Lax
  ✅ Good: Protects against most attacks

Set-Cookie: session=abc123
  ⚠️ Bad: No SameSite protection
```

---

## URL Validation & Normalization

### Protocol Handling

```
Input: example.com
  ↓ Auto-add protocol
Output: https://example.com
  (HTTPS is default)

Input: http://legacy-site.com
  ↓ Try HTTPS upgrade
Output: https://legacy-site.com
  (If HTTPS works)

Input: http://http-only.com
  ↓ HTTPS unavailable
Output: http://http-only.com
  ⚠️ Flagged as INSECURE_PROTOCOL
```

### Redirect Detection

```
Input: example.com
  ↓ Follow redirects
Redirect: → www.example.com
Final: https://www.example.com

Output:
  targetUrl: "https://www.example.com"
  isWwwRedirect: true
  warnings: ["Redirects from non-www to www"]
```

---

## Security Scoring Algorithm

### Formula

```
Score = 100 - (CriticalCount × 25 + HighCount × 15 + MediumCount × 8 + LowCount × 2)
```

**Capped at 0-100**

### Examples

```
No vulnerabilities
  Score = 100 - (0 + 0 + 0 + 0) = 100 ✅ (LOW RISK)

1 CRITICAL, 2 HIGH, 1 MEDIUM
  Score = 100 - (1×25 + 2×15 + 1×8 + 0) = 100 - 63 = 37 🔴 (CRITICAL RISK)

5 MEDIUM, 3 LOW
  Score = 100 - (0 + 0 + 5×8 + 3×2) = 100 - 46 = 54 🟠 (HIGH RISK)
```

### Risk Levels

| Score | Level | Color | Action |
|-------|-------|-------|--------|
| 90-100 | LOW | 🟢 Green | Monitor |
| 70-89 | MEDIUM | 🟡 Yellow | Plan fixes |
| 40-69 | HIGH | 🟠 Orange | Fix soon |
| 0-39 | CRITICAL | 🔴 Red | Fix immediately |

### Context-Aware Adjustments

Confidence is adjusted based on context:

```
Detected: eval() in code
Base confidence: HIGH

Framework detection: React.js detected
  → eval() in React context is more likely false positive
  → Confidence reduced: HIGH → MEDIUM

Minification: Code is minified
  → Less reliable pattern matching
  → Confidence reduced: HIGH → MEDIUM

Data flow: User input flows into eval()
  → Highly likely real vulnerability
  → Confidence maintained: HIGH
```

---

## CVSS-Inspired Scoring

WebSecScan adapts CVSS v3.1 concepts:

| Factor | Impact |
|--------|--------|
| **Exploitability** | CRITICAL (10) → LOW (3) |
| **Impact** | Confidentiality / Integrity / Availability |
| **Scope** | Changed (higher score) vs Unchanged |

Example:

```
XSS Vulnerability:
- Exploitability: EASY (network, no auth required) → 8.8
- Impact: HIGH (can steal session, modify page) → 8.8
- Scope: CHANGED (other users affected) → 9.8 → HIGH severity

Result: A03:2025 (Injection), HIGH severity
```

---

## False Positive Reduction

### Evidence Requirement

Findings must include actual evidence:

```
❌ Bad:
  Finding: "XSS vulnerability may exist"
  Evidence: null

✅ Good:
  Finding: "Reflected XSS in /search"
  Evidence: "Payload '<img src=x onerror=1>' found in response"
```

### Minification Handling

```javascript
// Minified code
eval('a');  // Less reliable detection

// Non-minified code
eval(userInput);  // Very reliable
```

Confidence adjusted accordingly.

---

## Next Steps

- **[OWASP 2025](owasp-2025.md)** — Vulnerability categories
- **[Reducing False Positives](reducing-false-positives.md)** — Accuracy improvements
- **[Dynamic Testing](../scanning/dynamic-testing.md)** — Runtime testing details
